import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Actions } from '../redux/slice/phylogen-tree.slice';
import { useElectron } from './useElectron';
import type { RootState } from '../redux/store/root';

export const usePhylogenTree = (): {
  setNewick: (newick: string) => void;
  setTreeFile: (filePath: string) => void;
  resetNewickState: () => void;
} => {
  const dispatch = useDispatch();
  const electron = useElectron();
  const sshState = useSelector((state: RootState) => state.ssh);

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
        
        let treeNewick: string;
        
        // Check if we're in SSH mode and have a current SSH connection
        if (sshState.currentPath && sshState.isConnected) {
          // Use SSH file reading for remote files
          const contentFile = await electron.openContentFileSSH(filePath);
          if (!contentFile || !contentFile.content) {
            toast.error('Failed to read SSH tree file');
            return;
          }
          treeNewick = contentFile.content.trimEnd();
        } else {
          // Use local file reading
          treeNewick = (await electron.readContentFile(filePath)).trimEnd();
        }
        
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
