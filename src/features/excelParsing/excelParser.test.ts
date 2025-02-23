import { parseExcelFile } from './excelParser';
import * as XLSX from 'xlsx';
import { initDB, storeWorkoutProgram } from '../../lib/indexedDB';

// Mock the xlsx library
jest.mock('xlsx', () => ({
    read: jest.fn(),
    utils: {
        sheet_to_json: jest.fn()
    },
}));

// Mock the IndexedDB functions
jest.mock('../../lib/indexedDB', () => ({
    initDB: jest.fn().mockResolvedValue(undefined),
    storeWorkoutProgram: jest.fn().mockResolvedValue(undefined)
}));

const mockedXLSX = jest.mocked(XLSX, true);
const mockedInitDB = jest.mocked(initDB);
const mockedStoreWorkoutProgram = jest.mocked(storeWorkoutProgram);

beforeEach(() => {
    jest.clearAllMocks();
    mockedInitDB.mockResolvedValue(undefined);
    mockedStoreWorkoutProgram.mockResolvedValue(undefined);
});


describe('parseExcelFile', () => {
    const mockFile = (data: any) => {
        const file = new File([new Blob([data])], 'workout.xlsx');
        // Mock the arrayBuffer method
        (file as any).arrayBuffer = () => Promise.resolve(data);
        return file;
    };

    beforeEach(() => {
      jest.clearAllMocks();
    })

    it('should throw an error if the file is empty', async () => {
        const emptyData = new ArrayBuffer(0); // Empty ArrayBuffer
        const file = mockFile(emptyData);

        mockedXLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } } as any);
        mockedXLSX.utils.sheet_to_json.mockReturnValue([]);

        await expect(parseExcelFile(file)).rejects.toThrow("No data found in the Excel file (or file is too short).");
    });

  it('should parse a valid Excel file and return workout data', async () => {
    const mockData = [
      [], // Mock merged cells row 1
      [], // Mock merged cells row 2
      ['Week', 'Exercise', 'Warm-up Sets', 'Working Sets', 'Reps'], // Headers
      ['Week 1', 'Push #1: Bench Press', '2', '3', '8-12'],
      ['Week 1', 'Push #1: Incline Dumbbell Press', '2', '3', '10-15'],
      ['Week 1', 'Pull #1: Pull-Up', '0', '3', 'AMRAP'],
    ];

    const file = mockFile("fake data");
    mockedXLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { 'Sheet1': {} }
    } as any);
    mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

    const result = await parseExcelFile(file);
    expect(result).toEqual([
      {
        week: 'Week 1',
        day: 'Push #1',
        exercises: [
          {
            name: 'Push #1: Bench Press',
            warmupSets: 2,
            workingSets: 3,
            reps: '8-12',
            load: null,
            rpe: null,
            rest: null,
            substitution1: null,
            substitution2: null,
            notes: null
          },
          {
            name: 'Push #1: Incline Dumbbell Press',
            warmupSets: 2,
            workingSets: 3,
            reps: '10-15',
            load: null,
            rpe: null,
            rest: null,
            substitution1: null,
            substitution2: null,
            notes: null
          },
        ],
      },
      {
        week: 'Week 1',
        day: 'Pull #1',
        exercises: [
          {
            name: 'Pull #1: Pull-Up',
            warmupSets: 0,
            workingSets: 3,
            reps: 'AMRAP',
            load: null,
            rpe: null,
            rest: null,
            substitution1: null,
            substitution2: null,
            notes: null
          }
        ]
      }
    ]);
  });

  it('should handle dynamic header mapping correctly', async () => {
      const mockData = [
          [],
          [],
          ['Week', 'Exercise', 'Warm-up Sets', 'Working Sets', 'Reps'],
          ['Week 1', 'Push #1: Bench Press', '2', '3', '8-12']
      ];

      const file = mockFile("fake data");
      mockedXLSX.read.mockReturnValue({
          SheetNames: ['Sheet1'],
          Sheets: { 'Sheet1': {} }
      } as any);
      mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

      const result = await parseExcelFile(file);
      expect(result[0]?.exercises[0]?.name).toBe('Push #1: Bench Press');
      expect(result[0]?.exercises[0]?.warmupSets).toBe(2);
      expect(result[0]?.exercises[0]?.workingSets).toBe(3);
      expect(result[0]?.exercises[0]?.reps).toBe('8-12');
  });

  it('should correctly extract workout day', async () => {
      const mockData = [
          [],
          [],
          ['Week', 'Exercise', 'Warm-up Sets', 'Working Sets', 'Reps'],
          ['Week 1', 'Push #1: Bench Press', '2', '3', '8-12'],
          ['Week 1', 'Pull #2: Pull-Up', '0', '3', 'AMRAP'],
      ];

      const file = mockFile("fake data");
      mockedXLSX.read.mockReturnValue({
          SheetNames: ['Sheet1'],
          Sheets: { 'Sheet1': {} }
      } as any);
      mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

      const result = await parseExcelFile(file);
      expect(result[0]?.day).toBe('Push #1');
      expect(result[1]?.day).toBe('Pull #2');
  });

  it('should handle missing exercise names', async () => {
    const mockData = [
      [],
      [],
      ['Week', 'Exercise', 'Warm-up Sets', 'Working Sets', 'Reps'],
      ['Week 1', 'Push #1: Bench Press', '2', '3', '8-12'],
      ['Week 1', '', '2', '3', '10-15'], // Missing exercise name
      ['Week 1', 'Pull #1: Pull-Up', '0', '3', 'AMRAP'],
    ];

    const file = mockFile("fake data");
    mockedXLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { 'Sheet1': {} }
    } as any);
    mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

    const result = await parseExcelFile(file);
      // Check that the exercise with the missing name is skipped or handled appropriately
      // In this case we expect it to be skipped, so only 2 exercises total
    expect(result[0].exercises.length).toBe(1);
    expect(result[1].exercises.length).toBe(1);

  });

  it('should handle invalid number values for sets and load', async () => {
    const mockData = [
      [],
      [],
      ['Week', 'Exercise', 'Warm-up Sets', 'Working Sets', 'Reps', 'Load'],
      ['Week 1', 'Push #1: Bench Press', 'abc', 'xyz', '8-12', 'def'],
    ];

    const file = mockFile("fake data");
    mockedXLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { 'Sheet1': {} }
    } as any);
    mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

    const result = await parseExcelFile(file);
    expect(result[0].exercises[0].warmupSets).toBe('abc'); // Should be string
    expect(result[0].exercises[0].workingSets).toBe('xyz'); // Should be string
    expect(result[0].exercises[0].load).toBe('def'); // Should be string
  });

  it('should throw an error for missing header row', async () => {
      const mockData = [
          [],
          [],
          ['Week 1', 'Push #1: Bench Press', '2', '3', '8-12'], // No header row
      ];

      const file = mockFile("fake data");
      mockedXLSX.read.mockReturnValue({
          SheetNames: ['Sheet1'],
          Sheets: { 'Sheet1': {} }
      } as any);
      mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

      await expect(parseExcelFile(file)).rejects.toThrow("Missing header row in the Excel file.");
  });

  it('should handle different week formats', async () => {
      const mockData = [
          [],
          [],
          ['Week', 'Exercise', 'Warm-up Sets', 'Working Sets', 'Reps'],
          ['W1', 'Push #1: Bench Press', '2', '3', '8-12'],
          ['week 2', 'Pull #1: Pull-Up', '0', '3', 'AMRAP'],
      ];
      const file = mockFile("fake data");
      mockedXLSX.read.mockReturnValue({
          SheetNames: ['Sheet1'],
          Sheets: { 'Sheet1': {} }
      } as any);
      mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

      const result = await parseExcelFile(file);
      expect(result[0].week).toBe('Week 1');
      expect(result[1].week).toBe('Week 2');
  });

  it('should handle mixed-case headers', async () => {
      const mockData = [
          [],
          [],
          ['wEeK', 'eXeRcIsE', 'wArM-Up sEtS', 'wOrKiNg sEtS', 'rEpS'], // Mixed case headers
          ['Week 1', 'Push #1: Bench Press', '2', '3', '8-12'],
      ];

      const file = mockFile("fake data");
      mockedXLSX.read.mockReturnValue({
          SheetNames: ['Sheet1'],
          Sheets: { 'Sheet1': {} }
      } as any);
      mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

      const result = await parseExcelFile(file);
      expect(result[0].exercises[0].warmupSets).toBe(2);
      expect(result[0].exercises[0].workingSets).toBe(3);
      expect(result[0].exercises[0].reps).toBe('8-12');
  });

    it('should throw an error if "Exercise" header is misspelled', async () => {
      const mockData = [
        [],
        [],
        ['Week', 'Excersise', 'Warm-up Sets', 'Working Sets', 'Reps'], // Misspelled "Exercise"
        ['Week 1', 'Push #1: Bench Press', '2', '3', '8-12'],
      ];
      const file = mockFile("fake data");
      mockedXLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { 'Sheet1': {} }
      } as any);
      mockedXLSX.utils.sheet_to_json.mockReturnValue(mockData);

      await expect(parseExcelFile(file)).rejects.toThrow("Missing required 'Exercise' column in the Excel file.");
    });
});
