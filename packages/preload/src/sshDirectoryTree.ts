import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../common/ipc';
import type { Directory } from '../../common/directory-tree';


export const getSSHDirectoryTree = async (path : string): Promise<Directory> => {
  try {
      const res = await ipcRenderer.invoke(IPC_EVENTS.SSH_DIRECTORY_TREE, path);
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch SSH directory tree');
      }
  
      return res.directoryState.directoryTree as Directory;
    } catch (error) {
      console.error('SSH Directory Tree Error:', error);
      throw error;
    }
  };

export const openSSHDirectory = async (path: string): Promise<Directory> => {
  try {
    const res = await ipcRenderer.invoke(IPC_EVENTS.SSH_DIRECTORY_OPEN, path);
    console.log('res1', res);
    if (!res.success) {
      throw new Error(res.error || 'Failed to open SSH directory');
    }
    return res.directoryState.directoryTree as Directory;
  } catch (error) {
    console.error('SSH Directory Open Error:', error);
    throw error;
  }
};

export const selectSSHProjectDirectory = async (path: string): Promise<{ success: boolean; selectedPath?: string }> => {
  try {
    const res = await ipcRenderer.invoke(IPC_EVENTS.SSH_DIRECTORY_SELECT_PROJECT, { path });
    if (!res.success) {
      throw new Error(res.error || 'Failed to select project directory');
    }
    return { success: true, selectedPath: res.selectedPath };
  } catch (error) {
    console.error('SSH Select Project Directory Error:', error);
    throw error;
  }
};

export const copyContentFiletoSSH = async (sourcePath: string, destinationPath: string): Promise<{ success: boolean; message?: string }> => {
  console.log('Copying file from', sourcePath, 'to', destinationPath);
  try {
    const res = await ipcRenderer.invoke(IPC_EVENTS.SSH_CONTENT_FILE_COPY, { 
      localPath: sourcePath,
      remotePath: destinationPath, 
    });
    if (!res.success) {
      throw new Error(res.error || 'Failed to copy file to SSH');
    }
    return { success: true, message: res.message };
  } catch (error) {
    console.error('SSH Copy File Error:', error);
    throw error;
  }
};

export const openContentFileSSH = async (
  remotePath: string,
): Promise<{ success: boolean; content?: string; error?: string }> => {
  console.log('Opening SSH file:', remotePath);
  try {
    const res = await ipcRenderer.invoke(IPC_EVENTS.SSH_CONTENT_FILE_OPEN, {
      path: remotePath,
    });
    if (!res.success) {
      throw new Error(res.error ?? 'Failed to open file on SSH');
    }
    return { success: true, content: res.content };
  } catch (error) {
    console.error('SSH Open File Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};