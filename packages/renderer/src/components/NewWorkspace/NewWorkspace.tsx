import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useElectron } from '../../hooks/useElectron';
import { useWorkspace } from '../../hooks/useWorkspace';
import { MButton } from '../common/Button';
import { WorkspaceDirectoryInput } from './WorkspaceDirectoryInput';
import { WorkspaceInputDataInput } from './WorkspaceInputDataInput';
import { WorkspaceNameInput } from './WorkspaceNameInput';
import classNames from 'classnames/bind';
import styles from './NewWorkspace.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'src/redux/store/root';
import { Actions } from '../../redux/slice/item_menu.slice';

const cx = classNames.bind(styles);

export type NewWorkspaceData = {
  workspaceDirPath: string;
  workspaceName: string;
  inputData?: NewWorkspaceInputData[];
};
export type NewWorkspaceInputData = {
  refName: string;
  inputPath: string;
  type: 'file' | 'directory';
};

export const NewWorkspace = ({ isSSH }: { isSSH: boolean }) => {
  const { setWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stateSideBar = useSelector((state: RootState) => state.sidebarState);
  const sshState = useSelector((state: RootState) => state.ssh);
  const electron = useElectron();

  const onFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      (async () => {
        try {
          const form = e.currentTarget;
          const formData = new FormData(form);
          // Nếu SSH mode thì lấy workspaceDirPath từ sshState, nếu không thì từ input của người dùng
          const workspaceDirPath = isSSH
            ? sshState.currentPath
            : (formData.get('workspaceDir') as string);
          const workspaceName = formData.get('workspaceName') as string;
          const inputDataRaw = formData.get('inputData') as string;
          const workspace: NewWorkspaceData = {
            workspaceDirPath: workspaceDirPath || '',
            workspaceName,
            inputData: [],
          };

          if (inputDataRaw) {
            try {
              const inputData = JSON.parse(inputDataRaw);
              if (!workspace.inputData) {
                workspace.inputData = [];
              }
              workspace.inputData.push(inputData);
            } catch (err) {
              console.error('Error parsing inputData', err);
            }
          }

          console.log('Workspace Data:', workspace);
          let ws;
          if (isSSH) {
            // Gọi createSSHWorkspace để copy file vào thư mục dự án trên SSH
            ws = await electron.createWorkspaceSSH({
              inputData: workspace.inputData || [],
              path: workspace.workspaceDirPath,
              name: workspace.workspaceName,
              isSSH: true,
              sshConnectionInfo: {
                host: sshState.host,
                username: sshState.username,
                password: sshState.password,
              },
            });
            const res =await electron.copyContentFiletoSSH(
              workspace.inputData?.[0]?.inputPath ?? '',
              workspace.workspaceDirPath + '/' + (workspace.inputData?.[0]?.refName || ''),
            );
            if (!res.success) {
              throw new Error(res.error);
            }
            console.log('Copy file to SSH success:');
          } else {
            ws = await electron.createWorkspace({
              inputData: workspace.inputData || [],
              path: workspace.workspaceDirPath,
              name: workspace.workspaceName,
              isSSH: false,
            });
          }
          setWorkspace(ws);
          dispatch(
            Actions.setItemMenu({
              itemMenuSideBar: 0,
              openSideBar: false,
            })
          );
          navigate('/main');
        } catch (err: any) {
          toast.error(err.message);
        }
      })();
    },
    [navigate, isSSH, sshState.currentPath]
  );

  return (
    <div
      className={cx('new-workspace-container')}
      style={{ width: stateSideBar.openSideBar ? '83vw' : '95.5vw' }}
    >
      <div className={cx('new-workspace-container__header')}>
        <FontAwesomeIcon
          className={cx('arrow-left-icon')}
          icon={faChevronLeft}
          onClick={() => {
            dispatch(
              Actions.setItemMenu({
                itemMenuSideBar: 1,
                openSideBar: stateSideBar.openSideBar,
              })
            );
            navigate('/dashboard');
          }}
        />
        <span>Dashboard</span>
      </div>
      <div className={cx('new-workspace-container__content')}>
        <form onSubmit={onFormSubmit}>
          {isSSH ? (
            // Nếu ở chế độ SSH, hiển thị workspace directory mặc định dưới dạng read-only
            <div className={cx('workspace-input')}>
              <label>Workspace Directory</label>
              <div className={cx('form-input')}>
                <input readOnly value={sshState.currentPath} name="workspaceDir" />
              </div>
            </div>
          ) : (
            <WorkspaceDirectoryInput />
          )}
          <WorkspaceNameInput />
          <WorkspaceInputDataInput />
          <div className={cx('submit-btn')}>
            <MButton type="submit">
              {isSSH ? 'Create SSH Workspace' : 'Create Local Workspace'}
            </MButton>
          </div>
        </form>
      </div>
    </div>
  );
};
