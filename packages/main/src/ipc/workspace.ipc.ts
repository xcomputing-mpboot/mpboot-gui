import { IPC_EVENTS } from '../../../common/ipc';
import type { CreateWorkspaceRequest, IWorkspace } from '../../../common/workspace';
import { DirectoryTree } from '../entity/directory-tree';
import { createInstanceKey, instanceManager } from '../entity/instance-manager';
import { Workspace } from '../entity/workspace';
import { WorkspaceInputData } from '../entity/workspace-input-data';
import { repository } from '../repository';
import { wrapperIpcMainHandle } from './common.ipc';

// List Workspaces
wrapperIpcMainHandle(
  IPC_EVENTS.WORKSPACE_LIST,
  async (_event): Promise<IWorkspace[]> => {
    const workspaces = await repository.listWorkspaces();
    return workspaces.map(ws => {
      // Build SSH DTO ensuring password is string
      let sshInfo: { host: string; port?: number; username: string; password: string } | undefined;
      if (ws.sshConnectionInfo) {
        sshInfo = {
          host: ws.sshConnectionInfo.host,
          port: ws.sshConnectionInfo.port,
          username: ws.sshConnectionInfo.username,
          password: ws.sshConnectionInfo.password as string,
        };
      }
      return {
        ...ws,
        sshConnectionInfo: sshInfo,
      };
    });
  },
);

// Create Workspace (local or SSH)
wrapperIpcMainHandle(
  IPC_EVENTS.WORKSPACE_CREATE,
  async (_event, req: CreateWorkspaceRequest): Promise<IWorkspace> => {
    if (!validateCreateWorkspaceRequest(req)) {
      throw new Error('Invalid request');
    }

    // Create Workspace entity
    const wsEntity = new Workspace(req.name, req.path, req.isSSH);
    const workspace = await repository.createWorkspace(wsEntity);

    // Create input data
    const inputData = await repository.createInputDataForWorkspace(
      workspace.id,
      req.inputData.map(e => new WorkspaceInputData(e)),
    );

    // Build directory tree and cache instance
    const directoryTree = new DirectoryTree(workspace.name, workspace.path, inputData);
    instanceManager.set(createInstanceKey('content-file', req.path), directoryTree);

    return {
      ...workspace,
      inputData,
      sshConnectionInfo: workspace.sshConnectionInfo ?? undefined,
    };
  },
);

// Create SSH-only Workspace
wrapperIpcMainHandle(
  IPC_EVENTS.WORKSPACE_CREATE_SSH,
  async (_event, req: CreateWorkspaceRequest): Promise<IWorkspace> => {
    if (!validateCreateWorkspaceRequest(req)) {
      throw new Error('Invalid request');
    }

    // Create SSH Workspace entity
    const wsEntity = new Workspace(req.name, req.path, req.isSSH, req.sshConnectionInfo);
    const workspace = await repository.createWorkspace(wsEntity);

    // Must have SSH info
    if (req.sshConnectionInfo) {
      const password = req.sshConnectionInfo.password;
      if (!password) throw new Error('SSH password is required');

      const sshEntity = await repository.getSSHConnectionByWorkspaceId(workspace.id);
      if (sshEntity) {
        workspace.sshConnectionInfo = {
          host: sshEntity.host,
          port: sshEntity.port,
          username: sshEntity.username,
          password: sshEntity.password,
        };
      }
    }

    // Create input data
    const inputData = await repository.createInputDataForWorkspace(
      workspace.id,
      req.inputData.map(e => new WorkspaceInputData(e)),
    );

    const directoryTree = new DirectoryTree(workspace.name, workspace.path, inputData);
    instanceManager.set(createInstanceKey('content-file', req.path), directoryTree);

    return {
      ...workspace,
      inputData,
      sshConnectionInfo: workspace.sshConnectionInfo ?? undefined,
    };
  },
);

// Remove Workspace
wrapperIpcMainHandle(
  IPC_EVENTS.WORKSPACE_REMOVE,
  async (_event, req: number): Promise<void> => {
    await repository.removeWorkspace(req);
  },
);

// Validation helper
const validateCreateWorkspaceRequest = (req: CreateWorkspaceRequest) => {
  return Boolean(req.name && req.path && req.inputData);
};
