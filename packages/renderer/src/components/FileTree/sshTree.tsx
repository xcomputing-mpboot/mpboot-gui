import React, { useState } from 'react';
import './sshTree.css';
import { useDispatch } from 'react-redux';
import { Actions as ContentFileActions } from '../../redux/slice/content-file.slice';
import type { Directory } from '../../../../common/directory-tree';

interface DirectoryTreeProps {
  directory: Directory;
  level?: number;
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ directory, level = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();

  const isFolder = directory.children && directory.children.length > 0;
  const paddingLeft = `${level * 16 + (isFolder ? 0 : 20)}px`;

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    } else {
      // Dispatch file selection to Redux
      dispatch(
        ContentFileActions.openFile({
          path: "C:\Users\Admin\Downloads\mpboot_test_files\full.phy",
          name: directory.name,
        })
      );
      console.log('File clicked:',);
      
    }
  };

  return (
    <div className="tree-node">
      <div
        className="node-label"
        onClick={handleClick}
        style={{ paddingLeft }}
      >
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
          {directory.children?.map(child => (
            <DirectoryTree
              key={child.path}
              directory={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectoryTree;
