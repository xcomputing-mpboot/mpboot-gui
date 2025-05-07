import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { SSHState } from '../state/ssh.state';
import { initialSSHState } from '../state/ssh.state';

export const sshSlice = createSlice({
  name: 'ssh',
  initialState: initialSSHState,
  reducers: {
    setSSHDetails: (state, action: PayloadAction<Partial<SSHState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setSSHError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
    setSSHDirectory: (state, action: PayloadAction<string>) => {
      state.currentPath = action.payload;
    },
    setSelectedPath: (state, action: PayloadAction<string>) => {
      state.selectedPath = action.payload;
    },
    resetSSHState: () => initialSSHState,
  },
});

export const SSHActions = sshSlice.actions;
export default sshSlice.reducer;