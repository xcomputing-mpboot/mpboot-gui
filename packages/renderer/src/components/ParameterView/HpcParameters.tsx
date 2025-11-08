import type React from 'react';
import { useSelector } from 'react-redux';
import { useParameter } from '../../hooks/useParameter';
import type { RootState } from '../../redux/store/root';

export const HpcParameters = () => {
  const { setParameter } = useParameter();
  const { submitCommand, checkCommand, submitTemplate } = useSelector(
    (state: RootState) => state.parameter
  );
  const { isExecutionHistory } = useSelector((state: RootState) => state.execution);
  const { isConnected } = useSelector((state: RootState) => state.ssh);

  const onSubmitCommandChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    setParameter({
      submitCommand: e.target.value || '',
    });
  };

  const onCheckCommandChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    setParameter({
      checkCommand: e.target.value || '',
    });
  };

  const onSubmitTemplateChange: React.ChangeEventHandler<HTMLTextAreaElement> = e => {
    setParameter({
      submitTemplate: e.target.value || '',
    });
  };

  // Only show HPC parameters when SSH is connected
  if (!isConnected) {
    return null;
  }

  return (
    <>
      <tr className='parameter-item'>
        <td className='parameter-item-title'>Submit command</td>
        <td className='parameter-item-value'>
          <input
            onChange={onSubmitCommandChange}
            type="text"
            placeholder="e.g., sbatch, qsub"
            key={isExecutionHistory ? submitCommand : 'editable-submit'}
            defaultValue={isExecutionHistory ? submitCommand : submitCommand || ''}
          />
        </td>
      </tr>
      <tr className='parameter-item'>
        <td className='parameter-item-title'>Check command</td>
        <td className='parameter-item-value'>
          <input
            onChange={onCheckCommandChange}
            type="text"
            placeholder="e.g., squeue -j {job_id}, qstat {job_id}"
            key={isExecutionHistory ? checkCommand : 'editable-check'}
            defaultValue={isExecutionHistory ? checkCommand : checkCommand || ''}
          />
        </td>
      </tr>
      <tr className='parameter-item'>
        <td className='parameter-item-title'>Submit template</td>
        <td className='parameter-item-value'>
          <textarea
            onChange={onSubmitTemplateChange}
            rows={8}
            placeholder="Job submission script template"
            key={isExecutionHistory ? submitTemplate : 'editable-template'}
            defaultValue={isExecutionHistory ? submitTemplate : submitTemplate || ''}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9em' }}
          />
        </td>
      </tr>
    </>
  );
};

