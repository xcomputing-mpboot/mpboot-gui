import { configureStore } from '@reduxjs/toolkit';
import { contentFileSlice } from '../slice/content-file.slice';
import { logSlice } from '../slice/log.slice';
import { parameterSlice } from '../slice/parameter.slice';
import { workspaceSlice } from '../slice/workspace.slice';
import { phylogenTreeSlice } from '../slice/phylogen-tree.slice';
import { executionSlice } from '../slice/execution.slice';
import { SidebarStateSlice } from '../slice/item_menu.slice';
import { sshSlice } from '../slice/ssh.slice';

export const store = configureStore({
  reducer: {
    contentFile: contentFileSlice.reducer,
    parameter: parameterSlice.reducer,
    log: logSlice.reducer,
    workspace: workspaceSlice.reducer,
    phylogenTree: phylogenTreeSlice.reducer,
    execution: executionSlice.reducer,
    sidebarState: SidebarStateSlice.reducer,
    ssh: sshSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
