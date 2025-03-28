// packages/main/src/ipc/ssh.ipc.ts
import { IPC_EVENTS } from '../../../common/ipc';
import { wrapperIpcMainHandle } from './common.ipc';
import { NodeSSH } from 'node-ssh';
import type { SSHDirectoryState } from '../../../common/ssh';

const ssh = new NodeSSH();

// Kết nối SSH
wrapperIpcMainHandle(
  IPC_EVENTS.SSH_CONNECT,
  async (_event, { username, host, password }) => {
    console.log('🔌 SSH_CONNECT:', username, host);
    try {
      await ssh.connect({ host, username, password });
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

// Ngắt kết nối SSH
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

wrapperIpcMainHandle(
  IPC_EVENTS.SSH_DIRECTORY_TREE,
  async (_, currentPath = '.') => {
    try {
      const result = await ssh.execCommand(`cd ${currentPath} && ls -d */`);
      if (result.stderr) throw new Error(result.stderr);
      const directories = result.stdout
        .split('\n')
        .filter(dir => dir.trim() !== '')
        .map(dir => ({
          name: dir.replace('/', ''), 
          path: `${currentPath}/${dir.replace('/', '')}`, 
          children: [],
        }));

      return {
        success: true,
        message: 'Fetched SSH directory tree',
        directoryState: {
          currentPath,
          directoryTree: {
            name: currentPath,
            path: currentPath,
            children: directories,
          },
        } as SSHDirectoryState,
      };
    } catch (error) {
      console.error('❌ SSH_DIRECTORY_TREE Error:', error);
      return {
        success: false,
        message: 'Error fetching SSH directory tree',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);


// Mở thư mục trên SSH
wrapperIpcMainHandle(
  IPC_EVENTS.SSH_DIRECTORY_OPEN,
  async (_event, { path }) => {
    try {
      const result = await ssh.execCommand(`ls -l "${path}"`);
      return { success: true, content: result.stdout };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);

// Chọn một dự án trong cây thư mục SSH
wrapperIpcMainHandle(
  IPC_EVENTS.SSH_DIRECTORY_SELECT_PROJECT,
  async (_event, { path }) => {
    try {
      console.log('📂 Project selected:', path);
      return { success: true, selectedPath: path };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);

// Mở một tệp trong SSH
wrapperIpcMainHandle(
  IPC_EVENTS.SSH_CONTENT_FILE_OPEN,
  async (_event, { path }) => {
    try {
      const result = await ssh.execCommand(`cat "${path}"`);
      return { success: true, content: result.stdout };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);

// Đọc nội dung tệp trong SSH
wrapperIpcMainHandle(
  IPC_EVENTS.SSH_CONTENT_FILE_READ,
  async (_event, { path }) => {
    try {
      const result = await ssh.execCommand(`cat "${path}"`);
      return { success: true, content: result.stdout };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);

// Thực thi lệnh SSH
wrapperIpcMainHandle(
  IPC_EVENTS.SSH_COMMAND_EXECUTE,
  async (_event, { command }) => {
    try {
      const result = await ssh.execCommand(command);
      return { success: true, output: result.stdout };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);
