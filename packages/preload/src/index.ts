/**
 * @module preload
 */

import type { ExposedElectron } from '../../common/electron';
import { generateLog, subscribeLog, unsubscribeLog } from './log';
import {
  executeCommand,
  loadExecutionHistory,
  saveCommandExecution,
  subscribeCommandCallbackOnFinish,
} from './command';
import { openContentFile, readContentFile } from './content-file';
import {
  removeWorkspace,
  createWorkspace,
  listWorkspaces,
  chooseDirectory,
  chooseDirectoryOrFile,
} from './workspace';
import {
  getFirstLoadDirectoryTree,
  subscribeDirectoryTree,
  exploreDirectory,
  searchDirectoryTree,
} from './directory-tree';
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../common/ipc';
import { dirname, isDirectory, join } from './fs';
import { basename } from 'path';
import { showContentMenu } from './menu';
import {
  getInstallationMetadata,
  installVersion,
  subscribeOnInstallationWillOpen,
  useVersion,
} from './installation';
import { connectSSH, disconnectSSH } from './sshConnection';
import { getSSHDirectoryTree, openSSHDirectory, selectSSHProjectDirectory} from './sshDirectoryTree';

export { sha256sum } from './nodeCrypto';
export { versions } from './versions';
export { ipcRenderer } from 'electron';

const testAvailable = async (): Promise<boolean> => {
  const result = await ipcRenderer.invoke(IPC_EVENTS.AVAILABLE_TEST);
  return result as boolean;
};

export const exposed: ExposedElectron = {
  subscribeLog,
  generateLog,
  getFirstLoadDirectoryTree,
  subscribeDirectoryTree,
  exploreDirectory,
  openContentFile,
  readContentFile,
  executeCommand,
  subscribeCommandCallbackOnFinish,
  testAvailable,
  listWorkspaces: listWorkspaces,
  createWorkspace: createWorkspace,
  removeWorkspace:removeWorkspace,
  chooseDirectory: chooseDirectory,
  chooseDirectoryOrFile: chooseDirectoryOrFile,
  isDirectory: isDirectory,
  dirname: dirname,
  basename: basename,
  join: join,
  unsubscribeLog: unsubscribeLog,
  showContentMenu: showContentMenu,
  searchDirectoryTree: searchDirectoryTree,
  saveCommandExecution: saveCommandExecution,
  loadExecutionHistory: loadExecutionHistory,
  subscribeOnInstallationWillOpen: subscribeOnInstallationWillOpen,
  getInstallationMetadata,
  installVersion: installVersion,
  useVersion: useVersion,
  connectSSH: connectSSH,
  disconnectSSH: disconnectSSH,
  getSSHDirectoryTree: getSSHDirectoryTree,
  openSSHDirectory: openSSHDirectory,
  selectSSHProjectDirectory: selectSSHProjectDirectory,
};

contextBridge.exposeInMainWorld('electron', exposed);
