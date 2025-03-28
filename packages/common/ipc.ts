import md5 from 'md5';

export const IPC_EVENTS = {
  LOG_SUBSCRIBE: 'log:subscribe',
  LOG_FILE_OF: (logFile: string) => `log:file-${md5(logFile)}`,
  LOG_GENERATE: 'log:generate',
  LOG_UNSUBSCRIBE: 'log:unsubscribe',

  DIRECTORY_TREE_SUBSCRIBE: 'directory-tree:subscribe',
  DIRECTORY_TREE_CHANGE_OF: (dirPath: string) => `directory-tree:change-${md5(dirPath)}`,
  DIRECTORY_TREE_FIRST_LOAD: 'directory-tree:first-load',
  DIRECTORY_TREE_UNSUBSCRIBE: 'directory-tree:unsubscribe',
  DIRECTORY_TREE_EXPLORE_DIRECTORY: 'directory-tree:explore-directory',
  DIRECTORY_TREE_SEARCH: 'directory-tree:search',

  CONTENT_FILE_OPEN: 'content-file:open',
  CONTENT_FILE_READ: 'content-file:read',

  COMMAND_EXECUTE: 'command:execute',
  COMMAND_SAVE_EXECUTION: 'command:save-execution',
  COMMAND_LOAD_EXECUTION: 'command:load-execution',
  COMMAND_CALLBACK_ON_FINISH: (commandId: string) => `command:${commandId}:callback-on-finish`,

  DIALOG_CHOOSE_DIRECTORY: 'dialog:choose-directory',
  DIALOG_CHOOSE_DIRECTORY_OR_FILE: 'dialog:choose-directory-or-file',
  WORKSPACE_LIST: 'workspace:list',
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_REMOVE: 'workspace:remove',

  AVAILABLE_TEST: 'available:test',

  CONTEXT_MENU_SHOW: 'context-menu:show',

  INSTALLATION_OPEN: 'installation:open',
  INSTALLATION_GET_METADATA: 'installation:get-metadata',
  INSTALLATION_INSTALL_VERSION: 'installation:install-version',
  INSTALLATION_CALLBACK_ON_PROGRESS: (versionId: string) =>
    `installation:${versionId}:callback-on-progress`,
  INSTALLATION_CALLBACK_ON_SUCCEED: (versionId: string) =>
    `installation:${versionId}:callback-on-succeed`,
  INSTALLATION_CALLBACK_ON_ERROR: (versionId: string) =>
    `installation:${versionId}:callback-on-error`,
  INSTALLATION_USE_VERSION: 'installation:use-version',
  SSH_CONNECT: 'ssh-connect',
  SSH_DISCONNECT: 'ssh-disconnect',
  SSH_DIRECTORY_TREE: 'ssh-directory-tree',
  SSH_DIRECTORY_OPEN: 'ssh-directory-tree:open',
  SSH_DIRECTORY_SELECT_PROJECT: 'ssh-directory-tree:select-project',
  SSH_CONTENT_FILE_OPEN: 'ssh-content-file:open',
  SSH_CONTENT_FILE_READ: 'ssh-content-file:read',
  SSH_COMMAND_EXECUTE: 'ssh-command:execute',
};
