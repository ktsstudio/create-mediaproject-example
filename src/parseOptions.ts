import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { input, select } from '@inquirer/prompts';

import { PATHS, REGEXP } from './config.js';
import { OptionsType, InitialOptionsType } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getTemplatesNames = (): string[] => {
  const templatesPath = path.join(__dirname, PATHS.templates);

  return fs.readdirSync(templatesPath);
};

export const parseInitialOptions = (): InitialOptionsType => {
  const argv = yargs(hideBin(process.argv))
    .option('dev', {
      description: 'Dev mode',
      type: 'boolean',
    })
    .option('dir', {
      alias: 'd',
      description: 'Project directory (also name)',
      type: 'string',
      coerce(arg) {
        if (!validateDirectoryName(arg)) {
          throw new Error('Incorrect directory name');
        }
        return arg;
      },
    })
    .option('template', {
      alias: 't',
      description: 'Template name',
      type: 'string',
      choices: getTemplatesNames(),
    })
    .help()
    .parseSync();

  return {
    dir: argv.dir,
    template: argv.template,
    dev: argv.dev || false,
  };
};

const validateDirectoryName = (dirName: string): boolean =>
  REGEXP.fsEntryName.test(dirName);

const promptQuestions = {
  templateName: (choices: string[]) => ({
    message: 'Select template',
    choices: choices.map((value) => ({ value })),
  }),
  buildDir: {
    message: 'Project directory (also name)',
    validate: (input: string) =>
      validateDirectoryName(input) ? true : 'Incorrect directory name',
  },
};

export const parseOptions = async (
  initialOptions: InitialOptionsType
): Promise<OptionsType> => {
  const templatesPath = path.join(__dirname, PATHS.templates);
  const choices = fs.readdirSync(templatesPath);

  let templateName = initialOptions.template ?? '';
  templateName = choices.includes(templateName) ? templateName : '';

  if (!templateName) {
    templateName = await select(promptQuestions.templateName(choices));
  }

  let buildDir = initialOptions.dir ?? '';
  buildDir = validateDirectoryName(buildDir) ? buildDir : '';

  if (!buildDir) {
    buildDir = await input(promptQuestions.buildDir);
  }

  return {
    buildDir,
    templateName,
    templatePath: path.join(templatesPath, templateName),
    dev: initialOptions.dev,
  };
};
