import React, { useState } from 'react';
import './sshTree.css';
import { useDispatch, useSelector } from 'react-redux';
import type { Directory } from '../../../../common/directory-tree';
import { useElectron } from '../../hooks/useElectron';
import { Actions } from '../../redux/slice/content-file.slice';
import { RootState } from 'src/redux/store/root';
import { useParameter } from '../../hooks/useParameter';
import { usePhylogenTree } from '../../hooks/usePhylogenTree';

interface DirectoryTreeProps {
  directory: Directory;
  level?: number;
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ directory, level = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const [loadedChildren, setLoadedChildren] = useState<Directory[] | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  // Check if it's a folder: directories have children property (even if empty array), files don't
  const isFolder = directory.children !== undefined;
  const paddingLeft = `${level * 16 + (isFolder ? 0 : 20)}px`;
  const electron = useElectron();
  const { setParameter, setSource } = useParameter();
  const { setTreeFile } = usePhylogenTree();
  
  const loadDirectoryChildren = async () => {
    if (loading || loadedChildren) return;
    
    setLoading(true);
    try {
      const result = await electron.openSSHDirectory(directory.path);
      setLoadedChildren(result.children || []);
    } catch (error) {
      console.error('Failed to load SSH directory children:', error);
      setLoadedChildren([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClick = async () => {
    if (isFolder) {
      setExpanded(prev => {
        const newExpanded = !prev;
        // Load children when expanding for the first time
        if (newExpanded && !loadedChildren) {
          loadDirectoryChildren();
        }
        return newExpanded;
      });
      return;
    }

    const remotePath = directory.path;
    try {
      const contentFile = await electron.openContentFileSSH(remotePath);
      if (!contentFile || !contentFile.content) {
        console.error('Failed to open SSH file');
        return;
      }
      const fileName = directory.name;
      dispatch(
        Actions.setContentFile({
          path: remotePath,
          name: fileName,
          content: contentFile.content,
        })
      );
      setSource(remotePath);
      
      // If it's a .treefile, also set it as phylogenetic tree
      if (remotePath.toLowerCase().endsWith('.treefile')) {
        setTreeFile(remotePath);
      }
      
      console.log('Opened SSH file:', remotePath);
    } catch (err) {
      console.error('Unexpected error opening SSH file:', err);
    }
  };

  return (
    <div className="tree-node">
      <div className="node-label" onClick={handleClick} style={{ paddingLeft }}>
        <span className="icon">
          {isFolder ? (
            expanded ? (
              <i className="folder-icon open">📂</i>
            ) : (
              <i className="folder-icon">📁</i>
            )
          ) : (
            <i className="file-icon">📄</i>
          )}
        </span>
        <span className={isFolder ? 'folder-name' : 'file-name'}>
          {directory.name}
        </span>
      </div>
      {expanded && isFolder && (
        <div className="node-children">
          {loading ? (
            <div style={{ paddingLeft: `${(level + 1) * 16 + 20}px` }}>
              Đang tải...
            </div>
          ) : (
            (loadedChildren || directory.children || []).map(child => (
              <DirectoryTree
                key={child.path}
                directory={child}
                level={level + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DirectoryTree;
