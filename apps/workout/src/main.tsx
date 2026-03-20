import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { MantineProvider } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';

import { store, persistor } from './store/store';
import { theme } from './design-system';
import { App } from './App';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <App />
          </MantineProvider>
        </GoogleOAuthProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
