#!/usr/bin/env node

import * as yargs from 'yargs';
import * as chalk from 'chalk';
import * as fs from 'fs';
import {
  csvToJson,
  jsonToCsv,
  convertFile,
  validateCsv,
  validateJson,
  ConvertOptions,
} from './converter';

const argv = yargs
  .command(
    'convert <input> <output>',
    'Convert between CSV and JSON formats',
    (yargs) =>
      yargs
        .positional('input', {
          describe: 'Input file path (.csv or .json)',
          type: 'string',
        })
        .positional('output', {
          describe: 'Output file path (.csv or .json)',
          type: 'string',
        })
        .option('delimiter', {
          alias: 'd',
          describe: 'CSV delimiter character',
          type: 'string',
          default: ',',
        })
        .option('no-headers', {
          describe: 'First row is not headers',
          type: 'boolean',
          default: false,
        })
        .option('skip-empty', {
          describe: 'Skip empty lines',
          type: 'boolean',
          default: true,
        }),
    async (argv) => {
      try {
        const options: ConvertOptions = {
          delimiter: argv.delimiter,
          headers: !argv['no-headers'],
          skipEmpty: argv['skip-empty'],
        };

        console.log(
          chalk.blue(`Converting ${argv.input} → ${argv.output}...`)
        );
        await convertFile(argv.input, argv.output, options);
        console.log(chalk.green(`✓ Conversion successful!`));
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
  )
  .command(
    'csv-to-json <input> [output]',
    'Convert CSV to JSON',
    (yargs) =>
      yargs
        .positional('input', {
          describe: 'Input CSV file',
          type: 'string',
        })
        .positional('output', {
          describe: 'Output JSON file (optional, prints to stdout if not provided)',
          type: 'string',
        })
        .option('delimiter', {
          alias: 'd',
          describe: 'CSV delimiter',
          type: 'string',
          default: ',',
        })
        .option('no-headers', {
          describe: 'First row is not headers',
          type: 'boolean',
          default: false,
        }),
    async (argv) => {
      try {
        const options: ConvertOptions = {
          delimiter: argv.delimiter,
          headers: !argv['no-headers'],
        };

        const data = await csvToJson(argv.input, options);
        const output = JSON.stringify(data, null, 2);

        if (argv.output) {
          fs.writeFileSync(argv.output, output);
          console.log(chalk.green(`✓ Converted to ${argv.output}`));
        } else {
          console.log(output);
        }
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
  )
  .command(
    'json-to-csv <input> <output>',
    'Convert JSON to CSV',
    (yargs) =>
      yargs
        .positional('input', {
          describe: 'Input JSON file',
          type: 'string',
        })
        .positional('output', {
          describe: 'Output CSV file',
          type: 'string',
        })
        .option('delimiter', {
          alias: 'd',
          describe: 'CSV delimiter',
          type: 'string',
          default: ',',
        }),
    async (argv) => {
      try {
        const data = JSON.parse(fs.readFileSync(argv.input, 'utf-8'));
        await jsonToCsv(data, argv.output, {
          delimiter: argv.delimiter,
        });
        console.log(chalk.green(`✓ Converted to ${argv.output}`));
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
  )
  .command(
    'validate <file>',
    'Validate CSV or JSON file',
    (yargs) =>
      yargs
        .positional('file', {
          describe: 'File to validate (.csv or .json)',
          type: 'string',
        })
        .option('delimiter', {
          alias: 'd',
          describe: 'CSV delimiter (for CSV files)',
          type: 'string',
          default: ',',
        }),
    async (argv) => {
      try {
        const ext = argv.file.split('.').pop()?.toLowerCase();
        let result;

        if (ext === 'csv') {
          result = await validateCsv(argv.file, {
            delimiter: argv.delimiter,
          });
        } else if (ext === 'json') {
          result = await validateJson(argv.file);
        } else {
          throw new Error('File must be .csv or .json');
        }

        console.log(chalk.blue(`\nValidation Report: ${argv.file}`));
        console.log(chalk.blue('─'.repeat(50)));
        console.log(`Status: ${result.valid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid')}`);
        console.log(`Rows: ${result.rowCount}`);
        console.log(`Columns: ${result.columnCount}`);

        if (result.errors.length > 0) {
          console.log(chalk.red(`\nErrors (${result.errors.length}):`));
          result.errors.forEach((err) => console.log(`  ${chalk.red('•')} ${err}`));
        }

        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`\nWarnings (${result.warnings.length}):`));
          result.warnings.slice(0, 5).forEach((warn) => console.log(`  ${chalk.yellow('•')} ${warn}`));
          if (result.warnings.length > 5) {
            console.log(`  ${chalk.yellow('•')} ... and ${result.warnings.length - 5} more`);
          }
        }
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
  )
  .option('version', {
    alias: 'v',
    describe: 'Show version',
  })
  .option('help', {
    alias: 'h',
    describe: 'Show help',
  })
  .example(
    'data-forge convert data.csv data.json',
    'Convert CSV to JSON'
  )
  .example(
    'data-forge csv-to-json input.csv',
    'Convert CSV to JSON and print to stdout'
  )
  .example(
    'data-forge json-to-csv data.json data.csv -d ";"',
    'Convert JSON to CSV with semicolon delimiter'
  )
  .example(
    'data-forge validate data.csv',
    'Validate a CSV file'
  )
  .strict()
  .demandCommand()
  .help()
  .parseSync();
