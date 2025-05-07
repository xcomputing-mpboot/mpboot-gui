import path from 'node:path';
import type { Parameter } from '../../../common/parameter';
import { mkdir, symlink } from 'fs/promises';

export class ExecutionHistory {
  public constructor(
    public id: number,
    public workspaceId: number,
    public parameter: Parameter,
    public seed: number,
    public sequenceNumber: number,
    public sourceHash: string,
  ) {}

  public static formatOutputName(sequenceNumber: number) {
    return `execution_${new Date().getTime()}_${sequenceNumber}`;
  }

  public static async createOutputExecutionHistory(
    workspacePath: string,
    sequenceNumber: number,
    sourceFile: string,
  ): Promise<string> {
    const outputFolderName = ExecutionHistory.formatOutputName(sequenceNumber);
    const outputFolderPath = path.join(workspacePath, 'output', outputFolderName);
    await mkdir(outputFolderPath, { recursive: true });

    const outputSourceFilePath = path.join(outputFolderPath, 'source' + path.extname(sourceFile));
    await symlink(sourceFile, outputSourceFilePath);

    return outputSourceFilePath;
  }

  public getOutputFilePath(extension: string): string {
    const { prefixOutput, source } = this.parameter;
    if (!source) {
      throw new Error('Source is undefined');
    }

    return (prefixOutput && prefixOutput !== '' ? prefixOutput : source).concat(extension);
  }

  public static fromRow(row: any): ExecutionHistory {
    return new ExecutionHistory(
      row.id,
      row.workspace_id,
      JSON.parse(row.parameters),
      row.seed,
      row.sequence_number,
      row.source_hash,
    );
  }
}
