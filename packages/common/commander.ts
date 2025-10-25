import type { Parameter } from './parameter';

export interface ExecuteCommandRequest {
  parameter: Parameter;
  isExecutionHistory: boolean;
  workspaceId: number;
  useSSH?: boolean;
}
export interface ExecuteCommandResponse {
  commandId: string;
  logFile: string;
  isExecutionHistory: boolean;
}

export interface CommandCallbackOnFinishResult {
  treeFile: string;
  isError: boolean;
  sequenceNumber: number;
  workspaceId: number;
}

export interface SaveExecutionHistoryRequest {
  fullCommand: string;
  workspaceId: number;
  seed: number;
  sequenceNumber: number;
}
export type LoadExecutionHistoryPosition = 'current' | 'previous' | 'next';
export interface LoadExecutionHistoryRequest {
  workspaceId: number;
  sequenceNumber: number;
  position?: LoadExecutionHistoryPosition;
}

export interface LoadExecutionHistoryResponse extends Parameter {
  seed: number;
  outputLogFilePath: string;
  outputTreeFilePath: string;
  canForward: boolean;
  canBackward: boolean;
  loadedSequenceNumber: number;
  sourceChanged: boolean;
}
