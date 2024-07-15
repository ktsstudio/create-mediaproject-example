import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ejs from 'ejs';

import { FSType } from './types.js';
import { printWarning } from './utils/print.js';
import { buildTemplateVariables } from './utils/template.js';
import { ENCODING, REGEXP, DEV_MESSAGES, PATHS } from './config.js';
import { createDirectoryContents } from './createProject.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const saveFile: FSType = ({
  options,
  entryName,
  entryPath,
  projectBuildPath,
  isWatch = false,
}) => {
  const readFileBuffer = () => fs.readFileSync(entryPath);
  const readTemplateString = () => fs.readFileSync(entryPath, ENCODING);

  const templateString = readTemplateString();
  const templateVariables = buildTemplateVariables(options);
  const renderTemplate = () => ejs.render(templateString, templateVariables);

  const writeFileName = entryName.replace(REGEXP.template, '');
  const fullFilePath = path.join(projectBuildPath, writeFileName);

  const isTemplate = Boolean(entryName.match(REGEXP.template));
  const dataToWrite = isTemplate ? renderTemplate() : readFileBuffer();

  const stats = fs.statSync(entryPath);

  // сохраняем файл с тем же mode, чтобы выполняемые файлы остались выполняемыми
  fs.writeFileSync(fullFilePath, dataToWrite, { mode: stats.mode });

  if (isWatch) {
    printWarning(DEV_MESSAGES.watchWrite(entryName, writeFileName, isTemplate));
  }
};

export const removeFile: FSType = ({
  projectBuildPath,
  entryName,
  isWatch,
}) => {
  const removeFileName = entryName.replace(REGEXP.template, '');
  const fullFilePath = path.join(projectBuildPath, removeFileName);

  if (fs.existsSync(fullFilePath)) {
    fs.unlinkSync(fullFilePath);

    if (isWatch) {
      printWarning(DEV_MESSAGES.watchRemove(removeFileName));
    }
  }
};

export const saveDirectoryWithContent: FSType = ({
  options,
  entryName,
  entryPath,
  projectBuildPath,
}) => {
  const buildDirPath = (parentPath: string) => path.join(parentPath, entryName);

  fs.mkdirSync(buildDirPath(projectBuildPath));
  createDirectoryContents(options, buildDirPath(entryPath));
};

export const removeDirectory = (
  dirPath: string,
  callback?: VoidFunction
): void => {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, {
      recursive: true,
      maxRetries: 100,
      retryDelay: 300,
    });

    callback?.();
  }
};

export const symlinkDirectory = (
  fromPath: string,
  toPath: string,
  callback: fs.NoParamCallback
): void => {
  fs.symlink(fromPath, toPath, 'dir', callback);
};

export const removeTemporaryDevDir = (templatePath: string): void => {
  fs.unlinkSync(path.join(templatePath, PATHS.modules));
  removeDirectory(path.resolve(__dirname, '..', PATHS.devModeDir));
};

export const buildFullTemplatePath = (templateName: string): string =>
  path.join(__dirname, PATHS.templates, templateName);

export const buildParentPath = (): string => path.join(__dirname, '..');
