import { useCallback, useRef } from 'react';
import { useElectron } from '../../hooks/useElectron';
import classNames from 'classnames/bind';
import styles from './NewWorkspace.module.scss';

const cx = classNames.bind(styles);

export const WorkspaceDirectoryInput = () => {
  const electron = useElectron();
  const workspaceDirFormRef = useRef<HTMLInputElement>(null);

  const onCreateWorkspaceButtonClick = useCallback(
    (_e: any) => {
      (async () => {
        const res = await electron.chooseDirectory();
        if (res.canceled || !res.paths) return;

        if (!workspaceDirFormRef.current) return;
        workspaceDirFormRef.current.value = res.paths[0];
      })();
    },
    [electron, workspaceDirFormRef],
  );

  return (
    <div className={cx('workspace-input')}>
      <label>Workspace directory</label>
      <div className={cx('form-input')}>
        <input
        placeholder='/home/Disc C/MPboot/test/Demo'
        name="workspaceDir"
        required
        ref={workspaceDirFormRef}
      />
      <button className={cx('button')} onClick={onCreateWorkspaceButtonClick}>Edit</button>
      </div>
    </div>
  );
};
