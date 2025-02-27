import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { Exercise, WorkoutProgram } from '../../types';

export async function parseExcelFile(file: File): Promise<WorkoutProgram> {
  try {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet || worksheet.rowCount < 2) {
      throw new Error('Invalid Excel file format. The file appears to be empty or improperly formatted.');
    }

    // Get program name from cell B1
    const programName = worksheet.getCell('B1').value?.toString() || 'Parsed Program';

    // Validate required columns
    const headerRow = worksheet.getRow(2);
    const requiredColumns = ['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest'];
    const headerValues = headerRow.values as (string | undefined)[];
    
    const missingColumns = requiredColumns.filter(column => !headerValues.includes(column));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Please ensure your file has all required columns.`);
    }

    // Parse workouts
    const workouts: any[] = [];
    let currentWorkout: any = null;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Skip header rows

      const exercise: Exercise = {
        name: row.getCell(2).value?.toString() || '',
        sets: parseInt(row.getCell(3).value?.toString() || '0'),
        reps: row.getCell(4).value?.toString() || '',
        load: parseInt(row.getCell(5).value?.toString() || '0'),
        rpe: parseInt(row.getCell(6).value?.toString() || '0'),
        rest: parseInt(row.getCell(7).value?.toString() || '0'),
        notes: row.getCell(8).value?.toString() || ''
      };

      if (isNaN(exercise.sets)) {
        throw new Error('Invalid data type detected. Please ensure all numeric fields contain valid numbers.');
      }

      const workoutName = row.getCell(1).value?.toString();
      if (workoutName && (!currentWorkout || currentWorkout.name !== workoutName)) {
        currentWorkout = {
          name: workoutName,
          exercises: []
        };
        workouts.push(currentWorkout);
      }

      if (currentWorkout) {
        currentWorkout.exercises.push(exercise);
      }
    });

    return {
      id: uuidv4(),
      name: programName,
      workouts,
      history: []
    };

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while parsing the Excel file.');
  }
}
