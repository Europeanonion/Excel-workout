import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import * as Papa from 'papaparse';
import { Exercise, WorkoutProgram, Workout, ColumnMappingConfig } from '../../types';

/**
 * Interface for parser options
 */
export interface ParserOptions {
  /** Custom column mapping configuration */
  columnMapping?: ColumnMappingConfig;
  /** Whether to evaluate Excel formulas */
  evaluateFormulas?: boolean;
  /** Sheet name or index to parse (for multi-sheet support) */
  sheetNameOrIndex?: string | number;
  /** Whether to continue processing when errors are encountered */
  continueOnError?: boolean;
  /** Default values for missing data */
  defaultValues?: {
    sets?: number;
    reps?: string;
    load?: number;
    rpe?: number;
    rest?: number;
    notes?: string;
  };
}

/**
 * Interface for parsing results including errors
 */
export interface ParsingResult {
  program: WorkoutProgram;
  errors: ParsingError[];
  warnings: ParsingWarning[];
}

/**
 * Interface for parsing errors
 */
export interface ParsingError {
  row: number;
  column?: string;
  message: string;
  critical: boolean;
}

/**
 * Interface for parsing warnings
 */
export interface ParsingWarning {
  row: number;
  column?: string;
  message: string;
  originalValue?: any;
  convertedValue?: any;
}

/**
 * UUID generation for workout programs
 * @returns A unique identifier string
 */
const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Default column mapping used when no custom mapping is provided
 */
const DEFAULT_COLUMN_MAPPING: ColumnMappingConfig = {
  workout: 'workout',
  exercise: 'exercise',
  sets: 'sets',
  reps: 'reps',
  load: 'load',
  rpe: 'rpe',
  rest: 'rest',
  notes: 'notes'
};

/**
 * Detects and converts a value to a number, with error handling
 * @param value The value to convert
 * @param defaultValue Default value to use if conversion fails
 * @param rowNumber Row number for error reporting
 * @param fieldName Field name for error reporting
 * @param errors Array to collect errors
 * @param warnings Array to collect warnings
 * @returns The converted number or default value
 */
function detectAndConvertNumber(
  value: string,
  defaultValue: number,
  rowNumber: number,
  fieldName: string,
  errors: ParsingError[],
  warnings: ParsingWarning[]
): number {
  // Handle empty values
  if (!value || value.trim() === '') {
    warnings.push({
      row: rowNumber,
      column: fieldName.toLowerCase(),
      message: `Empty '${fieldName}' value at row ${rowNumber}. Using default value ${defaultValue}.`,
      originalValue: value,
      convertedValue: defaultValue
    });
    return defaultValue;
  }

  // Try to convert to number
  const trimmedValue = value.trim();
  const parsedValue = parseFloat(trimmedValue);
  
  if (!isNaN(parsedValue)) {
    return parsedValue;
  }
  
  // Handle special cases like "N/A", "TBD", etc.
  const lowerValue = trimmedValue.toLowerCase();
  if (
    lowerValue === 'n/a' ||
    lowerValue === 'tbd' ||
    lowerValue === 'na' ||
    lowerValue === '-'
  ) {
    warnings.push({
      row: rowNumber,
      column: fieldName.toLowerCase(),
      message: `Non-numeric '${fieldName}' value "${value}" at row ${rowNumber}. Using default value ${defaultValue}.`,
      originalValue: value,
      convertedValue: defaultValue
    });
    return defaultValue;
  }
  
  // Add error for invalid number
  errors.push({
    row: rowNumber,
    column: fieldName.toLowerCase(),
    message: `Invalid '${fieldName}' value "${value}" at row ${rowNumber}. Expected a number.`,
    critical: false
  });
  
  return defaultValue;
}

/**
 * Parses an Excel or CSV file containing workout program data.
 * @param file The file to parse
 * @param options Optional parser options including column mapping, sheet selection, etc.
 * @returns A ParsingResult object containing the program, errors, and warnings
 */
