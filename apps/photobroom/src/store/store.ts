import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import { set, get, del, createStore } from 'idb-keyval';

import { baseApi } from '../api/base-api';
import { authSlice } from './authSlice';

// IndexedDB storage adapter for redux-persist
const idbStore = createStore('photobroom-persist', 'keyval');

const idbStorage = {
  getItem: (key: string) => get<string>(key, idbStore).then((v) => v ?? null),
  setItem: (key: string, value: string) => set(key, value, idbStore),
  removeItem: (key: string) => del(key, idbStore),
};

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSlice.reducer,
});

const persistConfig = {
  key: 'photobroom-root',
  storage: idbStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
