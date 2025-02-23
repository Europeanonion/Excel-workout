import * as XLSX from 'xlsx';
import { Workout, Exercise, WorkoutProgram } from '../../types';
import { initDB, storeWorkoutProgram } from '../../lib/indexedDB';
import { v4 as uuidv4 } from 'uuid';

export async function parseExcelFile(file: File): Promise<Workout[]> {
  try {
    await initDB(); // Initialize the database
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    // Assuming the first sheet is the relevant one
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];

    // Convert to array of arrays
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!jsonData || jsonData.length === 0) {
      throw new Error("No data found in the Excel file (or file is too short).");
    }

    // Skip empty rows at the start
    const nonEmptyRows = jsonData.filter(row => 
      row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (nonEmptyRows.length === 0) {
      throw new Error("No data found in the Excel file (or file is too short).");
    }

    if (nonEmptyRows.length === 1) {
      throw new Error("Missing header row in the Excel file.");
    }

    const rawHeader = nonEmptyRows[0];
    const dataRows = nonEmptyRows.slice(1);

    // Dynamic header mapping
    const headerMap: { [key: string]: string } = {};
    let hasExerciseName = false;
    rawHeader.forEach((headerName, index) => {
      let lowerCaseHeader = '';
      if (typeof headerName === 'string') {
        lowerCaseHeader = headerName.toLowerCase();
      } else if (headerName !== null && headerName !== undefined) {
        lowerCaseHeader = String(headerName).toLowerCase();
      } else {
        return; // Skip null/undefined headers
      }

      if (lowerCaseHeader.includes('exercise') || lowerCaseHeader === 'exercise') {
        headerMap[index] = 'name';
        hasExerciseName = true;
      } else if (lowerCaseHeader.includes('warm-up sets')) {
        headerMap[index] = 'warmupSets';
      } else if (lowerCaseHeader.includes('working sets')) {
        headerMap[index] = 'workingSets';
      } else if (lowerCaseHeader.includes('reps')) {
        headerMap[index] = 'reps';
      } else if (lowerCaseHeader.includes('load')) {
        headerMap[index] = 'load';
      } else if (lowerCaseHeader.includes('rpe')) {
        headerMap[index] = 'rpe';
      } else if (lowerCaseHeader.includes('rest')) {
        headerMap[index] = 'rest';
      } else if (lowerCaseHeader.includes('substitution option 1')) {
        headerMap[index] = 'substitution1';
      } else if (lowerCaseHeader.includes('substitution option 2')) {
        headerMap[index] = 'substitution2';
      } else if (lowerCaseHeader.includes('notes')) {
        headerMap[index] = 'notes';
      }
    });

    if (!hasExerciseName) {
      throw new Error("Missing required 'Exercise' column in the Excel file.");
    }

    // Transform data rows into Exercise objects
    const exercises: Exercise[] = dataRows.map((row, rowIndex) => {
      const exercise: Partial<Exercise> = {
        load: null,
        rpe: null,
        rest: null,
        substitution1: null,
        substitution2: null,
        notes: null
      };
      row.forEach((cellValue, index) => {
        const fieldName = headerMap[index];
        if (fieldName) {
          if (cellValue === null || cellValue === undefined || (typeof cellValue === 'string' && cellValue.trim() === '')) {
            exercise[fieldName as keyof Exercise] = undefined;
          } else {
            // Handle name field separately since it's required and must be a string
            if (fieldName === 'name') {
              exercise.name = String(cellValue);
            }
            // Handle numeric fields that can be either string or number
            else if (fieldName === 'warmupSets' || fieldName === 'workingSets' || fieldName === 'load' || fieldName === 'rpe' || fieldName === 'rest') {
              const numValue = Number(cellValue);
              if (!isNaN(numValue)) {
                (exercise as any)[fieldName] = numValue;
              } else {
                (exercise as any)[fieldName] = String(cellValue);
              }
            }
            // Handle other fields as strings
            else {
              (exercise as any)[fieldName] = String(cellValue);
            }
          }
        }
      });

      if (!exercise.name) {
          console.warn(`Row ${rowIndex + 3} is missing an exercise name and might be skipped.`); // +3 because of skipping first two rows
      }
      return exercise as Exercise;
    }).filter(exercise => exercise.name !== undefined) as Exercise[];

    // Determine workout days and group exercises
    const workouts: Workout[] = [];
    let currentWorkout: Workout | null = null;

    dataRows.forEach((row, rowIndex) => {
      const exercise = exercises[rowIndex];
      if (exercise?.name) { // Check if exercise exists and has a name
        const match = exercise.name.match(/(Push|Pull|Legs) #(\d+)/i);
        if (match) {
          const day = `${match[1]} #${match[2]}`;

          // Extract week number from the first column
          let week = '';
          const weekCell = row[0];
          if (weekCell && typeof weekCell === 'string') {
            const weekMatch = weekCell.match(/(?:week|w)\s*(\d+)/i);
            if (weekMatch) {
              week = `Week ${weekMatch[1]}`;
            }
          }

          // Create a new workout object if the week or day changes.
          if (!currentWorkout || currentWorkout.day !== day || currentWorkout.week !== week) {
            currentWorkout = { week: week, day: day, exercises: [] };
            workouts.push(currentWorkout);
          }
          currentWorkout.exercises.push(exercise);
        }
      }
    });

    const programId = uuidv4();
    const workoutProgram: WorkoutProgram = {
        id: programId,
        name: 'Workout Program from Excel', // Placeholder name, can be updated later
        workouts: workouts,
        history: []
    };

    await storeWorkoutProgram(workoutProgram);
    return workouts;

  } catch (error: any) {
    console.error("Error parsing Excel file:", error);
    throw new Error(`Error parsing Excel file: ${error.message || error}`);
  }
}
