import FolderTree from '@khaitd0340/react-folder-tree';

import { useFileTree } from '../../hooks/useFileTree';
import { Directory } from '../../../../common/directory-tree';
import { RootState } from 'src/redux/store/root';
import { useSelector } from 'react-redux';

import { SSHState } from 'src/redux/state/ssh.state';
import DirectoryTree from './sshTree';

const sample: Directory = {
  name: 'test',
  path: 'D:/test',
  children: [
    {
      name: 'full.phy',
      path: 'D:/test/full.phy',
    },
  ],
};

export const FileTree = () => {
  const sshState = useSelector((state: RootState) => state.ssh);
  if (sshState.isConnected) {
    return (
      <div>
        <DirectoryTree
          directory={sample}
        />
      </div>
    );
  }
  const [nodeData, onTreeStateChange, onNameClick, onContextMenu] = useFileTree();

  if (!nodeData) return <div></div>;

  return (
    <div
      onContextMenu={onContextMenu}
      style={{ paddingLeft: '15px', paddingTop: '15px' }}
    >
      <FolderTree
        data={nodeData}
        onChange={onTreeStateChange}
        showCheckbox={true}
        onNameClick={onNameClick}
        indentPixels={10}
      />
    </div>
  );
};

