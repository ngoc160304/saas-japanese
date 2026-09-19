import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    // Thunk arguments contain passwords; actions/state contain access tokens.
    devTools: false,
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
