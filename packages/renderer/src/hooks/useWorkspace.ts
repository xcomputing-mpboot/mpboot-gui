import { useDispatch } from 'react-redux';
import type { IWorkspace } from '../../../common/workspace';
import { Actions as WorkspaceAction } from '../redux/slice/workspace.slice';
import { Actions as ContentFileAction } from '../redux/slice/content-file.slice';
import { SSHActions } from '../redux/slice/ssh.slice'; // ✅ dùng đúng slice của bạn
import { useRef } from 'react';
import type { SSHState } from '../redux/state/ssh.state';

export const useWorkspace = (): {
  getRelativePath: (path: string, wsPath: string) => string;
  setWorkspace: (ws: IWorkspace) => void;
  sshState: React.MutableRefObject<Partial<SSHState> | null>;
} => {
  const dispatch = useDispatch();
  const isSSHRef = useRef(false);
  const sshStateRef = useRef<Partial<SSHState> | null>(null);

  const getRelativePath = (path: string, wsPath: string) => {
    return isSSHRef.current ? path : path.replace(wsPath, '.');
  };

  const setWorkspace = (ws: IWorkspace) => {
    console.log('setWorkspace', ws);
    dispatch(ContentFileAction.clear());
    isSSHRef.current = !!ws.isSSH;
    console.log('ws', ws);
    const payload: any = {
      dirPath: ws.path,
      name: ws.name,
      id: ws.id,
      isSSH: ws.isSSH,
    };

    if (ws.isSSH && ws.sshConnectionInfo && ws.sshConnectionInfo.port !== undefined) {
      payload.sshConnectionInfo = {
        host: ws.sshConnectionInfo.host,
        port: ws.sshConnectionInfo.port,
        username: ws.sshConnectionInfo.username,
        password: ws.sshConnectionInfo.password,
      };

      const sshDetails: Partial<SSHState> = {
        username: ws.sshConnectionInfo.username,
        host: ws.sshConnectionInfo.host,
        password: ws.sshConnectionInfo.password,
        isConnected: true,
        currentPath: ws.path,
        selectedPath: ws.path,
      };

      dispatch(SSHActions.setSSHDetails(sshDetails));
      sshStateRef.current = sshDetails;
    } else {
      dispatch(SSHActions.resetSSHState());
      sshStateRef.current = null;
    }

    dispatch(WorkspaceAction.setWorkspace(payload));
  };

  return {
    getRelativePath,
    setWorkspace,
    sshState: sshStateRef,
  };
};
