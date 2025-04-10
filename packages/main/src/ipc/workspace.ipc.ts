import { IPC_EVENTS } from '../../../common/ipc';
import type { CreateWorkspaceRequest, IWorkspace } from '../../../common/workspace';
import { DirectoryTree } from '../entity/directory-tree';
import { createInstanceKey, instanceManager } from '../entity/instance-manager';
import { Workspace } from '../entity/workspace';
import { WorkspaceInputData } from '../entity/workspace-input-data';
import { repository } from '../repository';
import { wrapperIpcMainHandle } from './common.ipc';

wrapperIpcMainHandle(IPC_EVENTS.WORKSPACE_LIST, async (_event): Promise<IWorkspace[]> => {
  return await repository.listWorkspaces();
});

wrapperIpcMainHandle(
  IPC_EVENTS.WORKSPACE_CREATE,
  async (_event, req: CreateWorkspaceRequest): Promise<IWorkspace> => {
    if (!validateCreateWorkspaceRequest(req)) {
      throw new Error('Invalid request');
    }
    const workspace = await repository.createWorkspace(new Workspace(req.name, req.path));
    const inputData = await repository.createInputDataForWorkspace(
      workspace.id,
      req.inputData.map(e => new WorkspaceInputData(e)),
    );
    const directoryTree = new DirectoryTree(workspace.name, workspace.path, inputData);
    instanceManager.set(createInstanceKey('content-file', req.path), directoryTree);
    return {
      ...workspace,
      inputData: inputData,
    };
  },
);

wrapperIpcMainHandle(
  IPC_EVENTS.WORKSPACE_CREATE_SSH,
  async (_event, req: CreateWorkspaceRequest): Promise<IWorkspace> => {
    if (!validateCreateWorkspaceRequest(req)) {
      throw new Error('Invalid request');
    }
    const workspace = await repository.createWorkspace(new Workspace(req.name, req.path));
    const inputData = await repository.createInputDataForWorkspace(
      workspace.id,
      req.inputData.map(e => new WorkspaceInputData(e)),
    );
    const directoryTree = new DirectoryTree(workspace.name, workspace.path, inputData);
    instanceManager.set(createInstanceKey('content-file', req.path), directoryTree);
    return {
      ...workspace,
      inputData: inputData,
    };
  },
);

wrapperIpcMainHandle(
  IPC_EVENTS.WORKSPACE_REMOVE,
  async(_event, req: number): Promise<void> => {
    await repository.removeWorkspace(req);
  },
);

const validateCreateWorkspaceRequest = (req: CreateWorkspaceRequest) => {
  return req.name && req.path && req.inputData;
};
