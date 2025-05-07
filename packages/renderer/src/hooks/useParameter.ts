import { useEffect, useReducer } from 'react';
import { useDispatch } from 'react-redux';
import { Actions } from '../redux/slice/parameter.slice';
import type { ParameterState } from '../redux/state/parameter.state';
import { isValidSourceFile } from '../utils/validate';

type MultiSourcesReducerAction = {
  type: 'add' | 'remove' | 'clear';
  payload: string;
};

const multiSourcesReducer = (state: string[], action: MultiSourcesReducerAction) => {
  switch (action.type) {
    case 'add':
      if (!isValidSourceFile(action.payload)) return state;
      return Array.from(new Set(state).add(action.payload).values());
    case 'remove':
      if (!isValidSourceFile(action.payload)) return state;
      return state.filter(e => e !== action.payload);
    case 'clear':
      return [];
    default:
      return state;
  }
};

export const useParameter = (): {
  setSource: (source: string) => void;
  setParameter: (payload: Partial<ParameterState>) => void;
  resetParameter: () => void;
  multiSourcesDispatch: React.Dispatch<MultiSourcesReducerAction>;
} => {
  const dispatch = useDispatch();
  const [multiSources, multiSourcesDispatch] = useReducer(multiSourcesReducer, []);

  useEffect(() => {
    if (multiSources.length === 0) return;
    dispatch(Actions.setParameter({ multiSources }));
  }, [multiSources]);

  const setSource = (source: string) => {
    dispatch(Actions.setParameter({ source }));
  };

  const setParameter = (payload: Partial<ParameterState>) => {
    dispatch(Actions.setParameter(payload));
  };

  const resetParameter = () => {
    dispatch(Actions.resetParameter());
  };

  return { setSource, setParameter, resetParameter, multiSourcesDispatch };
};
