import { IPC_EVENTS } from '../../../common/ipc';
import { convertCommandToParameter } from '../../../common/parameter';
import { convertParameterToCommandArgs } from '../../../common/parameter';
import { logger } from '../../../common/logger';
import { randomUUID } from 'crypto';
import glob from 'glob';
import type {
  CommandCallbackOnFinishResult,
  ExecuteCommandRequest,
  ExecuteCommandResponse,
  LoadExecutionHistoryRequest,
  LoadExecutionHistoryResponse,
  SaveExecutionHistoryRequest,
} from '../../../common/commander';
import { MPBootCommander } from '../entity/mpboot-commander';
import { preInstalledMpbootExecutable } from '../const';
import { WhichCommander } from '../entity/which-commander';
import { wrapperIpcMainHandle } from './common.ipc';
import { ExecutionHistory } from '../entity/execution-history';
import { promisify } from 'util';
import path from 'path';
import { hashFile } from '../common/hash';
import { repository } from '../repository';
import { globalConfig } from '../configuration';
import { ssh } from './ssh.ipc';

const globAsync = promisify(glob);

wrapperIpcMainHandle(
  IPC_EVENTS.COMMAND_EXECUTE,
  async (event, req: ExecuteCommandRequest): Promise<ExecuteCommandResponse> => {
    try {
      const { parameter, isExecutionHistory, workspaceId, useSSH } = req;
      let targetParameter = parameter;
      let sequenceNumber = -1;

      logger.debug('Command execute request', { parameter, isExecutionHistory, workspaceId, useSSH });

    if (!isExecutionHistory) {
      sequenceNumber = await repository.getNextSequenceNumber(workspaceId);
      const workspace = await repository.getWorkspaceById(workspaceId);
      
      if (useSSH) {
        const outputFolderName = ExecutionHistory.formatOutputName(sequenceNumber);
        const remoteSourceDir = path.dirname(parameter.source!);
        //join fix
        const remoteOutputDir = remoteSourceDir + '/output/' + outputFolderName;
        
        const mkdirCmd = `mkdir -p "${remoteOutputDir}" && chmod 755 "${remoteOutputDir}"`;
        const createDirResult = await ssh.execCommand(mkdirCmd);
        
        if (createDirResult.code !== 0) {
          throw new Error(`Failed to create SSH output directory: ${createDirResult.stderr || createDirResult.stdout || 'Unknown error'}`);
        }
        
        const verifyCmd = `test -d "${remoteOutputDir}" && test -w "${remoteOutputDir}"`;
        const verifyResult = await ssh.execCommand(verifyCmd);
        
        if (verifyResult.code !== 0) {
          throw new Error(`Output directory not accessible or writable: ${remoteOutputDir}`);
        }
        
        const sourceBasename = path.basename(parameter.source!, path.extname(parameter.source!));
        //join fix
        const outputPrefix = remoteOutputDir + sourceBasename;
        
        targetParameter = {
          ...parameter,
          prefixOutput: outputPrefix,
        };
      } else {
        const newSourceFileLink = await ExecutionHistory.createOutputExecutionHistory(
          workspace!.path,
          sequenceNumber,
          parameter.source!,
        );
        targetParameter = {
          ...parameter,
          source: newSourceFileLink,
        };
      }
      
      await repository.createExecutionHistory(workspaceId, sequenceNumber);
    }
    
    const commandId = randomUUID();
    const spawnOptions: any = {};
    let remoteOutputDir = '';
    
    if (useSSH && targetParameter.source) {
      const sourcePath = targetParameter.source;
      const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/')) || '.';
      remoteOutputDir = sourceDir;
      spawnOptions.cwd = remoteOutputDir;
    }

    const args = convertParameterToCommandArgs(targetParameter);
    console.log('Executing command with args:', args);

    const hpcOptions = (parameter.submitCommand && parameter.checkCommand && parameter.submitTemplate) ? {
      submitCommand: parameter.submitCommand,
      checkCommand: parameter.checkCommand,
      submitTemplate: parameter.submitTemplate,
      eventSender: event.sender,
    } : undefined;
    
    const command = new MPBootCommander(
      globalConfig.mpboot.currentPath || preInstalledMpbootExecutable,
      args,
      { useSSH, spawnOptions, hpcOptions, eventSender: event.sender },
    );
    
    const result = await command.execute(async (exitCode) => {
      const data: CommandCallbackOnFinishResult = {
        treeFile: command.generatedTreeFilePath,
        isError: exitCode !== 0,
        sequenceNumber,
        workspaceId,
      };
      event.sender.send(IPC_EVENTS.COMMAND_CALLBACK_ON_FINISH(commandId), data);
      
      if (useSSH) {
        event.sender.send('ssh-directory-refresh', { 
          message: 'Command execution completed, refresh SSH directory tree', 
        });
      }
    });
    return {
      logFile: result.logFile,
      commandId,
      isExecutionHistory,
    };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in command execution';
      logger.error('Error in command execution: ' + errorMessage);
      throw new Error('Error when calling command:execute');
    }
  },
);

