import path from 'path';
import type { CommanderOptions } from './commander';
import { Commander } from './commander';
import { mpbootRegexPattern, versionRegexPattern } from '../common/regex';

export class MPBootCommander extends Commander {
  constructor(binary: string, args: string[], options?: CommanderOptions) {
    super(binary, args, options);
  }

  get sourceFilePath(): string {
    const sourceIndex = this.args.indexOf('-s');
    if (sourceIndex !== -1) {
      return this.args[sourceIndex + 1];
    }
    return '';
  }

  get sourceFileName(): string {
    return path.basename(this.sourceFilePath);
  }

  get generatedTreeFilePath(): string {
    return `${this.sourceFilePath}.treefile`;
  }

  static async getVersion(binary?: string, options?: CommanderOptions): Promise<string> {
    try {
      if (!binary) {
        return 'unknown';
      }
      const tmpCommander = new MPBootCommander(binary, ['--help'], options);
      const output = await tmpCommander.executeInline();
      const mpbootRegex = new RegExp(mpbootRegexPattern);
      if (!mpbootRegex.test(output)) {
        return 'unknown';
      }
      const versionRegex = new RegExp(versionRegexPattern);
      const version = versionRegex.exec(output);
      if (version?.length) {
        return version[0];
      }
      return 'unknown';
    } catch (err: any) {
      return 'unknown';
    }
  }
}
