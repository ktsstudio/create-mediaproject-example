import { OptionsType, TemplateVariablesType } from '../types.js';

export const buildTemplateVariables = (
  options: OptionsType
): TemplateVariablesType => ({
  projectName: options.buildDir,
});
