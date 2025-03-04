import { WorkoutProgram, ColumnMappingConfig } from '../../types';

/**
 * Dynamically imports ExcelJS and processes an Excel file
 * @param file The Excel file to parse
 * @param columnMapping Optional custom column mapping configuration
 * @returns A WorkoutProgram object
 */
export async function processExcelFile(file: File, columnMapping?: ColumnMappingConfig): Promise<WorkoutProgram> {
  // Dynamically import ExcelJS only when this function is called
  const exceljs = await import('exceljs');
  
  // Forward the file and column mapping to the original parser function
  // but with the dynamically imported ExcelJS instance
  return processExcelWorkbookWithExcelJS(file, columnMapping, exceljs);
}

/**
 /**
  * Processes an Excel file with the provided ExcelJS instance
  * This function handles the actual Excel processing logic
  */
 async function processExcelWorkbookWithExcelJS(
   file: File,
   columnMapping: ColumnMappingConfig | undefined,
   exceljs: any
 ): Promise<WorkoutProgram> {
  const { parseExcelFile } = await import('./excelParser');
  
  // Use the dynamically imported ExcelJS
  const workbook = new exceljs.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  
  // Forward to the original parser function
  return parseExcelFile(file, columnMapping);
}

/**
 * Dynamically imports PapaParse and processes a CSV file
 * @param file The CSV file to parse
 * @param columnMapping Optional custom column mapping configuration
 * @returns A WorkoutProgram object
 */
export async function processCSVFile(file: File, columnMapping?: ColumnMappingConfig): Promise<WorkoutProgram> {
  // Dynamically import PapaParse only when this function is called
  const Papa = await import('papaparse');
  
  // Forward the file and column mapping to the original parser function
  // but with the dynamically imported PapaParse instance
  return processCSVWithPapaParse(file, columnMapping, Papa);
}

/**
 * Processes a CSV file with the provided PapaParse instance
 * This function handles the actual CSV processing logic
 */
async function processCSVWithPapaParse(
  file: File,
  columnMapping: ColumnMappingConfig | undefined,
  Papa: any
): Promise<WorkoutProgram> {
  // Import the original parser to use its helper functions
  const { parseExcelFile } = await import('./excelParser');
  
  // Forward to the original parser function
  return parseExcelFile(file, columnMapping);
}