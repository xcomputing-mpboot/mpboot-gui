import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MButton } from '../components/common/Button';
import { Layout } from '../components/Layout/Layout';
import classNames from 'classnames/bind';
import styles from './sshConnection.module.scss';
import { SSHActions } from '../redux/slice/ssh.slice';
import type { RootState } from '../redux/store/root';
import { IPC_EVENTS } from '../../../common/ipc';

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

const cx = classNames.bind(styles);

export const SSHConnectionPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const sshState = useSelector((state: RootState) => state.ssh);

  const [localSSHInfo, setLocalSSHInfo] = useState({
    username: sshState?.username || '',
    server: sshState?.server || '',
    password: sshState?.password || '',
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setLocalSSHInfo({
      ...localSSHInfo,
      [name]: value,
    });
  };

  const handleConnect = async () => {
    try {
      console.log(localSSHInfo);
      
      const result = await window.electronAPI.invoke(IPC_EVENTS.SSH_CONNECT, localSSHInfo);
      console.log(result);

      if (result.success) {
        dispatch(SSHActions.setConnectionStatus(true));
        dispatch(SSHActions.setSSHError(undefined));
        alert('Connected successfully!');
      } else {
        dispatch(SSHActions.setConnectionStatus(false));
        dispatch(SSHActions.setSSHError(result.error));
      }
    } catch (error) {
      dispatch(SSHActions.setConnectionStatus(false));
      dispatch(SSHActions.setSSHError('Connection failed!'));
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await window.electronAPI.invoke(IPC_EVENTS.SSH_DISCONNECT);

      if (result.success) {
        dispatch(SSHActions.setConnectionStatus(false));
        dispatch(SSHActions.setSSHError(undefined));
        alert('Disconnected successfully!');
      } else {
        dispatch(SSHActions.setSSHError(result.error));
      }
    } catch (error) {
      dispatch(SSHActions.setSSHError('Disconnection failed!'));
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className={cx('ssh-connection-container')}>
        <h1>SSH Connection</h1>

        {sshState?.error && (
          <div className={cx('error-message')}>{sshState.error}</div>
        )}

        <div className={cx('ssh-connection-form')}>
          <div className={cx('form-group')}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={localSSHInfo.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
            />
          </div>

          <div className={cx('form-group')}>
            <label htmlFor="server">Server</label>
            <input
              type="text"
              id="server"
              name="server"
              value={localSSHInfo.server}
              onChange={handleInputChange}
              placeholder="Enter server address"
            />
          </div>
          <div className={cx('form-group')}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={localSSHInfo.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
            />
          </div>

          <div className={cx('form-actions')}>
            <MButton onClick={sshState?.isConnected ? handleDisconnect : handleConnect}>
              {sshState?.isConnected ? 'Disconnect' : 'Connect'}
            </MButton>
            <MButton onClick={handleBack}>Back</MButton>
          </div>
        </div>
      </div>
    </Layout>
  );
};