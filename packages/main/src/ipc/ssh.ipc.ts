// packages/main/src/ipc/ssh.ipc.ts
import { IPC_EVENTS } from '../../../common/ipc';
import { wrapperIpcMainHandle } from './common.ipc';
import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

wrapperIpcMainHandle(
  IPC_EVENTS.SSH_CONNECT,
  async (_event, { username, host, password }) => {
    console.log('ipc event',username, host, password);
    try {
      await ssh.connect({
        host: host,
        username: username,
        password: password,
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
      };
    }
  },
);

wrapperIpcMainHandle(
  IPC_EVENTS.SSH_DISCONNECT,
  async () => {
    try {
      ssh.dispose();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
      };
    }
  },
);