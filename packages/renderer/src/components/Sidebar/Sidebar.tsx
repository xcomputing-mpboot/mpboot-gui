import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Sidebar.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faHouse,
  faPenToSquare,
  faCircleExclamation,
  faRightFromBracket,
  faTerminal,
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'src/redux/store/root';
import { Actions } from '../../redux/slice/item_menu.slice';

const cx = classNames.bind(styles);

export const Sidebar = () => {
  const navigate = useNavigate();
  const stateSideBar = useSelector((state: RootState) => state.sidebarState);
  const dispatch = useDispatch();

  const handleClickOpenSideBar = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatch(
      Actions.setOpenSidebar({
        itemMenuSideBar: stateSideBar.itemMenuSideBar,
        openSideBar: !stateSideBar.openSideBar,
      }),
    );
  };

  if (stateSideBar.openSideBar) {
    return (
      <div className={cx('sidebar__section')}>
        <div className={cx('sidebar__section-header')}>
          <button
            className={cx('sidebar__section-header-button')}
            onClick={handleClickOpenSideBar}
          >
            <FontAwesomeIcon
              className={cx('sidebar__section-header-icon')}
              icon={faBars}
            />
          </button>
        </div>
        <div className={cx('sidebar__section-container')}>
          <div
            className={cx(
              'sidebar__section-menu-' +
                (stateSideBar.itemMenuSideBar === 1 ? 'active' : 'inactive'),
            )}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 1,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/dashboard');
            }}
          >
            <FontAwesomeIcon className={cx('icon-size')} icon={faHouse} />
            <span>Dashboard</span>
            <div></div>
          </div>
          <div
            className={cx(
              'sidebar__section-menu-' +
                (stateSideBar.itemMenuSideBar === 2 ? 'active' : 'inactive'),
            )}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 2,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/new-workspace');
            }}
          >
            <FontAwesomeIcon className={cx('icon-size')} icon={faPenToSquare} />
            <span>Create Workspace</span>
            <div></div>
          </div>

          <div
            className={cx(
              'sidebar__section-menu-' +
                (stateSideBar.itemMenuSideBar === 3 ? 'active' : 'inactive'),
            )}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 3,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/installation');
            }}
          >
            <FontAwesomeIcon className={cx('icon-size')} icon={faCircleExclamation} />
            <span>About</span>
            <div></div>
          </div>

          <div
            className={cx(
              'sidebar__section-menu-' +
                (stateSideBar.itemMenuSideBar === 4 ? 'active' : 'inactive'),
            )}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 4,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/ssh-connection'); // Đảm bảo route này tồn tại
            }}
          >
            <FontAwesomeIcon className={cx('icon-size')} icon={faTerminal} />
            <span>SSH Connection</span>
            <div></div>
          </div>
        </div>

        <div className={cx('sidebar__section-quit')}>
          <button className={cx('sidebar__section-quit-button')}>
            <div className={cx('button-quit-content')}>
              <FontAwesomeIcon className={cx('icon-size')} icon={faRightFromBracket} />
              <span>Quit</span>
              <div></div>
            </div>
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className={cx('sidebar-close')}>
        <div className={cx('sidebar-close__menu-item')}>
          <button
            onClick={handleClickOpenSideBar}
            className={cx('sidebar-close__menu-button')}
          >
            <FontAwesomeIcon className={cx('icon-active')} icon={faBars} />
          </button>
          <button
            className={cx('sidebar-close__menu-button')}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 1,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/dashboard');
            }}
          >
            <FontAwesomeIcon
              className={cx('icon-' + (stateSideBar.itemMenuSideBar === 1 ? 'active' : 'inactive'))}
              icon={faHouse}
            />
          </button>

          <button
            className={cx('sidebar-close__menu-button')}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 2,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/new-workspace');
            }}
          >
            <FontAwesomeIcon
              className={cx('icon-' + (stateSideBar.itemMenuSideBar === 2 ? 'active' : 'inactive'))}
              icon={faPenToSquare}
            />
          </button>

          <button
            className={cx('sidebar-close__menu-button')}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 3,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/installation');
            }}
          >
            <FontAwesomeIcon
              className={cx('icon-' + (stateSideBar.itemMenuSideBar === 3 ? 'active' : 'inactive'))}
              icon={faCircleExclamation}
            />
          </button>

          <button
            className={cx('sidebar-close__menu-button')}
            onClick={_e => {
              dispatch(
                Actions.setItemMenu({
                  itemMenuSideBar: 4,
                  openSideBar: stateSideBar.openSideBar,
                }),
              );
              navigate('/ssh-connection');
            }}
          >
            <FontAwesomeIcon
              className={cx('icon-' + (stateSideBar.itemMenuSideBar === 4 ? 'active' : 'inactive'))}
              icon={faTerminal}
            />
          </button>

          <button className={cx('sidebar-close__menu-quit')}>
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </div>
    );
  }
};