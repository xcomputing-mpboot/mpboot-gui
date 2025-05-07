import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { initialPhylogenTreeState } from '../state/phylogen-tree.state';

export const phylogenTreeSlice = createSlice({
  name: 'phylogen-tree',
  initialState: initialPhylogenTreeState,
  reducers: {
    setNewick: (state, action: PayloadAction<string>) => {
      if (!action.payload) {
        return state;
      }
      return {
        ...state,
        newick: action.payload,
      };
    },

    resetNewick: _state => {
      return initialPhylogenTreeState;
    },
  },
});

export const Actions = phylogenTreeSlice.actions;
