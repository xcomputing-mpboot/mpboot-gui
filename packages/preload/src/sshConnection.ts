import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../common/ipc';
import type { SSHConnectionInfo, SSHConnectionResponse } from '../../common/ssh';

export const connectSSH = async (
  localSSHInfo: SSHConnectionInfo,
): Promise<SSHConnectionResponse> => {
    console.log('localSSHInfo',localSSHInfo);
  try {
    const res = await ipcRenderer.invoke(IPC_EVENTS.SSH_CONNECT, localSSHInfo);
    console.log('res',res);
    return res as SSHConnectionResponse;
  } catch (error) {
    console.error('SSH Connection Error:', error);
    throw error;
  }
};

export const disconnectSSH = async (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke(IPC_EVENTS.SSH_DISCONNECT);
};

export const executeSSHCommand = async (
  command: string,
): Promise<{ success: boolean; output?: string; error?: string }> => {
  return ipcRenderer.invoke(IPC_EVENTS.SSH_COMMAND_EXECUTE, { command });
};

