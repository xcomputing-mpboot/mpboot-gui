import classNames from 'classnames/bind';
import { useCallback } from 'react';
import styles from './NewWorkspace.module.scss';

const cx = classNames.bind(styles);
export const WorkspaceNameInput = () => {
  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Workspace name changed:', e.target.value);
  }, []);

  return (
    <div className={cx('workspace-input')}>
      <label>Workspace name</label>
      <div className={cx('form-input')}>
        <input
          required
          name="workspaceName"
          onChange={onInputChange}
        />
      </div>
    </div>
  );
};
