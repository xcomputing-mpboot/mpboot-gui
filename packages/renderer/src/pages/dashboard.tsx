import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IWorkspace } from '../../../common/workspace';
import { MButton } from '../components/common/Button';
import { useElectron } from '../hooks/useElectron';
import { useWorkspace } from '../hooks/useWorkspace';
import { Layout } from '../components/Layout/Layout';
import classNames from 'classnames/bind';
import styles from './dashboard.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ItemWorkspace } from '../components/ItemWorkspace/ItemWorkspace';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'src/redux/store/root';
import { Actions } from '../redux/slice/item_menu.slice';

const cx = classNames.bind(styles);

export const DashboardPage = () => {
  const electron = useElectron();
  const { setWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [searchState, setStateSearch] = useState({
    inputSearch: '',
    filterWorkspaces: [] as IWorkspace[],
  });
  const dispatch = useDispatch();
  const stateSideBar = useSelector((state: RootState) => state.sidebarState);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchInput = event.target.value;
    const filterItems: IWorkspace[] = [];
    workspaces.map(item => {
      item.name.toLowerCase().includes(searchInput.replace(/\s+/g, '').toLowerCase()) &&
        filterItems.push(item);
    });
    setStateSearch({
      inputSearch: searchInput,
      filterWorkspaces: filterItems,
    });
  };

  const handleRemoveWorkspace = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    event.preventDefault();
    const nextState = searchState.filterWorkspaces.filter(item => item.id !== id);
    setStateSearch({
      inputSearch: searchState.inputSearch,
      filterWorkspaces: nextState,
    });
  };

  const handleClickOpenWorkspace = async (
    event: React.MouseEvent<HTMLButtonElement>,
    workspace: IWorkspace,
  ) => {
    event.preventDefault();

    if (workspace.isSSH && workspace.sshConnectionInfo) {
      try {
        const result = await electron.connectSSH(workspace.sshConnectionInfo);
        if (!result.success) {
          throw new Error(result.error || 'Failed to connect to SSH workspace');
        }
      } catch (error: any) {
        console.error('SSH Connection Error:', error.message);
        alert(`SSH Connection failed: ${error.message}`);
        return;
      }
    }

    setWorkspace(workspace);
    dispatch(
      Actions.setItemMenu({
        itemMenuSideBar: 0,
        openSideBar: false,
      }),
    );
    navigate('/main');
  };

  useEffect(() => {
    electron.listWorkspaces().then(workspaces => {
      setWorkspaces(workspaces);
      setStateSearch({
        inputSearch: '',
        filterWorkspaces: workspaces,
      });
    });
  }, []);

  const onCreateWorkspaceButtonClick = useCallback((_e: any) => {
    dispatch(
      Actions.setItemMenu({
        itemMenuSideBar: 2,
        openSideBar: stateSideBar.openSideBar,
      }),
    );
    navigate('/new-workspace');
  }, []);

  return (
    <Layout>
      <div className={cx('dashboard-content')}>
        <div className={cx('dashboard-search')}>
          <div className={cx('dashboard-search__form')}>
            <FontAwesomeIcon
              className={cx('search-icon')}
              icon={faMagnifyingGlass}
            />
            <input
              className={cx('search-input')}
              type="text"
              name="search"
              value={searchState.inputSearch}
              placeholder="Search"
              onChange={handleInputChange}
            />
          </div>
          <MButton onClick={e => onCreateWorkspaceButtonClick(e)}>Create</MButton>
        </div>
        <div className={cx('workspace-header')}>
          <span>ID</span>
          <span>Project Name</span>
          <span>Last Modified</span>
        </div>
        <div className={cx('workspace-content')}>
          {searchState.filterWorkspaces.map(workspace => {
            return (
              <div key={workspace.id}>
                <ItemWorkspace
                  workspace={workspace}
                  onClick={handleClickOpenWorkspace}
                  onListenRemoveWorkspace={handleRemoveWorkspace}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};
