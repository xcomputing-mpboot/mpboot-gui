import type React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store/root';
import { useExecution } from '../../hooks/useExecution';

export const ExecutionButton = () => {
  const parameter = useSelector((state: RootState) => state.parameter);
  const { isRunning, isExecutionHistory } = useSelector((state: RootState) => state.execution);
  const { executeCommand } = useExecution();

  const onRunButtonSubmit: React.FormEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    console.log(parameter);
    executeCommand(parameter, isExecutionHistory);
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
