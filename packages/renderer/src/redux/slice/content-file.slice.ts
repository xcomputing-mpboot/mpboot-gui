import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ContentFileState } from '../state/content-file.state';
import { initialContentFileState } from '../state/content-file.state';

export const contentFileSlice = createSlice({
  name: 'content-file',
  initialState: initialContentFileState,
  reducers: {
    setContentFile: (state, action: PayloadAction<Partial<ContentFileState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    setContentFileOnlyMatchPath: (state, action: PayloadAction<Partial<ContentFileState>>) => {
      if (state.path !== action.payload.path) {
        return state;
      }
      return {
        ...state,
        ...action.payload,
      };
    },
    clear: _state => {
      return {
        path: '',
        name: '',
      };
    },
    openFile: (state, action: PayloadAction<Partial<ContentFileState>>) => {
      if (!action.payload.path || !action.payload.name) {
        return state;
      }
      return {
        path: action.payload.path,
        name: action.payload.name,
      };
    },
  },
});

export const Actions = contentFileSlice.actions;
