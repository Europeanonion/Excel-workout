import * as ExcelJS from 'exceljs';
import { parseExcelFile } from './excelParser';
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
    expect(result.name).toBe('Test Program');
    expect(result.workouts).toHaveLength(1);

    const pushWorkout = result.workouts[0];
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
});
