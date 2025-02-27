import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import * as Papa from 'papaparse';
import { Exercise, WorkoutProgram, Workout } from '../../types';

/**
 * Parses an Excel or CSV file containing workout program data.
 * @param file The file to parse
 * @returns A WorkoutProgram object
 */
export async function parseExcelFile(file: File): Promise<WorkoutProgram> {
  try {
    // Determine file type based on extension
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (fileExtension === '.csv') {
      return await parseCSVFile(file);
    } else {
      return await parseExcelWorkbook(file);
    }
  } catch (error) {
    // Add more context to errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid data type')) {
        throw new Error('Invalid data type detected. Please ensure all numeric fields contain valid numbers.');
      }
      // Pass through other errors with their original messages
      throw error;
    }
    throw new Error('An unexpected error occurred while parsing the file.');
  }
}

/**
 * Parses an Excel workbook file.
 */
async function parseExcelWorkbook(file: File): Promise<WorkoutProgram> {
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
  const workouts: Workout[] = [];
  let currentWorkout: Workout | null = null;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip header rows

    try {
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
        throw new Error(`Invalid 'Sets' value at row ${rowNumber}. Expected a number.`);
      }

      if (isNaN(exercise.load)) {
        throw new Error(`Invalid 'Load' value at row ${rowNumber}. Expected a number.`);
      }

      if (isNaN(exercise.rpe)) {
        throw new Error(`Invalid 'RPE' value at row ${rowNumber}. Expected a number.`);
      }

      if (isNaN(exercise.rest)) {
        throw new Error(`Invalid 'Rest' value at row ${rowNumber}. Expected a number.`);
      }

      const workoutName = row.getCell(1).value?.toString();
      if (workoutName && (!currentWorkout || currentWorkout.name !== workoutName)) {
        currentWorkout = {
          name: workoutName,
          day: '', // Default empty day
          exercises: []
        };
        workouts.push(currentWorkout);
      }

      if (currentWorkout) {
        currentWorkout.exercises.push(exercise);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error parsing row ${rowNumber}: ${error}`);
    }
  });

  if (workouts.length === 0) {
    throw new Error('No valid workout data found in the file.');
  }

  return {
    id: uuidv4(), // Generate unique ID
    name: programName,
    workouts,
    history: []
  };
}

/**
 * Parses a CSV file.
 */
async function parseCSVFile(file: File): Promise<WorkoutProgram> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error('No data found in CSV file.');
          }

          // Check for required columns
          const requiredColumns = ['Workout', 'Exercise', 'Sets', 'Reps', 'Load', 'RPE', 'Rest'];
          const firstRow = results.data[0] as Record<string, unknown>;
          const headers = Object.keys(firstRow);
          
          const missingColumns = requiredColumns.filter(column => !headers.includes(column));
          if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Please ensure your CSV file has all required columns.`);
          }

          // Extract program name from first row if available
          const programName = 'CSV Workout Program';
          
          // Group by workout
          const workoutMap = new Map<string, Exercise[]>();
          
          results.data.forEach((row: any, index: number) => {
            if (!row.Workout || !row.Exercise) {
              return; // Skip rows without workout or exercise
            }

            try {
              const exercise: Exercise = {
                name: row.Exercise || '',
                sets: parseInt(row.Sets || '0'),
                reps: row.Reps || '',
                load: parseInt(row.Load || '0'),
                rpe: parseInt(row.RPE || '0'),
                rest: parseInt(row.Rest || '0'),
                notes: row.Notes || ''
              };

              if (isNaN(exercise.sets)) {
                throw new Error(`Invalid 'Sets' value at row ${index + 2}. Expected a number.`);
              }

              if (isNaN(exercise.load)) {
                throw new Error(`Invalid 'Load' value at row ${index + 2}. Expected a number.`);
              }

              if (isNaN(exercise.rpe)) {
                throw new Error(`Invalid 'RPE' value at row ${index + 2}. Expected a number.`);
              }

              if (isNaN(exercise.rest)) {
                throw new Error(`Invalid 'Rest' value at row ${index + 2}. Expected a number.`);
              }

              if (!workoutMap.has(row.Workout)) {
                workoutMap.set(row.Workout, []);
              }
              
              workoutMap.get(row.Workout)?.push(exercise);
            } catch (error) {
              if (error instanceof Error) {
                throw error;
              }
              throw new Error(`Error parsing row ${index + 2}: ${error}`);
            }
          });

          if (workoutMap.size === 0) {
            throw new Error('No valid workout data found in the CSV file.');
          }

          // Convert map to workouts array
          const workouts: Workout[] = Array.from(workoutMap.entries()).map(([name, exercises]) => ({
            name,
            day: '',
            exercises
          }));

          resolve({
            id: uuidv4(),
            name: programName,
            workouts,
            history: []
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}
