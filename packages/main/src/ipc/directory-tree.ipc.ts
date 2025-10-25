import { IPC_EVENTS } from '../../../common/ipc';
import { logger } from '../../../common/logger';
import { DirectoryTree } from '../entity/directory-tree';
import { createInstanceKey, instanceManager } from '../entity/instance-manager';
import { repository } from '../repository';
import { wrapperIpcMainHandle, wrapperIpcMainOn } from './common.ipc';
import { ssh } from './ssh.ipc';

wrapperIpcMainOn(IPC_EVENTS.DIRECTORY_TREE_SUBSCRIBE, async (event, dirPath) => {
  try {
    logger.debug('Directory tree subscribe requested', { dirPath });
    
    const ws = await repository.getWorkspaceByDirectoryPath(dirPath);
    if (!ws) {
      logger.debug('No workspace found for dirPath, skipping subscription', { dirPath });
      return;
    }
    
    logger.debug('Workspace found', { workspaceId: ws.id, isSSH: ws.isSSH, name: ws.name });
    
    if (ws.isSSH) {
      const sshConnected = ssh.isConnected();
      logger.debug('SSH workspace detected, skipping subscription', { dirPath, sshConnected });
      return;
    }
    
    const instanceKey = createInstanceKey('directory-tree', dirPath);
    let tree: DirectoryTree;
    if (instanceManager.has(instanceKey)) {
      logger.debug('Already have a tree instance', instanceKey);
      tree = instanceManager.get(instanceKey) as DirectoryTree;
    } else {
      tree = new DirectoryTree(ws.name, ws.path, ws.inputData!);
      await tree.bootstrap();
      instanceManager.set(instanceKey, tree);
      logger.debug('Create a new tree instance', instanceKey);
    }

    tree.subscribe(events => {
      event.sender.send(IPC_EVENTS.DIRECTORY_TREE_CHANGE_OF(dirPath), events);
    });
  } catch (error) {
    logger.error('Error in directory tree subscribe: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return;
  }
});

wrapperIpcMainOn(IPC_EVENTS.DIRECTORY_TREE_UNSUBSCRIBE, async (event, dirPath) => {
  try {
    logger.debug('Directory tree unsubscribe requested', { dirPath });
    
    const ws = await repository.getWorkspaceByDirectoryPath(dirPath);
    if (!ws) {
      logger.debug('No workspace found for dirPath, skipping unsubscribe', { dirPath });
      return;
    }
    
    if (ws.isSSH) {
      logger.debug('SSH workspace detected, skipping unsubscribe', { dirPath });
      return;
    }
    
    const instanceKey = createInstanceKey('directory-tree', dirPath);
    const tree = instanceManager.get(instanceKey) as DirectoryTree;
    if (tree) {
      await tree.unsubscribe();
      logger.debug('Directory tree unsubscribed', { instanceKey });
    }
  } catch (error) {
    logger.error('Error in directory tree unsubscribe: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

wrapperIpcMainHandle(IPC_EVENTS.DIRECTORY_TREE_FIRST_LOAD, async (event, dirPath) => {
  try {
      logger.debug('Directory tree first load requested', { dirPath });
      
      let ws;
      try {
        ws = await repository.getWorkspaceByDirectoryPath(dirPath);
      } catch (dbError) {
        logger.error('Database error when getting workspace for first load: ' + (dbError instanceof Error ? dbError.message : 'Unknown db error'));
        return {
          path: dirPath,
          name: 'Database Error',
          children: [],
        };
      }
      
      if (!ws) {
        logger.debug('No workspace found for dirPath, returning empty structure', { dirPath });
        return {
          path: dirPath,
          name: 'Unknown',
          children: [],
        };
      }
      
      logger.debug('Workspace found for first load', { workspaceId: ws.id, isSSH: ws.isSSH, name: ws.name });    if (ws.isSSH) {
      const sshConnected = ssh.isConnected();
      logger.debug('SSH workspace detected, returning empty structure', { dirPath, sshConnected });
      return {
        path: dirPath,
        name: ws.name,
        children: [],
      };
    }
    
    const instanceKey = createInstanceKey('directory-tree', dirPath);
    let tree: DirectoryTree;
    if (instanceManager.has(instanceKey)) {
      logger.debug('Already have a tree instance', instanceKey);
      tree = instanceManager.get(instanceKey) as DirectoryTree;
    } else {
      tree = new DirectoryTree(ws.name, ws.path, ws.inputData!);
      await tree.bootstrap();
      instanceManager.set(instanceKey, tree);
      logger.debug('Create a new tree instance', instanceKey);
    }
    const result = await tree.loadDirectoryTree();
    return result;
  } catch (error) {
    logger.error('Error in directory tree first load: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return {
      path: dirPath,
      name: 'Error',
      children: [],
    };
  }
});

wrapperIpcMainHandle(
  IPC_EVENTS.DIRECTORY_TREE_EXPLORE_DIRECTORY,
  async (_event, { dirPath, dirToExplore }) => {
    try {
      logger.debug('Directory tree explore requested', { dirPath, dirToExplore });
      
      const ws = await repository.getWorkspaceByDirectoryPath(dirPath);
      if (!ws) {
        logger.debug('No workspace found for dirPath, returning empty structure', { dirPath });
        return {
          path: dirToExplore,
          name: dirToExplore,
          children: [],
        };
      }
      
      logger.debug('Workspace found for explore', { workspaceId: ws.id, isSSH: ws.isSSH, name: ws.name });
      
      if (ws.isSSH) {
        const sshConnected = ssh.isConnected();
        logger.debug('SSH workspace detected, returning empty structure', { dirPath, sshConnected });
        return {
          path: dirToExplore,
          name: dirToExplore,
          children: [],
        };
      }
      
      const instanceKey = createInstanceKey('directory-tree', dirPath);
      let tree: DirectoryTree;
      if (instanceManager.has(instanceKey)) {
        logger.debug('Already have a tree instance', instanceKey);
        tree = instanceManager.get(instanceKey) as DirectoryTree;
      } else {
        tree = new DirectoryTree(ws.name, ws.path, ws.inputData!);
        await tree.bootstrap();
        instanceManager.set(instanceKey, tree);
        logger.debug('Create a new tree instance', instanceKey);
      }
      const result = await tree.explore(dirToExplore);
      return result;
    } catch (error) {
      logger.error('Error in directory tree explore: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return {
        path: dirToExplore,
        name: 'Error',
        children: [],
      };
    }
  },
);

wrapperIpcMainHandle(
  IPC_EVENTS.DIRECTORY_TREE_SEARCH,
  async (_event, { dirPath, pattern }: { dirPath: string; pattern: string }) => {
    try {
      logger.debug('Directory tree search requested', { dirPath, pattern });
      
      let ws;
      try {
        ws = await repository.getWorkspaceByDirectoryPath(dirPath);
      } catch (dbError) {
        logger.error('Database error when getting workspace: ' + (dbError instanceof Error ? dbError.message : 'Unknown db error'));
        return [];
      }
      
      if (!ws) {
        logger.debug('No workspace found for dirPath, returning empty array', { dirPath });
        return [];
      }
      
      logger.debug('Workspace found for search', { workspaceId: ws.id, isSSH: ws.isSSH, name: ws.name });
      
      if (ws.isSSH) {
        const sshConnected = ssh.isConnected();
        logger.debug('SSH workspace detected, returning empty array', { dirPath, sshConnected });
        return [];
      }
      
      const instanceKey = createInstanceKey('directory-tree', dirPath);
      let tree: DirectoryTree;
      if (instanceManager.has(instanceKey)) {
        logger.debug('Already have a tree instance', instanceKey);
        tree = instanceManager.get(instanceKey) as DirectoryTree;
      } else {
        tree = new DirectoryTree(ws.name, ws.path, ws.inputData!);
        await tree.bootstrap();
        instanceManager.set(instanceKey, tree);
        logger.debug('Create a new tree instance', instanceKey);
      }
      const result = await tree.search(pattern);
      return result;
    } catch (error) {
      logger.error('Error in directory tree search: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return [];
    }
  },
);
