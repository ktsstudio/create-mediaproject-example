#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseInitialOptions, parseOptions } from './parseOptions.js';
import { createProject } from './createProject.js';
import { postProcess } from './postProcess.js';
import { devMode } from './devMode.js';
import { printError, printSuccess } from './utils/print.js';
import { MESSAGES, PATHS } from './config.js';
import { InitialOptionsType } from './types.js';
import { removeDirectory } from './fs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildTemplate = async (
  initialOptions: InitialOptionsType
): Promise<void> => {
  const options = await parseOptions(initialOptions);

  try {
    createProject(options);
    postProcess(options);
    printSuccess(
      MESSAGES.projectCreateSuccess(options.templateName, options.buildDir)
    );
  } catch (e) {
    console.log(e);
    printError(MESSAGES.projectCreateError);
  }
};

const startDevMode = async (
  initialOptions: InitialOptionsType
): Promise<void> => {
  const devModeOptions = {
    ...initialOptions,
    dir: PATHS.devModeDir,
  };

  const options = await parseOptions(devModeOptions);

  try {
    printSuccess(MESSAGES.devModeStarts);
    removeDirectory(path.resolve(__dirname, '..', devModeOptions.dir));
    createProject(options);
    postProcess(options);
    printSuccess(
      MESSAGES.devModeCreateSuccess(options.templateName, options.buildDir)
    );

    devMode(options);
  } catch (e) {
    printError(MESSAGES.projectCreateError);
  }
};

const main = async (): Promise<void> => {
  const initialOptions = parseInitialOptions();
  return initialOptions.dev
    ? startDevMode(initialOptions)
    : buildTemplate(initialOptions);
};

main();
