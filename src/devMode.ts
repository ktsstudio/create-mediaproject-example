import * as path from 'node:path';

import shell from 'shelljs';

import { MESSAGES, PATHS, COMMANDS } from './config.js';
import { OptionsType } from './types.js';
import { printError, printSuccess } from './utils/print.js';
import { watchPath } from './fsWatch.js';
import {
  buildFullTemplatePath,
  buildParentPath,
  removeTemporaryDevDir,
  symlinkDirectory,
} from './fs.js';

const devModeChildProcess = async (options: OptionsType): Promise<void> => {
  // запускаем процесс асинхронно, чтобы не останавливать выполнение остального кода,
  // в том числе отслеживания изменений файлов
  shell.exec(COMMANDS.yarn.dev, { async: true });

  process.on('SIGINT', () => {
    printSuccess(MESSAGES.devModeExit);
    removeTemporaryDevDir(buildFullTemplatePath(options.templateName));
    process.exit(0);
  });
};

export const devMode = (options: OptionsType): void => {
  symlinkDirectory(
    path.join(buildParentPath(), PATHS.devModeDir, PATHS.modules),
    path.join(options.templatePath, PATHS.modules),
    (err) => {
      if (err) {
        printError(err.message);
      } else {
        printSuccess(MESSAGES.devModeSymlinkCreated);
      }
    }
  );

  const watchProps = {
    options,
    fullPath: buildFullTemplatePath(options.templateName),
  };

  watchPath(watchProps);

  devModeChildProcess(options);

  printSuccess(MESSAGES.devModeRunning);
};
