import * as fs from 'node:fs';
import * as path from 'node:path';

import { printError } from './utils/print.js';
import { MESSAGES, SKIP_FILENAMES } from './config.js';
import { saveDirectoryWithContent, saveFile } from './fs.js';
import { OptionsType } from './types.js';

export const createDirectoryContents = (
  options: OptionsType,
  relativePath = '',
  skipFileNames = SKIP_FILENAMES
): void => {
  const buildRelativePath = (parentPath: string) =>
    path.join(parentPath, relativePath);

  const projectBuildPath = buildRelativePath(options.buildDir);
  const fullTemplatePath = buildRelativePath(options.templatePath);
  const entriesToCreate = fs.readdirSync(fullTemplatePath);

  entriesToCreate.forEach((entryName) => {
    if (skipFileNames.includes(entryName)) {
      return;
    }

    const entryPath = path.join(fullTemplatePath, entryName);
    const stats = fs.statSync(entryPath);
    const isDirectory = stats.isDirectory();

    const saveProps = {
      entryPath: isDirectory ? relativePath : entryPath,
      options,
      entryName,
      projectBuildPath,
    };

    if (isDirectory) {
      return saveDirectoryWithContent(saveProps);
    }

    if (stats.isFile()) {
      return saveFile(saveProps);
    }
  });
};

export const createProject = (options: OptionsType): void => {
  if (fs.existsSync(options.buildDir)) {
    printError(MESSAGES.buildDirExists);
    throw new Error(MESSAGES.buildDirExists);
  }

  fs.mkdirSync(options.buildDir);
  createDirectoryContents(options);
};
