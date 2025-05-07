import { toast } from 'react-hot-toast';
import type { ParameterState } from '../redux/state/parameter.state';
import { useElectron } from './useElectron';
import { useDispatch, useSelector } from 'react-redux';
import { Actions as ExecutionActions } from '../redux/slice/execution.slice';
import { Actions as ParameterActions } from '../redux/slice/parameter.slice';
import type { RootState } from '../redux/store/root';
import type { LoadExecutionHistoryPosition } from '../../../common/commander';
import { usePhylogenTree } from './usePhylogenTree';
import { useLog } from './useLog';
import { initialExecutionState } from '../redux/state/execution.state';
import { useContentView } from './useContentView';

export const useExecution = () => {
  const { id } = useSelector((state: RootState) => state.workspace);
  const dispatch = useDispatch();
  const electron = useElectron();
  const { setTreeFile } = usePhylogenTree();
  const { openFile } = useContentView();
  const { loadFullLog } = useLog();

  const executeCommand = async (parameter: ParameterState, isExecutionHistory = false) => {
    try {
      const { logFile, commandId } = await electron.executeCommand({
        parameter,
        isExecutionHistory,
        workspaceId: id,
      });
      dispatch(
        ExecutionActions.setExecution({
          logFile,
          commandId,
          isExecutionHistory,
          isRunning: true,
        }),
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const setSequenceNumber = (sequenceNumber: number) => {
    dispatch(ExecutionActions.setExecution({ sequenceNumber }));
  };

  const resetExecutionState = () => {
    dispatch(ExecutionActions.setExecution(initialExecutionState));
  };
  const loadExecutionHistory = async (
    sequenceNumber: number,
    position: LoadExecutionHistoryPosition = 'current',
  ) => {
    try {
      const {
        outputLogFilePath,
        outputTreeFilePath,
        canForward,
        canBackward,
        loadedSequenceNumber,
        seed,
        sourceChanged,
        ...parameter
      } = await electron.loadExecutionHistory({
        position,
        sequenceNumber,
        workspaceId: id,
      });

      dispatch(
        ExecutionActions.setExecution({
          isExecutionHistory: true,
          canBackward,
          canForward,
          sequenceNumber: loadedSequenceNumber,
          sourceChanged,
        }),
      );
      dispatch(
        ParameterActions.setParameter({
          ...parameter,
          seed,
        }),
      );
      console.log(outputLogFilePath);
      openFile(parameter.source!);
      setTreeFile(outputTreeFilePath);
      loadFullLog(outputLogFilePath);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return { executeCommand, setSequenceNumber, loadExecutionHistory, resetExecutionState };
};
