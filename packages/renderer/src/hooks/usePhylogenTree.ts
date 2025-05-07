import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { Actions } from '../redux/slice/phylogen-tree.slice';
import { useElectron } from './useElectron';

export const usePhylogenTree = (): {
  setNewick: (newick: string) => void;
  setTreeFile: (filePath: string) => void;
  resetNewickState: () => void;
} => {
  const dispatch = useDispatch();
  const electron = useElectron();

  const setNewick = (newick: string) => {
    dispatch(Actions.setNewick(newick));
  };

  const isValidTreeFile = (filePath: string) => {
    const ext = filePath.split('.').pop();
    return ext === 'treefile';
  };

  const setTreeFile = (filePath: string) => {
    (async () => {
      try {
        if (!isValidTreeFile(filePath)) {
          return;
        }
        const treeNewick = (await electron.readContentFile(filePath)).trimEnd();
        setNewick(treeNewick);
      } catch (err: any) {
        toast.error(err.message);
      }
    })();
  };

  const resetNewickState = () => {
    dispatch(Actions.resetNewick());
  };

  return { setNewick, setTreeFile, resetNewickState };
};
