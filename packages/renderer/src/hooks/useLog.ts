import { useDispatch } from 'react-redux';
import { useElectron } from './useElectron';
import { Actions } from '../redux/slice/log.slice';

export const useLog = () => {
  const dispatch = useDispatch();
  const electron = useElectron();

  const loadFullLog = async (logFile: string): Promise<void> => {
    const data = await electron.readContentFile(logFile);
    dispatch(Actions.clear());
    dispatch(
      Actions.appendLogData({
        logData: data.split('\n'),
        logFile,
      }),
    );
  };

  const resetLogState = () => {
    dispatch(Actions.clear());
  };

  return { loadFullLog, resetLogState };
};
