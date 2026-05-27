import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Transform } from 'stream';

export interface ConvertOptions {
  delimiter?: string;
  headers?: boolean;
  skipEmpty?: boolean;
  trimValues?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
}

/**
 * Convert CSV to JSON
 */
export async function csvToJson(
  inputPath: string,
  options: ConvertOptions = {}
): Promise<object[]> {
  return new Promise((resolve, reject) => {
    const results: object[] = [];
    const {
      delimiter = ',',
      headers = true,
      skipEmpty = true,
      trimValues = true,
    } = options;

    const parser = parse({
      columns: headers,
      delimiter,
      skip_empty_lines: skipEmpty,
      trim: trimValues,
    });

    fs.createReadStream(inputPath)
      .pipe(parser)
      .on('data', (data) => {
        results.push(data);
      })
      .on('error', reject)
      .on('end', () => {
        resolve(results);
      });
  });
}

/**
 * Convert JSON to CSV
 */
export async function jsonToCsv(
  data: object[],
  outputPath: string,
  options: ConvertOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { delimiter = ',' } = options;

    if (!Array.isArray(data) || data.length === 0) {
      reject(new Error('Input must be a non-empty array of objects'));
      return;
    }

    const stringifier = stringify({
      header: true,
      delimiter,
      columns: Object.keys(data[0]),
    });

    const output = fs.createWriteStream(outputPath);

    stringifier.pipe(output);

    data.forEach((row) => {
      stringifier.write(row);
    });

    stringifier.end();

    output.on('error', reject).on('finish', resolve);
  });
}

/**
 * Convert file (auto-detect format)
 */
export async function convertFile(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions = {}
): Promise<void> {
  const inputExt = path.extname(inputPath).toLowerCase();
  const outputExt = path.extname(outputPath).toLowerCase();

  if (inputExt === '.csv' && outputExt === '.json') {
    const jsonData = await csvToJson(inputPath, options);
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  } else if (inputExt === '.json' && outputExt === '.csv') {
    const jsonData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    await jsonToCsv(jsonData, outputPath, options);
  } else {
    throw new Error(
      `Unsupported conversion: ${inputExt} → ${outputExt}. Supported: CSV ↔ JSON`
    );
  }
}

/**
 * Validate CSV file
 */
export async function validateCsv(
  inputPath: string,
  options: ConvertOptions = {}
): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      rowCount: 0,
      columnCount: 0,
    };

    const { delimiter = ',', headers = true, trimValues = true } = options;

    let headerColumns: string[] = [];
    let headerSet = false;

    const parser = parse({
      columns: headers,
      delimiter,
      trim: trimValues,
      skip_empty_lines: false,
    });

    fs.createReadStream(inputPath)
      .pipe(parser)
      .on('data', (data, context) => {
        result.rowCount++;

        if (!headerSet && headers) {
          headerColumns = Object.keys(data);
          result.columnCount = headerColumns.length;
          headerSet = true;
        }

        // Check for missing values
        Object.entries(data).forEach(([key, value]) => {
          if (value === '' || value === null) {
            result.warnings.push(
              `Row ${result.rowCount}, Column "${key}": Empty value`
            );
          }
        });

        // Check for column count mismatch
        if (headerSet && Object.keys(data).length !== headerColumns.length) {
          result.errors.push(
            `Row ${result.rowCount}: Column count mismatch (expected ${headerColumns.length}, got ${Object.keys(data).length})`
          );
          result.valid = false;
        }
      })
      .on('error', reject)
      .on('end', () => {
        if (result.errors.length === 0 && result.rowCount > 0) {
          result.valid = true;
        }
        resolve(result);
      });
  });
}

/**
 * Validate JSON file
 */
export async function validateJson(inputPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    rowCount: 0,
    columnCount: 0,
  };

  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      result.errors.push('JSON must be an array of objects');
      result.valid = false;
      return result;
    }

    result.rowCount = data.length;

    if (data.length > 0) {
      if (typeof data[0] !== 'object' || data[0] === null) {
        result.errors.push('Array items must be objects');
        result.valid = false;
        return result;
      }

      result.columnCount = Object.keys(data[0]).length;

      // Check consistency
      const firstKeys = new Set(Object.keys(data[0]));
      data.forEach((row, index) => {
        const rowKeys = new Set(Object.keys(row));
        if (rowKeys.size !== firstKeys.size || ![...rowKeys].every((k) => firstKeys.has(k))) {
          result.warnings.push(
            `Row ${index + 1}: Schema mismatch with first row`
          );
        }
      });
    }

    return result;
  } catch (error) {
    result.errors.push(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    result.valid = false;
    return result;
  }
}
