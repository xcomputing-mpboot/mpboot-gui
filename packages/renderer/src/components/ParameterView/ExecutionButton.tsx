import type React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store/root';
import { useExecution } from '../../hooks/useExecution';

export const ExecutionButton = () => {
  const parameter = useSelector((state: RootState) => state.parameter);
  const { isRunning, isExecutionHistory } = useSelector((state: RootState) => state.execution);
  const sshState = useSelector((state: RootState) => state.ssh);
  const { executeCommand } = useExecution();

  const onRunButtonSubmit: React.FormEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    console.log('Executing command with parameters:', parameter);
    console.log('SSH connected:', sshState.isConnected);
    console.log('SSH host:', sshState.host);
    executeCommand(parameter, isExecutionHistory);
  };

  const getButtonText = () => {
    if (isRunning) {
      return sshState.isConnected ? 'Running on SSH...' : 'Running...';
    }
    const baseText = isExecutionHistory ? 'Re-run' : 'Run';
    return sshState.isConnected ? `${baseText} (SSH)` : baseText;
  };

  return (
    <div>
      <button
        id="run-button"
        onClick={onRunButtonSubmit}
        disabled={!!isRunning}
        className={`btn-parameter ${isRunning ? 'btn-parameter-running' : ''}`}
        title={sshState.isConnected ? `Will execute on ${sshState.host}` : 'Will execute locally'}
      >
        {getButtonText()}
      </button>
    </div>
  );
};
