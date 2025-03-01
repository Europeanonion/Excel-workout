import * as ExcelJS from 'exceljs';
import { parseExcelFile, ParsingResult } from './excelParser';
import { WorkoutProgram, Exercise } from '../../types';

describe('parseExcelFile', () => {
  let mockWorkbook: ExcelJS.Workbook;
  let mockFile: File;

  it('should parse a valid Excel file correctly', async () => {
    mockWorkbook = new ExcelJS.Workbook();
    const worksheet = mockWorkbook.addWorksheet('Workout Program');

    // Setup headers
    worksheet.addRow(['Program Name', 'Test Program']);
    worksheet.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);

    // Add sample workout data
    worksheet.addRow(['Push', 'Bench Press', '3', '8-12', '100', '8', '120', 'Keep tight form']);
    worksheet.addRow(['Push', 'Shoulder Press', '3', '8-12', '60', '7', '90', '']);

    const buffer = await mockWorkbook.xlsx.writeBuffer();
    mockFile = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'test.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    const result = await parseExcelFile(mockFile);

    expect(result).toBeDefined();
    
    // Handle both return types (for backward compatibility)
    const program = 'program' in result ? result.program : result;
    
    expect(program.name).toBe('Test Program');
    expect(program.workouts).toHaveLength(1);

    const pushWorkout = program.workouts[0];
    expect(pushWorkout.name).toBe('Push');
    expect(pushWorkout.exercises).toHaveLength(2);

    const [benchPress, shoulderPress] = pushWorkout.exercises;

    expect(benchPress).toEqual({
      name: 'Bench Press',
      sets: 3,
      reps: '8-12',
      load: 100,
      rpe: 8,
      rest: 120,
      notes: 'Keep tight form'
    });

    expect(shoulderPress).toEqual({
      name: 'Shoulder Press',
      sets: 3,
      reps: '8-12',
      load: 60,
      rpe: 7,
      rest: 90,
      notes: ''
    });
    
    // If it's a ParsingResult, check that there are no errors or warnings
    if ('errors' in result) {
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    }
  });

  it('should handle empty Excel file', async () => {
    const emptyWorkbook = new ExcelJS.Workbook();
    emptyWorkbook.addWorksheet('Empty');
    const buffer = await emptyWorkbook.xlsx.writeBuffer();
    const emptyFile = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'empty.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    await expect(parseExcelFile(emptyFile)).rejects.toThrow('Invalid Excel file format');
  });

  it('should handle missing required columns', async () => {
    const invalidWorkbook = new ExcelJS.Workbook();
    const worksheet = invalidWorkbook.addWorksheet('Invalid');
    worksheet.addRow(['Program Name', 'Test Program']);
    worksheet.addRow(['Workout', 'Exercise']); // Missing required columns

    const buffer = await invalidWorkbook.xlsx.writeBuffer();
    const invalidFile = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'invalid.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    await expect(parseExcelFile(invalidFile)).rejects.toThrow('Missing required columns');
  });

  it('should handle invalid data types', async () => {
    const invalidWorkbook = new ExcelJS.Workbook();
    const worksheet = invalidWorkbook.addWorksheet('Invalid Types');

    worksheet.addRow(['Program Name', 'Test Program']);
    worksheet.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);
    worksheet.addRow(['Push', 'Bench Press', 'invalid', '8-12', 'abc', '8', 'xyz', '']);

    const buffer = await invalidWorkbook.xlsx.writeBuffer();
    const invalidFile = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'invalid.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;
    await expect(parseExcelFile(invalidFile)).rejects.toThrow('Invalid data type');
  });

  // New tests for error handling functionality
  it('should continue processing with errors when continueOnError is true', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Error Tolerance Test');

    // Setup headers
    worksheet.addRow(['Program Name', 'Test Program']);
    worksheet.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);

    // Add valid data
    worksheet.addRow(['Push', 'Bench Press', '3', '8-12', '100', '8', '120', 'Keep tight form']);
    
    // Add row with invalid data
    worksheet.addRow(['Push', 'Shoulder Press', 'invalid', '8-12', 'abc', '7', 'xyz', '']);
    
    // Add another valid row
    worksheet.addRow(['Push', 'Tricep Extension', '3', '10-15', '50', '8', '60', '']);

    const buffer = await workbook.xlsx.writeBuffer();
    const file = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'error_tolerance.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    const result = await parseExcelFile(file, { continueOnError: true });
    
    // Should return a ParsingResult
    expect('program' in result).toBe(true);
    expect('errors' in result).toBe(true);
    expect('warnings' in result).toBe(true);
    
    const parsingResult = result as ParsingResult;
    
    // Should have errors for the invalid data
    expect(parsingResult.errors.length).toBeGreaterThan(0);
    
    // Should still have valid exercises
    expect(parsingResult.program.workouts.length).toBe(1);
    expect(parsingResult.program.workouts[0].exercises.length).toBe(2); // Only valid exercises
    
    // Check that valid exercises were processed correctly
    const exercises = parsingResult.program.workouts[0].exercises;
    expect(exercises[0].name).toBe('Bench Press');
    expect(exercises[1].name).toBe('Tricep Extension');
  });

  it('should handle missing data with default values', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Default Values Test');

    // Setup headers
    worksheet.addRow(['Program Name', 'Test Program']);
    worksheet.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);

    // Add row with missing data
    worksheet.addRow(['Push', 'Bench Press', '', '', '', '', '', '']);

    const buffer = await workbook.xlsx.writeBuffer();
    const file = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'default_values.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    const defaultValues = {
      sets: 3,
      reps: '8-12',
      load: 100,
      rpe: 8,
      rest: 60,
      notes: 'Default note'
    };

    const result = await parseExcelFile(file, {
      continueOnError: true,
      defaultValues
    });
    
    expect('program' in result).toBe(true);
    const parsingResult = result as ParsingResult;
    
    // Should have warnings for the missing data
    expect(parsingResult.warnings.length).toBeGreaterThan(0);
    
    // Should use default values
    const exercise = parsingResult.program.workouts[0].exercises[0];
    expect(exercise.sets).toBe(defaultValues.sets);
    expect(exercise.reps).toBe(defaultValues.reps);
    expect(exercise.load).toBe(defaultValues.load);
    expect(exercise.rpe).toBe(defaultValues.rpe);
    expect(exercise.rest).toBe(defaultValues.rest);
    expect(exercise.notes).toBe(defaultValues.notes);
  });

  it('should handle multi-sheet Excel files', async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Add first sheet with data
    const sheet1 = workbook.addWorksheet('Sheet1');
    sheet1.addRow(['Program Name', 'Program 1']);
    sheet1.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);
    sheet1.addRow(['Push', 'Bench Press', '3', '8-12', '100', '8', '120', '']);
    
    // Add second sheet with different data
    const sheet2 = workbook.addWorksheet('Sheet2');
    sheet2.addRow(['Program Name', 'Program 2']);
    sheet2.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);
    sheet2.addRow(['Pull', 'Pull-up', '4', '6-8', '0', '9', '90', '']);
    
    const buffer = await workbook.xlsx.writeBuffer();
    const file = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'multi_sheet.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    // Parse with default sheet (first sheet)
    const result1 = await parseExcelFile(file);
    const program1 = 'program' in result1 ? result1.program : result1;
    expect(program1.name).toBe('Program 1');
    expect(program1.workouts[0].name).toBe('Push');
    
    // Parse with specified sheet name
    const result2 = await parseExcelFile(file, { sheetNameOrIndex: 'Sheet2' });
    const program2 = 'program' in result2 ? result2.program : result2;
    expect(program2.name).toBe('Program 2');
    expect(program2.workouts[0].name).toBe('Pull');
    
    // Parse with specified sheet index
    const result3 = await parseExcelFile(file, { sheetNameOrIndex: 2 }); // 1-based index
    const program3 = 'program' in result3 ? result3.program : result3;
    expect(program3.name).toBe('Program 2');
    expect(program3.workouts[0].name).toBe('Pull');
  });

  it('should handle non-existent sheet with continueOnError', async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Add sheet with data
    const sheet = workbook.addWorksheet('Sheet1');
    sheet.addRow(['Program Name', 'Test Program']);
    sheet.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);
    sheet.addRow(['Push', 'Bench Press', '3', '8-12', '100', '8', '120', '']);
    
    const buffer = await workbook.xlsx.writeBuffer();
    const file = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'sheet_error.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    // Try to parse non-existent sheet with continueOnError
    const result = await parseExcelFile(file, {
      sheetNameOrIndex: 'NonExistentSheet',
      continueOnError: true
    });
    
    expect('program' in result).toBe(true);
    const parsingResult = result as ParsingResult;
    
    // Should have a warning about the sheet not found
    expect(parsingResult.warnings.length).toBeGreaterThan(0);
    expect(parsingResult.warnings[0].message).toContain('Sheet "NonExistentSheet" not found');
    
    // Should fall back to first sheet
    expect(parsingResult.program.name).toBe('Test Program');
    expect(parsingResult.program.workouts[0].name).toBe('Push');
  });

  it('should auto-detect and convert data types', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Type Test');

    // Setup headers
    worksheet.addRow(['Program Name', 'Test Program']);
    worksheet.addRow(['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest', 'Notes']);

    // Add rows with various data formats
    worksheet.addRow(['Push', 'Bench Press', '3', '8-12', '100', '8', '120', '']);
    worksheet.addRow(['Push', 'Shoulder Press', '3.0', '10', '60.5', '7.5', '90.0', '']);
    worksheet.addRow(['Push', 'Tricep Extension', ' 4 ', '12', ' 45 kg ', '8', ' 60 sec ', '']);
    worksheet.addRow(['Push', 'Chest Fly', 'N/A', '15', 'TBD', 'n/a', 'unknown', '']);

    const buffer = await workbook.xlsx.writeBuffer();
    const file = {
      arrayBuffer: () => Promise.resolve(buffer),
      name: 'data_types.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } as unknown as File;

    const result = await parseExcelFile(file, { continueOnError: true });
    
    expect('program' in result).toBe(true);
    const parsingResult = result as ParsingResult;
    
    // Should have warnings for the data type conversions
    expect(parsingResult.warnings.some(w => w.message.includes('auto-converted'))).toBe(true);
    
    const exercises = parsingResult.program.workouts[0].exercises;
    
    // Check numeric conversions
    expect(exercises[0].sets).toBe(3);
    expect(exercises[1].sets).toBe(3);
    expect(exercises[1].load).toBe(60.5);
    expect(exercises[1].rpe).toBe(7.5);
    
    // Check string trimming and unit removal
    expect(exercises[2].sets).toBe(4);
    expect(exercises[2].load).toBe(45);
    expect(exercises[2].rest).toBe(60);
    
    // Check special case handling
    expect(exercises[3].sets).toBe(null);
    expect(exercises[3].load).toBe(null);
    expect(exercises[3].rpe).toBe(null);
    expect(exercises[3].rest).toBe(null);
  });
});
