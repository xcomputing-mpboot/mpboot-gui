import { useEffect, useState } from "react";
import { useElectron } from "../../hooks/useElectron";
import { useDispatch, useSelector } from "react-redux";
import { SSHActions } from "../../redux/slice/ssh.slice";
import type { RootState } from "../../redux/store/root";
import type { DirectoryNode } from "../../../../common/ssh";
import "./DirTree.css";

export const DirTree = () => {
  const electron = useElectron();
  const dispatch = useDispatch();
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const sshState = useSelector((state: RootState) => state.ssh);

  const fetchDirectoryTree = async (path = currentPath) => {
    try {
      const result = await electron.getSSHDirectoryTree(path);
      setDirectoryTree(result.children || []);
      if(result.path[0]==='/'&& result.path[1]=='/'){ 
        path = result.path.slice(1);
      }
      setCurrentPath(path);
    } catch (error) {
      console.error("Error fetching SSH directory tree:", error);
    }
  };

  useEffect(() => {
    fetchDirectoryTree();
  }, []);

  // Xử lý khi mở thư mục con
  const handleOpenFolder = async (path: string) => {
    await fetchDirectoryTree(path);
  };

  // Xử lý khi nhấn nút "Back" để quay lại thư mục cha
  const handleGoBack = async () => {
    if (currentPath === "/") return; 
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    await fetchDirectoryTree(parentPath);
  };

  // Xử lý khi chọn thư mục làm project
  const handleSelectProject = async (path: string) => {
    try {
      const result = await electron.selectSSHProjectDirectory(path);
      if (result.success) {
        dispatch(SSHActions.setSSHDirectory(result.selectedPath || path));
        alert(`Selected project: ${result.selectedPath || path}`);
      }
    } catch (error) {
      console.error("Error selecting project:", error);
    }
  };

  return (
    <div className="ssh-container">
      <h2>SSH File Explorer</h2>
      <div className="path-bar">
        <button onClick={handleGoBack} disabled={currentPath === "/"}>
          ⬅️ Back
        </button>
        <span>{currentPath}</span>
      </div>
      <ul className="file-list">
        {directoryTree.map((node) => (
          <li key={node.path} className="file-item">
            <button className="folder-btn" onClick={() => handleOpenFolder(node.path)}>
              📁 {node.name}
            </button>
            <button className="select-btn" onClick={() => handleSelectProject(node.path)}>
              Select
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
