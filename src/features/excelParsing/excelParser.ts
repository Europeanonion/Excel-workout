import * as ExcelJS from 'exceljs';
import { Exercise, WorkoutProgram } from '../../types';

export async function parseExcelFile(file: File): Promise<WorkoutProgram> {
  try {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet || worksheet.rowCount < 2) {
      throw new Error('Invalid Excel file format');
    }

    // Get program name from cell B1
    const programName = worksheet.getCell('B1').value?.toString() || 'Parsed Program';

    // Validate required columns
    const headerRow = worksheet.getRow(2);
    const requiredColumns = ['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest'];
    const headerValues = headerRow.values as (string | undefined)[];
    
    requiredColumns.forEach(column => {
      if (!headerValues.includes(column)) {
        throw new Error('Missing required columns');
      }
    });

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
        throw new Error('Invalid data type');
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
      id: 'some-uuid', // You might want to generate this properly
      name: programName,
      workouts,
      history: []
    };

  } catch (error) {
    throw error;
  }
}
