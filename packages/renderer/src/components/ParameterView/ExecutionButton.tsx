import type React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store/root';
import { useExecution } from '../../hooks/useExecution';
import { convertParameterToCommandArgs } from '../../../../common/parameter';
import { useElectron } from 'src/hooks/useElectron';

export const ExecutionButton = () => {
  const parameter = useSelector((state: RootState) => state.parameter);
  const { isRunning, isExecutionHistory } = useSelector((state: RootState) => state.execution);
  const { executeCommand } = useExecution();
  const sshState = useSelector((state: RootState) => state.ssh);
  const electron = useElectron();
  const onRunButtonSubmit: React.FormEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    console.log(parameter);
    const args = convertParameterToCommandArgs(parameter);
    console.log('Executing command with args:', args);
    if (sshState.isConnected) {}
      
  };

  return (
    <div>
      <button
        id="run-button"
        onClick={onRunButtonSubmit}
        disabled={!!isRunning}
        className="btn-parameter"
      >
        {isExecutionHistory ? 'Re-run' : 'Run'}
      </button>
    </div>
  );
};
