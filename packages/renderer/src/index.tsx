import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { SingletonHooksContainer } from 'react-singleton-hook';
import type { ExposedElectron } from '../../common/electron';
import { unimplementedExposedElectron } from '../../common/electron';
import App from './App';
import { store } from './redux/store/root';
export const ElectronContext = React.createContext<ExposedElectron>(unimplementedExposedElectron);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ElectronContext.Provider value={window.electron}>
      <Provider store={store}>
        <SingletonHooksContainer />
        <App />
      </Provider>
    </ElectronContext.Provider>
  </React.StrictMode>,
);
