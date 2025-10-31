import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../redux/store/root';
import { useEffect, useRef } from 'react';
import { useElectron } from '../../hooks/useElectron';
import { toast } from 'react-hot-toast';
import { usePhylogenTree } from '../../hooks/usePhylogenTree';
import { Actions as LogActions } from '../../redux/slice/log.slice';
import { Actions as ExecutionActions } from '../../redux/slice/execution.slice';
import type { SaveExecutionHistoryRequest } from '../../../../common/commander';
import { logger } from '../../../../common/logger';

const useGlobalExecution = () => {
  const { execution, workspace } = useSelector((state: RootState) => ({
    execution: state.execution,
    workspace: state.workspace,
  }));
  const electron = useElectron();
  const dispatch = useDispatch();
  const { setNewick } = usePhylogenTree();
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logDataToFlushRef = useRef<string[]>([]);

  const commandExecutionInfoRef = useRef<SaveExecutionHistoryRequest>({
    fullCommand: '',
    workspaceId: -1,
    seed: -1,
    sequenceNumber: -1,
  });

  useEffect(() => {
    try {
      const logStream = electron.subscribeLog(execution.logFile);
      dispatch(
        LogActions.setLogFile({
          logFile: execution.logFile,
          logData: [],
        }),
      );
      logStream.on('data', onLogDataDidFire);

      const commandStream = electron.subscribeCommandCallbackOnFinish(
        execution.commandId,
        async result => {
          const { isError, sequenceNumber, treeFile } = result;
          
          dispatch(
            ExecutionActions.setExecution({
              isRunning: false,
            }),
          );
          
          if (isError) {
            toast.error("Command didn't finish successfully");
          } else {
            const treeNewick = (await electron.readContentFile(treeFile)).trimEnd();
            setNewick(treeNewick);
            toast.success('Command finished successfully');
            
            if (!execution.isExecutionHistory) {
              await electron.saveCommandExecution({
                sequenceNumber,
                fullCommand: commandExecutionInfoRef.current.fullCommand,
                workspaceId: workspace.id,
                seed: commandExecutionInfoRef.current.seed,
              });
            }
          }
          commandStream.unsubscribe();
        },
      );
      return () => {
        logStream.unregister();
      };
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [execution.commandId]);

  const onLogDataDidFire = (data: string) => {
    const commandHeader = 'Command: ';
    let i = data.indexOf(commandHeader);
    if (i != -1) {
      commandExecutionInfoRef.current.fullCommand = data.slice(
        i + commandHeader.length,
        data.length,
      );
    }
    const seedHeader = 'Seed: ';
    i = data.indexOf(seedHeader);
    if (i != -1) {
      const regexResult = new RegExp('[0-9]+').exec(data);
      if (regexResult == null) {
        logger.error('Seed not found in log file');
      }
      commandExecutionInfoRef.current.seed = parseInt(regexResult![0]);
    }
    if (logTimeoutRef.current) {
      clearTimeout(logTimeoutRef.current);
    }
    logDataToFlushRef.current.push(data);
    logTimeoutRef.current = setTimeout(() => {
      dispatch(
        LogActions.appendLogData({
          logData: logDataToFlushRef.current,
        }),
      );
      logDataToFlushRef.current = [];
    }, 100);
  };
};

export const GlobalExecution = () => {
  useGlobalExecution();
  return <></>;
};
