import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { watch } from 'chokidar';

import { DEV_MESSAGES, PATHS } from './config.js';
import { OptionsType, FSWatchType, FSProps, FSType } from './types.js';
import { saveFile, removeFile, removeDirectory } from './fs.js';
import { printWarning } from './utils/print.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildWatchFSProps = (
  options: OptionsType,
  entryPath: string
): FSProps => {
  const entryName = path.basename(entryPath);
  const templateBasePath = path.join(PATHS.templates, options.templateName);
  const [, projectRelativePathWithName] = entryPath.split(templateBasePath);
  const [projectRelativePath] = projectRelativePathWithName.split(entryName);
  const rootDir = path.resolve(__dirname, '..');

  const projectBuildPath = path.join(
    rootDir,
    options.buildDir,
    projectRelativePath
  );

  return {
    options,
    entryName,
    entryPath,
    projectBuildPath,
    isWatch: true,
  };
};

const watchOptionsConfig = {
  ignored: ['**/node_modules'],
};

const onAddDir: FSType = ({ projectBuildPath, entryName }) => {
  const dirPath = path.join(projectBuildPath, entryName);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);

    printWarning(DEV_MESSAGES.watchWrite(entryName, entryName, false));
  }
};

const onUnlinkDir: FSType = ({ projectBuildPath, entryName }) => {
  const dirPath = path.join(projectBuildPath, entryName);

  removeDirectory(dirPath, () =>
    printWarning(DEV_MESSAGES.watchRemove(entryName))
  );
};

export const watchPath: FSWatchType = ({ options, fullPath }) => {
  return watch(fullPath, watchOptionsConfig).on(
    'all',
    (eventName, entryPath, stats) => {
      const watchProps = buildWatchFSProps(options, entryPath);

      switch (eventName) {
        case 'add':
          // если есть аргумент stats, значит файл уже существует и создавать его не нужно
          if (!stats) {
            saveFile(watchProps);
          }
          break;
        case 'addDir':
          // если есть аргумент stats, значит папка уже существует и создавать ее не нужно
          if (!stats) {
            onAddDir(watchProps);
          }
          break;
        case 'change':
          saveFile(watchProps);
          break;
        case 'unlink':
          removeFile(watchProps);
          break;
        case 'unlinkDir':
          onUnlinkDir(watchProps);
      }
    }
  );
};