export async function parseExcelFile(file: File, options?: ParserOptions): Promise<ParsingResult | WorkoutProgram> {
  // Initialize errors and warnings arrays
  const errors: ParsingError[] = [];
  const warnings: ParsingWarning[] = [];
  
  try {
    // Merge provided column mapping with defaults
    const effectiveMapping = options?.columnMapping
      ? { ...DEFAULT_COLUMN_MAPPING, ...options.columnMapping }
      : DEFAULT_COLUMN_MAPPING;
    
    // Determine file type based on extension
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    let program: WorkoutProgram;
    
    if (fileExtension === '.csv') {
      program = await parseCSVFile(file, effectiveMapping, options, errors, warnings);
    } else {
      program = await parseExcelWorkbook(file, effectiveMapping, options, errors, warnings);
    }
    
    // For backward compatibility, if no errors and warnings, just return the program
    if (errors.length === 0 && warnings.length === 0) {
      return program;
    }
    
    // Return the full parsing result
    return {
      program,
      errors,
      warnings
    };
  } catch (error) {
    // If continueOnError is true, return what we have with the error
    if (options?.continueOnError) {
      // Create a minimal valid program
      const program: WorkoutProgram = {
        id: generateUUID(),
        name: 'Parsed Program (with errors)',
        workouts: [],
        history: []
      };
      
      // Add the error to the errors array
      if (error instanceof Error) {
        errors.push({
          row: 0,
          message: error.message,
          critical: true
        });
      } else {
        errors.push({
          row: 0,
          message: 'An unexpected error occurred while parsing the file.',
          critical: true
        });
      }
      
      return {
        program,
        errors,
        warnings
      };
    }
    
    // Otherwise, handle errors as before
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
 * Interface for column mapping
 */
interface ColumnMapping {
  workout: number;
  exercise: number;
  sets: number;
  reps: number;
  load: number;
  rpe: number;
  rest: number;
  notes: number;
}

/**
 * Detects the header row in an Excel worksheet
 * @param worksheet The Excel worksheet to analyze
 * @param columnMapping Custom column mapping configuration
 * @returns An object containing the header row number and column mapping
 */
function detectHeaderRow(worksheet: ExcelJS.Worksheet, columnMapping: ColumnMappingConfig): { headerRowNumber: number; columnMapping: ColumnMapping } {
  // Convert column mapping to lowercase for case-insensitive matching
  const normalizedColumnMapping: Record<string, string> = {};
  Object.entries(columnMapping).forEach(([key, value]) => {
    normalizedColumnMapping[key] = value.toLowerCase();
  });
  
  const requiredColumns = [
    normalizedColumnMapping.workout,
    normalizedColumnMapping.exercise, 
    normalizedColumnMapping.sets, 
    normalizedColumnMapping.reps, 
    normalizedColumnMapping.load, 
    normalizedColumnMapping.rpe, 
    normalizedColumnMapping.rest
  ];
  
  const maxRowsToCheck = Math.min(10, worksheet.rowCount); // Check up to 10 rows or all rows if less
  
  // Try to find a row that contains all required columns
  for (let rowNumber = 1; rowNumber <= maxRowsToCheck; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rowValues = row.values as (string | undefined)[];
    
    // Skip empty rows
    if (!rowValues || rowValues.length <= 1) continue;
    
    // Normalize header values (trim whitespace, convert to lowercase)
    const normalizedValues = rowValues.map(value =>
      typeof value === 'string' ? value.trim().toLowerCase() : value
    );
    
    // Check if all required columns are present (case-insensitive)
    const missingColumns = requiredColumns.filter(column =>
      !normalizedValues.some(val =>
        typeof val === 'string' && val.toLowerCase() === column
      )
    );
    
    if (missingColumns.length === 0) {
      // Found a valid header row, create column mapping
      const columnIndices: Partial<ColumnMapping> = {};
      
      normalizedValues.forEach((value, index) => {
        if (typeof value !== 'string') return;
        
        const normalizedValue = value.toLowerCase();
        if (normalizedValue === normalizedColumnMapping.workout) columnIndices.workout = index;
        else if (normalizedValue === normalizedColumnMapping.exercise) columnIndices.exercise = index;
        else if (normalizedValue === normalizedColumnMapping.sets) columnIndices.sets = index;
        else if (normalizedValue === normalizedColumnMapping.reps) columnIndices.reps = index;
        else if (normalizedValue === normalizedColumnMapping.load) columnIndices.load = index;
        else if (normalizedValue === normalizedColumnMapping.rpe) columnIndices.rpe = index;
        else if (normalizedValue === normalizedColumnMapping.rest) columnIndices.rest = index;
        else if (normalizedValue === normalizedColumnMapping.notes) columnIndices.notes = index;
      });
      
      // Ensure all required columns are mapped
      if (
        columnIndices.workout !== undefined &&
        columnIndices.exercise !== undefined &&
        columnIndices.sets !== undefined &&
        columnIndices.reps !== undefined &&
        columnIndices.load !== undefined &&
        columnIndices.rpe !== undefined &&
        columnIndices.rest !== undefined
      ) {
        return {
          headerRowNumber: rowNumber,
          columnMapping: {
            workout: columnIndices.workout,
            exercise: columnIndices.exercise,
            sets: columnIndices.sets,
            reps: columnIndices.reps,
            load: columnIndices.load,
            rpe: columnIndices.rpe,
            rest: columnIndices.rest,
            notes: columnIndices.notes || 0 // Default to 0 if notes column not found
          }
        };
      }
    }
  }
  
  // If no valid header row found, throw an error with custom column names
  throw new Error(`Could not detect a valid header row. Please ensure your file contains the required columns: ${normalizedColumnMapping.workout}, ${normalizedColumnMapping.exercise}, ${normalizedColumnMapping.sets}, ${normalizedColumnMapping.reps}, ${normalizedColumnMapping.load}, ${normalizedColumnMapping.rpe}, ${normalizedColumnMapping.rest}.`);
}

/**
 * Extracts program name from an Excel worksheet
 * @param worksheet The Excel worksheet
 * @param headerRowNumber The detected header row number
 * @returns The program name
 */
function extractProgramName(worksheet: ExcelJS.Worksheet, headerRowNumber: number): string {
  // Try to find program name in cell with "Program Name" label
  for (let rowNumber = 1; rowNumber < headerRowNumber; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rowValues = row.values as (string | undefined)[];
    
    if (!rowValues || rowValues.length <= 1) continue;
    
    for (let i = 1; i < rowValues.length; i++) {
      const cellValue = rowValues[i];
      const prevCellValue = rowValues[i - 1];
      
      if (
        typeof prevCellValue === 'string' &&
        prevCellValue.toLowerCase().includes('program') &&
        prevCellValue.toLowerCase().includes('name') &&
        typeof cellValue === 'string' &&
        cellValue.trim() !== ''
      ) {
        return cellValue.trim();
      }
    }
  }
  
  // If no program name found, use default
  return 'Parsed Program';
}

/**
 * Parses an Excel workbook file.
 * @param file The Excel file to parse
 * @param columnMapping Custom column mapping configuration
 * @param options Optional parser options
 * @param errors Array to collect parsing errors
 * @param warnings Array to collect parsing warnings
 * @returns A WorkoutProgram object
 */
async function parseExcelWorkbook(
  file: File,
  columnMapping: ColumnMappingConfig,
  options?: ParserOptions,
  errors: ParsingError[] = [],
  warnings: ParsingWarning[] = []
): Promise<WorkoutProgram> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  
  // Get available sheet names for potential warnings
  const availableSheets = workbook.worksheets.map(sheet => sheet.name);
  
  // Determine which worksheet to use based on options
  let worksheet: ExcelJS.Worksheet | undefined;
  
  if (options?.sheetNameOrIndex !== undefined) {
    // User specified a sheet
    if (typeof options.sheetNameOrIndex === 'string') {
      // Try to find by name
      worksheet = workbook.getWorksheet(options.sheetNameOrIndex);
      if (!worksheet) {
        if (options.continueOnError) {
          warnings.push({
            row: 0,
            message: `Sheet "${options.sheetNameOrIndex}" not found. Available sheets: ${availableSheets.join(', ')}. Using first sheet instead.`,
          });
          worksheet = workbook.getWorksheet(1);
        } else {
          throw new Error(`Sheet "${options.sheetNameOrIndex}" not found. Available sheets: ${availableSheets.join(', ')}.`);
        }
      }
    } else if (typeof options.sheetNameOrIndex === 'number') {
      // Try to find by index (1-based)
      worksheet = workbook.getWorksheet(options.sheetNameOrIndex);
      if (!worksheet) {
        if (options.continueOnError) {
          warnings.push({
            row: 0,
            message: `Sheet at index ${options.sheetNameOrIndex} not found. Available sheets: ${availableSheets.join(', ')}. Using first sheet instead.`,
          });
          worksheet = workbook.getWorksheet(1);
        } else {
          throw new Error(`Sheet at index ${options.sheetNameOrIndex} not found. Available sheets: ${availableSheets.join(', ')}.`);
        }
      }
    }
  } else {
    // Default to first sheet
    worksheet = workbook.getWorksheet(1);
  }
  
  if (!worksheet || worksheet.rowCount < 2) {
    throw new Error('Invalid Excel file format. The file appears to be empty or improperly formatted.');
  }

  // Detect header row and column mapping
  const { headerRowNumber, columnMapping: columnIndices } = detectHeaderRow(worksheet, columnMapping);
  
  // Extract program name
  const programName = extractProgramName(worksheet, headerRowNumber);

  // Parse workouts
  const workouts: Workout[] = [];
  let currentWorkout: Workout | null = null;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return; // Skip header rows

    try {
      // Get cell values using the dynamic column mapping
      const exerciseName = row.getCell(columnIndices.exercise + 1).value?.toString() || '';
      
      // Skip rows with empty exercise names
      if (!exerciseName.trim()) return;
      
      // Get other cell values
      const setsValue = row.getCell(columnIndices.sets + 1).value?.toString() || '';
      const repsValue = row.getCell(columnIndices.reps + 1).value?.toString() || '';
      const loadValue = row.getCell(columnIndices.load + 1).value?.toString() || '';
      const rpeValue = row.getCell(columnIndices.rpe + 1).value?.toString() || '';
      const restValue = row.getCell(columnIndices.rest + 1).value?.toString() || '';
      const notesValue = columnIndices.notes ?
        row.getCell(columnIndices.notes + 1).value?.toString() || '' : '';

      // Apply data type auto-detection and conversion with default values
      const exercise: Exercise = {
        name: exerciseName,
        sets: detectAndConvertNumber(setsValue, options?.defaultValues?.sets ?? 0, rowNumber, 'Sets', errors, warnings),
        reps: repsValue || (options?.defaultValues?.reps ?? ''),
        load: detectAndConvertNumber(loadValue, options?.defaultValues?.load ?? 0, rowNumber, 'Load', errors, warnings),
        rpe: detectAndConvertNumber(rpeValue, options?.defaultValues?.rpe ?? 0, rowNumber, 'RPE', errors, warnings),
        rest: detectAndConvertNumber(restValue, options?.defaultValues?.rest ?? 0, rowNumber, 'Rest', errors, warnings),
        notes: notesValue || (options?.defaultValues?.notes ?? '')
      };

      // Get workout name using the dynamic column mapping
      const workoutName = row.getCell(columnIndices.workout + 1).value?.toString();
      
      // If workout name is missing and we have default values option
      if (!workoutName || !workoutName.trim()) {
        if (options?.continueOnError) {
          warnings.push({
            row: rowNumber,
            column: 'workout',
            message: `Missing workout name at row ${rowNumber}. Using "Unnamed Workout".`,
          });
          
          // Use default workout if none exists yet
          if (!currentWorkout) {
            currentWorkout = {
              name: 'Unnamed Workout',
              day: '',
              exercises: []
            };
            workouts.push(currentWorkout);
          }
        } else {
          throw new Error(`Missing workout name at row ${rowNumber}.`);
        }
      } else if (!currentWorkout || currentWorkout.name !== workoutName) {
        // Create a new workout
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
      // Handle row-level errors
      if (options?.continueOnError) {
        // Add to errors and continue
        if (error instanceof Error) {
          errors.push({
            row: rowNumber,
            message: error.message,
            critical: false
          });
        } else {
          errors.push({
            row: rowNumber,
            message: `Error parsing row ${rowNumber}: ${error}`,
            critical: false
          });
        }
      } else {
        // Throw the error to stop processing
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`Error parsing row ${rowNumber}: ${error}`);
      }
    }
  });

  // Check if we have any valid workouts
  if (workouts.length === 0) {
    if (options?.continueOnError) {
      // Create an empty program with a warning
      errors.push({
        row: 0,
        message: 'No valid workout data found in the file.',
        critical: true
      });
      
      return {
        id: generateUUID(),
        name: programName || 'Empty Program',
        workouts: [],
        history: []
      };
    } else {
      throw new Error('No valid workout data found in the file.');
    }
  }

  return {
    id: generateUUID(), // Generate unique ID
    name: programName,
    workouts,
    history: []
  };
}

