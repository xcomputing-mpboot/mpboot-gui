import classNames from 'classnames/bind';
import styles from './NewWorkspace.module.scss';

const cx = classNames.bind(styles);
export const WorkspaceNameInput = () => {
  return (
    <div className={cx('workspace-input')}>
      <label>Workspace name</label>
      <div className={cx('form-input')}>
        <input
        required
        name="workspaceName"
        />
      </div>
    </div>
  );
};
