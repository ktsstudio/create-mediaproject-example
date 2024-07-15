import * as fs from 'node:fs';

import shell from 'shelljs';

import { OptionsType } from './types.js';
import { INITIAL_BRANCH, PATHS, COMMANDS, MESSAGES } from './config.js';

const FILES_GIT_SHOULD_IGNORE = [
  '*.log',
  'node_modules/',
  'public/',
  'dist/',
  '*.local',
  '.idea/',
  '.vscode/',
  '.DS_Store',
  '.swc/',
];

export const initGit = (branch = INITIAL_BRANCH): shell.ShellString =>
  shell.exec(COMMANDS.git.init(branch));

// для каждой строки выполняется отдельная команда echo
// такая реализация нужна для совместимости со всеми ОС
const writeStringsToFile = (strings: string[], output: string) => {
  const result = strings.map((string) => `echo ${string}`).join(' && ');

  shell.exec(`(${result}) > ${output}`);
};

export const createGitIgnoreFile = (): void =>
  writeStringsToFile(FILES_GIT_SHOULD_IGNORE, '.gitignore');

export const installDeps = (): void => {
  const isNode = fs.existsSync(PATHS.package);
  if (!isNode) {
    return;
  }

  const result = shell.exec(COMMANDS.yarn.install, { env: process.env });

  if (result.code !== 0) {
    throw new Error(MESSAGES.yarnInstallFail);
  }
};

export const postProcess = (options: OptionsType): void => {
  shell.cd(options.buildDir);

  initGit();
  createGitIgnoreFile();
  installDeps();
};