/**
 * Detects column mapping from CSV headers
 * @param headers Array of header strings from CSV
 * @param columnMapping Custom column mapping configuration
 * @returns Column mapping object
 */
function detectCSVColumnMapping(headers: string[], columnMapping: ColumnMappingConfig): ColumnMapping {
  // Normalize headers (trim whitespace, convert to lowercase)
  const normalizedHeaders = headers.map(header =>
    typeof header === 'string' ? header.trim().toLowerCase() : ''
  );
  
  // Convert column mapping to lowercase for case-insensitive matching
  const normalizedColumnMapping: Record<string, string> = {};
  Object.entries(columnMapping).forEach(([key, value]) => {
    normalizedColumnMapping[key] = value.toLowerCase();
  });
  
  // Initialize column mapping with default values
  const columnIndices: Partial<ColumnMapping> = {};
  
  // Map headers to column indices
  normalizedHeaders.forEach((header, index) => {
    if (header === normalizedColumnMapping.workout) columnIndices.workout = index;
    else if (header === normalizedColumnMapping.exercise) columnIndices.exercise = index;
    else if (header === normalizedColumnMapping.sets) columnIndices.sets = index;
    else if (header === normalizedColumnMapping.reps) columnIndices.reps = index;
    else if (header === normalizedColumnMapping.load) columnIndices.load = index;
    else if (header === normalizedColumnMapping.rpe) columnIndices.rpe = index;
    else if (header === normalizedColumnMapping.rest) columnIndices.rest = index;
    else if (header === normalizedColumnMapping.notes) columnIndices.notes = index;
  });
  
  // Check if all required columns are present
  const requiredColumns = ['workout', 'exercise', 'sets', 'reps', 'load', 'rpe', 'rest'];
  const missingColumns = requiredColumns.filter(column =>
    columnIndices[column as keyof ColumnMapping] === undefined
  );
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.map(col => normalizedColumnMapping[col]).join(', ')}. Please ensure your CSV file has all required columns.`);
  }
  
  // Return complete column mapping
  return {
    workout: columnIndices.workout!,
    exercise: columnIndices.exercise!,
    sets: columnIndices.sets!,
    reps: columnIndices.reps!,
    load: columnIndices.load!,
    rpe: columnIndices.rpe!,
    rest: columnIndices.rest!,
    notes: columnIndices.notes || 0 // Default to 0 if notes column not found
  };
}

/**
 * Extracts program name from CSV data
 * @param data CSV data rows
 * @returns Program name
 */
function extractCSVProgramName(data: any[]): string {
  // Look for a row with "Program Name" or similar
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    const keys = Object.keys(row);
    
    for (const key of keys) {
      if (key.toLowerCase().includes('program') && key.toLowerCase().includes('name')) {
        const value = row[key];
        if (typeof value === 'string' && value.trim() !== '') {
          return value.trim();
        }
      }
    }
  }
  
  return 'CSV Workout Program';
}

/**
 * Parses a CSV file.
 * @param file The CSV file to parse
 * @param columnMapping Custom column mapping configuration
 * @param options Optional parser options
 * @param errors Array to collect parsing errors
 * @param warnings Array to collect parsing warnings
 * @returns A WorkoutProgram object
 */
async function parseCSVFile(
  file: File,
  columnMapping: ColumnMappingConfig,
  options?: ParserOptions,
  errors: ParsingError[] = [],
  warnings: ParsingWarning[] = []
): Promise<WorkoutProgram> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error('No data found in CSV file.');
          }

          // Extract headers from the first row
          const firstRow = results.data[0] as Record<string, unknown>;
          const headers = Object.keys(firstRow);
          
          // Detect column mapping
          const columnIndices = detectCSVColumnMapping(headers, columnMapping);
          
          // Extract program name
          const programName = extractCSVProgramName(results.data);
          
          // Group by workout
          const workoutMap = new Map<string, Exercise[]>();
          
          results.data.forEach((row: any, index: number) => {
            // Get values using column mapping
            const workoutName = row[headers[columnIndices.workout]];
            const exerciseName = row[headers[columnIndices.exercise]];
            
            // Skip rows without workout or exercise
            if (!workoutName || !exerciseName) {
              return;
            }

            try {
              // Get values for each field
              const setsValue = row[headers[columnIndices.sets]] || '';
              const repsValue = row[headers[columnIndices.reps]] || '';
              const loadValue = row[headers[columnIndices.load]] || '';
              const rpeValue = row[headers[columnIndices.rpe]] || '';
              const restValue = row[headers[columnIndices.rest]] || '';
              const notesValue = columnIndices.notes !== undefined ?
                row[headers[columnIndices.notes]] || '' : '';
              
              // Apply data type auto-detection and conversion with default values
              const exercise: Exercise = {
                name: exerciseName || '',
                sets: detectAndConvertNumber(setsValue, options?.defaultValues?.sets ?? 0, index + 2, 'Sets', errors, warnings),
                reps: repsValue || (options?.defaultValues?.reps ?? ''),
                load: detectAndConvertNumber(loadValue, options?.defaultValues?.load ?? 0, index + 2, 'Load', errors, warnings),
                rpe: detectAndConvertNumber(rpeValue, options?.defaultValues?.rpe ?? 0, index + 2, 'RPE', errors, warnings),
                rest: detectAndConvertNumber(restValue, options?.defaultValues?.rest ?? 0, index + 2, 'Rest', errors, warnings),
                notes: notesValue || (options?.defaultValues?.notes ?? '')
              };

              // Handle missing workout name with default
              if (!workoutName || !workoutName.trim()) {
                if (options?.continueOnError) {
                  warnings.push({
                    row: index + 2,
                    column: 'workout',
                    message: `Missing workout name at row ${index + 2}. Using "Unnamed Workout".`,
                  });
                  
                  // Use default workout name
                  if (!workoutMap.has('Unnamed Workout')) {
                    workoutMap.set('Unnamed Workout', []);
                  }
                  workoutMap.get('Unnamed Workout')?.push(exercise);
                } else {
                  throw new Error(`Missing workout name at row ${index + 2}.`);
                }
              } else {
                // Normal case with valid workout name
                if (!workoutMap.has(workoutName)) {
                  workoutMap.set(workoutName, []);
                }
                workoutMap.get(workoutName)?.push(exercise);
              }
            } catch (error) {
              // Handle row-level errors
              if (options?.continueOnError) {
                // Add to errors and continue
                if (error instanceof Error) {
                  errors.push({
                    row: index + 2,
                    message: error.message,
                    critical: false
                  });
                } else {
                  errors.push({
                    row: index + 2,
                    message: `Error parsing row ${index + 2}: ${error}`,
                    critical: false
                  });
                }
              } else {
                // Throw the error to stop processing
                if (error instanceof Error) {
                  throw error;
                }
                throw new Error(`Error parsing row ${index + 2}: ${error}`);
              }
            }
          });

          // Check if we have any valid workouts
          if (workoutMap.size === 0) {
            if (options?.continueOnError) {
              // Create an empty program with a warning
              errors.push({
                row: 0,
                message: 'No valid workout data found in the CSV file.',
                critical: true
              });
              
              resolve({
                id: generateUUID(),
                name: programName || 'Empty Program',
                workouts: [],
                history: []
              });
            } else {
              throw new Error('No valid workout data found in the CSV file.');
            }
          } else {
            // Convert map to workouts array
            const workouts: Workout[] = Array.from(workoutMap.entries()).map(([name, exercises]) => ({
              name,
              day: '',
              exercises
            }));

            resolve({
              id: generateUUID(),
              name: programName,
              workouts,
              history: []
            });
          }
        } catch (error) {
          if (options?.continueOnError) {
            // Create a minimal valid program with the error
            const program: WorkoutProgram = {
              id: generateUUID(),
              name: 'CSV Program (with errors)',
              workouts: [],
              history: []
            };
            
            // Add the error to the errors array
            if (error instanceof Error) {
              errors.push({
                row: 0,
                message: error.message,
                critical: true
              });
            } else {
              errors.push({
                row: 0,
                message: 'An unexpected error occurred while parsing the CSV file.',
                critical: true
              });
            }
            
            resolve(program);
          } else {
            reject(error);
          }
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}
