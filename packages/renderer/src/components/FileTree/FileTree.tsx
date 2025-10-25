import FolderTree from '@khaitd0340/react-folder-tree';

import { useFileTree } from '../../hooks/useFileTree';
import { Directory } from '../../../../common/directory-tree';
import { RootState } from 'src/redux/store/root';
import { useSelector } from 'react-redux';

import DirectoryTree from './sshTree';
import { useEffect, useState } from 'react';
import { useElectron } from '../../hooks/useElectron';

export const FileTree = () => {
  const sshState = useSelector((state: RootState) => state.ssh);
  const electron = useElectron();
  const [sshDirectory, setSshDirectory] = useState<Directory | null>(null);

  const fetchSSHData = async () => {
    if (!sshState.isConnected || !sshState.currentPath) return;
    try {
      const result = await electron.openSSHDirectory(sshState.currentPath);
      setSshDirectory(result);
    } catch (error) {
      console.error('Lỗi khi mở SSH directory:', error);
    }
  };

  useEffect(() => {
    fetchSSHData();
  }, [sshState.isConnected, sshState.currentPath]);

  // Listen for SSH directory refresh signals
  useEffect(() => {
    if (!sshState.isConnected) return;

    const handleSSHRefresh = () => {
      console.log('Refreshing SSH directory tree...');
      setTimeout(fetchSSHData, 1000); // Add delay to ensure SSH operations complete
    };

    // Listen for SSH directory refresh events (will be handled by periodic refresh for now)

    // Create a simple refresh mechanism and listen for window events
    const refreshInterval = setInterval(() => {
      // Auto-refresh SSH tree every 30 seconds when connected
      fetchSSHData();
    }, 30000);
    
    // Listen for focus events to refresh when window becomes active
    const handleFocus = () => {
      console.log('Window focused, refreshing SSH tree...');
      fetchSSHData();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sshState.isConnected, sshState.currentPath]);

  if (sshState.isConnected) {
    if (!sshDirectory) {
      return <div>Đang tải dữ liệu SSH...</div>;
    }
    return (
      <div>
        <DirectoryTree directory={sshDirectory} />
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
