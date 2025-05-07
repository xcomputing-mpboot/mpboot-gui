import { IPC_EVENTS } from './../../common/ipc';
import { ipcRenderer } from 'electron';
import type {
  CreateWorkspaceRequest,
  IWorkspace,
  DialogChooseDirectoryOrFileResult,
} from '../../common/workspace';

export const chooseDirectory = async () => {
  const result = await ipcRenderer.invoke(IPC_EVENTS.DIALOG_CHOOSE_DIRECTORY, {});
  return result as DialogChooseDirectoryOrFileResult;
};

export const chooseDirectoryOrFile = async () => {
  const result = await ipcRenderer.invoke(IPC_EVENTS.DIALOG_CHOOSE_DIRECTORY_OR_FILE, {});
  return result as DialogChooseDirectoryOrFileResult;
};

export const listWorkspaces = async () => {
  const result = await ipcRenderer.invoke(IPC_EVENTS.WORKSPACE_LIST, {});
  return result as IWorkspace[];
};

export const createWorkspace = async (req: CreateWorkspaceRequest) => {
  const result = await ipcRenderer.invoke(IPC_EVENTS.WORKSPACE_CREATE, req);
  return result as IWorkspace;
};

export const createWorkspaceSSH = async (req: CreateWorkspaceRequest) => {
  const result = await ipcRenderer.invoke(IPC_EVENTS.WORKSPACE_CREATE_SSH, req);
  return result as IWorkspace;
};

export const removeWorkspace = async (req: number) => {
  await ipcRenderer.invoke(IPC_EVENTS.WORKSPACE_REMOVE,req);
};