wrapperIpcMainHandle(IPC_EVENTS.AVAILABLE_TEST, async () => {
  const command = new WhichCommander(
    globalConfig.mpboot.currentPath || preInstalledMpbootExecutable,
  );
  try {
    return await command.test();
  } catch (err: any) {
    logger.error('Failed to test mpboot executable', err);
    return false;
  }
});

wrapperIpcMainHandle(
  IPC_EVENTS.COMMAND_SAVE_EXECUTION,
  async (_event, request: SaveExecutionHistoryRequest) => {
    const { seed, fullCommand, workspaceId, sequenceNumber } = request;
    const parameter = convertCommandToParameter(fullCommand);
    if (!parameter.source) {
      logger.error('Source file not found when saving command execution');
      return false;
    }
    try {
      const sourceHash = await hashFile(parameter.source);
      await repository.updateExecutionHistory(
        workspaceId,
        sequenceNumber,
        parameter,
        seed,
        sourceHash,
      );

      return true;
    } catch (err: any) {
      logger.error('Failed to save command execution', err);
      return false;
    }
  },
);

wrapperIpcMainHandle(
  IPC_EVENTS.COMMAND_LOAD_EXECUTION,
  async (_event, request: LoadExecutionHistoryRequest): Promise<LoadExecutionHistoryResponse> => {
    const { workspaceId, sequenceNumber, position } = request;
    let loadedSequenceNumber = sequenceNumber;
    try {
      const workspace = await repository.getWorkspaceById(workspaceId);
      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }
      let executionHistory: ExecutionHistory | null = null;

      executionHistory = await repository.getExecutionHistoryByWorkspaceIdAndSequenceNumber(
        workspaceId,
        loadedSequenceNumber,
      );

      if (!executionHistory) {
        throw new Error(
          `Execution history not found for workspaceId: ${workspaceId}, sequenceNumber: ${loadedSequenceNumber}`,
        );
      }
      const pattern = '*';
      //join fix
      const cwd = workspace.path + '/output';
      const all = await globAsync(pattern, { cwd });
      const onlyFiles = await globAsync(pattern, { cwd, nodir: true });
      const onlyDirectories = all.filter(x => !onlyFiles.includes(x));
      const directoriesConcatString = onlyDirectories.join(' ');
      const min = Math.min(...onlyDirectories.map(x => parseInt(x.split('_')[2])));
      const max = Math.max(...onlyDirectories.map(x => parseInt(x.split('_')[2])));

      if (position === 'previous' || position === 'next') {
        if (position === 'previous') {
          while (loadedSequenceNumber >= min) {
            loadedSequenceNumber -= 1;
            if (
              !new RegExp(`execution_[0-9]+_${loadedSequenceNumber}`).test(directoriesConcatString)
            ) {
              continue;
            }
            executionHistory = await repository.getExecutionHistoryByWorkspaceIdAndSequenceNumber(
              workspaceId,
              loadedSequenceNumber,
            );
            if (executionHistory) {
              break;
            }
          }
          if (loadedSequenceNumber < min) {
            throw new Error('No previous execution found');
          }
        } else if (position === 'next') {
          while (loadedSequenceNumber <= max) {
            loadedSequenceNumber += 1;
            if (
              !new RegExp(`execution_[0-9]+_${loadedSequenceNumber}`).test(directoriesConcatString)
            ) {
              continue;
            }
            executionHistory = await repository.getExecutionHistoryByWorkspaceIdAndSequenceNumber(
              workspaceId,
              loadedSequenceNumber,
            );
            if (executionHistory) {
              break;
            }
          }
          if (loadedSequenceNumber > max) {
            throw new Error('No next execution found');
          }
        }
      }
      if (!executionHistory) {
        throw new Error(
          `Execution history not found for workspaceId: ${workspaceId},sequenceNumber: ${loadedSequenceNumber}`,
        );
      }
      return {
        ...executionHistory.parameter,
        seed: executionHistory.seed,
        outputLogFilePath: executionHistory.getOutputFilePath('.log'),
        outputTreeFilePath: executionHistory.getOutputFilePath('.treefile'),
        canBackward: loadedSequenceNumber > min,
        canForward: loadedSequenceNumber < max,
        loadedSequenceNumber,
        sourceChanged:
          executionHistory.sourceHash !== (await hashFile(executionHistory.parameter.source!)),
      };
    } catch (err: any) {
      logger.error('Failed to load command execution', err);
      throw err;
    }
  },
);
