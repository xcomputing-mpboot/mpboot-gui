import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useElectron } from "../../hooks/useElectron";
import { useDispatch, useSelector } from "react-redux";
import { SSHActions } from "../../redux/slice/ssh.slice";
import type { RootState } from "../../redux/store/root";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faList, 
  faTh, 
  faArrowUp, 
  faFolder,
  faCheck
} from "@fortawesome/free-solid-svg-icons";
import "./DirTree.css"; // Import file CSS
import { Directory } from "../../../../common/directory-tree";
import { useBinarySetup } from '../../hooks/useBinarySetup';

export const DirTree = () => {
  const electron = useElectron();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [directoryTree, setDirectoryTree] = useState<Directory[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const selectedPath = useSelector((state: RootState) => state.ssh.selectedPath);
  const sshState = useSelector((state: RootState) => state.ssh);
  const { isInstalling, error: installError } = useBinarySetup();

  console.log("SSH State:", sshState);

  const fetchDirectoryTree = async (path = currentPath) => {
    setIsLoading(true);
    try {
      const result = await electron.getSSHDirectoryTree(path);
      setDirectoryTree(result.children || []);
      setCurrentPath(result.path.replace(/^\/\//, "/"));
    } catch (error) {
      console.error("Error fetching SSH directory tree:", error);
    } finally {
      setIsLoading(false);
    }
  };

  

  useEffect(() => {
    fetchDirectoryTree();
  }, []);

  const handleOpenFolder = async (path: string) => {
    await fetchDirectoryTree(path);
  };

  const handleGoBack = async () => {
    if (currentPath === "/") return;
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    await fetchDirectoryTree(parentPath);
  };

  const handleSelectProject = async () => {
    try {
      const result = await electron.selectSSHProjectDirectory(currentPath);
      if (result.success) {
        dispatch(SSHActions.setSSHDirectory(currentPath));
        console.log("Project selected:", currentPath);
        navigate(`/new-workspace?mode=ssh`);
      }
    } catch (error) {
      console.error("Error selecting project:", error);
    }
  };

  return (
    <div className="dir-tree-container">
      {isInstalling && (
        <div className="installation-status">
          Installing MPBoot binary...
        </div>
      )}
      {installError && (
        <div className="error-message">
          Failed to install binary: {installError}
        </div>
      )}
      <h2 className="dir-tree-title">
        <FontAwesomeIcon icon={faFolder} className="title-icon" />
        SSH File Explorer
      </h2>
      
      <div className="dir-tree-controls">
        <button 
          onClick={handleGoBack} 
          disabled={currentPath === "/"}
          className="control-button back-button"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </button>
        
        <span className="current-path">
          {currentPath}
        </span>
        
        <button 
          className="control-button view-toggle-button"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        >
          {viewMode === "grid" ? (
            <>
              <FontAwesomeIcon icon={faList} />
              List View
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faTh} />
              Grid View
            </>
          )}
        </button>
        
        <button 
          className="control-button select-button"
          onClick={handleSelectProject}
        >
          <FontAwesomeIcon icon={faCheck} />
          Select Project Folder
        </button>
      </div>

      {isLoading ? (
        <div className="loading-indicator">
          Loading...
        </div>
      ) : directoryTree.length === 0 ? (
        <div className="empty-folder-message">
          No folders found
        </div>
      ) : (
        <ul className={`folder-list ${viewMode}`}>
          {directoryTree.map((node) => (
            <li 
              key={node.path} 
              className={`folder-item ${viewMode}`}
            >
              <button 
                className="folder-button"
                onClick={() => handleOpenFolder(node.path)}
              >
                <FontAwesomeIcon icon={faFolder} className="folder-icon" />
                <span className="folder-name">{node.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};