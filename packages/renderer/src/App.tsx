import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

// import { MainPage } from './pages/main';
// import { TreeViewPage } from './pages/tree-view';
import './App.css';
import { useWindowSize } from 'usehooks-ts';
import { useElectron } from './hooks/useElectron';
import { Toaster } from 'react-hot-toast';
import './style';
import { GlobalEvent } from './components/Global/GlobalEvent';
import { GlobalElectron } from './components/Global/GlobalElectron';
import { GlobalExecution } from './components/Global/GlobalExecution';
// import { DashboardPage } from './pages/dashboard';

const MainPage = lazy(() => import('./pages/main').then(module => ({ default: module.MainPage })));
const TreeViewPage = lazy(() =>
  import('./pages/tree-view').then(module => ({ default: module.TreeViewPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/dashboard').then(module => ({ default: module.DashboardPage })),
);
const NewWorkspacePage = lazy(() =>
  import('./pages/new-workspace').then(module => ({ default: module.NewWorkspacePage })),
);

const InstallationPage = lazy(() =>
  import('./pages/installation').then(module => ({ default: module.InstallationPage })),
);

const SSHConnectionPage = lazy(() =>
  import('./pages/sshConnection').then(module => ({ default: module.SSHConnectionPage })),
);

const DirViewPage = lazy(() =>
  import('./pages/dirView').then(module => ({ default: module.DirViewPage })),
);
function App() {
  const size = useWindowSize();
  const electron = useElectron();

  if (!electron || typeof electron.testAvailable !== 'function') {
    return (
      <div>
        <div>
          We are really sorry that MpbootGUI is not currently working as expected. Please contact us
          for more support.
        </div>
        <h1>electron is not available</h1>
      </div>
    );
  }

  return (
    <div style={{ width: size.width, height: size.height }}>
      <Suspense fallback={<div>Loading...</div>}>
        <Toaster
          position="bottom-right"
          reverseOrder={false}
        />
        <HashRouter>
          <GlobalElectron />
          <GlobalExecution />
          <GlobalEvent />
          <Routes>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />
            <Route
              path="/main"
              element={<MainPage />}
            />
            <Route
              path="/tree-view"
              element={<TreeViewPage />}
            />
            <Route
              path="/new-workspace"
              element={<NewWorkspacePage />}
            />
            <Route
              path="/installation"
              element={<InstallationPage />}
            />
            <Route
              path="*"
              element={<DashboardPage />}
            />
            <Route
              path="/ssh-connection"
              element={<SSHConnectionPage />}
            />
            <Route
              path="/dir-view"
              element={<DirViewPage />}
            />
          </Routes>
        </HashRouter>
      </Suspense>
    </div>
  );
}

export default App;
