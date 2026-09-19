import { createAsyncThunk, createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/apis/auth/auth.api';
import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from '@/apis/auth/auth.type';
import { getApiError, type ApiError } from '@/lib/api-error';
import { refreshAccessToken, waitForSessionRefresh } from '@/lib/authorize-axios';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status:
    | 'idle'
    | 'bootstrapping'
    | 'refreshing'
    | 'logging-in'
    | 'registering'
    | 'logging-out'
    | 'logout-error'
    | 'error';
  initialized: boolean;
  revision: number;
  requestId: string | null;
  error: ApiError | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
  initialized: false,
  revision: 0,
  requestId: null,
  error: null,
};
type AuthRoot = { auth: AuthState };
type ThunkConfig = { state: AuthRoot; rejectValue: ApiError };
const canSubmit = ({ auth }: AuthRoot) =>
  auth.initialized && ['idle', 'error'].includes(auth.status);

export const login = createAsyncThunk<AuthSession, LoginRequest, ThunkConfig>(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      await waitForSessionRefresh();
      return await authAPI.login(data);
    } catch (error) {
      return rejectWithValue(getApiError(error));
    }
  },
  { condition: (_, { getState }) => canSubmit(getState()) },
);

export const register = createAsyncThunk<RegisterResponse, RegisterRequest, ThunkConfig>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      return await authAPI.register(data);
    } catch (error) {
      return rejectWithValue(getApiError(error));
    }
  },
  { condition: (_, { getState }) => canSubmit(getState()) },
);

// Used for initial bootstrap and explicit retry; the interceptor shares its promise.
export const refreshSession = createAsyncThunk<AuthSession, void, ThunkConfig>(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      return await refreshAccessToken();
    } catch (error) {
      return rejectWithValue(getApiError(error));
    }
  },
  { condition: (_, { getState }) => ['idle', 'error'].includes(getState().auth.status) },
);

export const logout = createAsyncThunk<void, void, ThunkConfig>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await waitForSessionRefresh();
      await authAPI.logout();
    } catch (error) {
      return rejectWithValue(getApiError(error));
    }
  },
  {
    condition: (_, { getState }) =>
      !['logging-in', 'registering', 'logging-out'].includes(getState().auth.status),
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionReceived(state, action: PayloadAction<AuthSession>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.access_token;
      state.initialized = true;
      state.error = null;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
      state.revision += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state, action) => {
        state.status = 'logging-in';
        state.requestId = action.meta.requestId;
        state.error = null;
        state.revision += 1;
      })
      .addCase(login.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.initialized = true;
        state.status = 'idle';
        state.requestId = null;
      })
      .addCase(register.pending, (state, action) => {
        state.status = 'registering';
        state.requestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.status = 'idle';
        state.requestId = null;
      })
      .addCase(refreshSession.pending, (state, action) => {
        state.status = state.initialized ? 'refreshing' : 'bootstrapping';
        state.requestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'idle';
        state.requestId = null;
      })
      .addCase(logout.pending, (state, action) => {
        state.status = 'logging-out';
        state.requestId = action.meta.requestId;
        state.user = null;
        state.accessToken = null;
        state.revision += 1;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.requestId = null;
        state.initialized = true;
      })
      .addMatcher(
        isAnyOf(login.rejected, register.rejected, refreshSession.rejected, logout.rejected),
        (state, action) => {
          if (state.requestId !== action.meta.requestId) return;
          state.initialized = true;
          state.requestId = null;
          const anonymous =
            action.type === refreshSession.rejected.type && action.payload?.status === 401;
          state.status = anonymous
            ? 'idle'
            : action.type === logout.rejected.type
              ? 'logout-error'
              : 'error';
          state.error = anonymous ? null : (action.payload ?? getApiError(action.error));
        },
      );
  },
});

export const { sessionReceived, clearAuth } = authSlice.actions;
export const selectCurrentUser = (state: AuthRoot) => state.auth.user;
export const selectIsAuthenticated = (state: AuthRoot) =>
  Boolean(state.auth.user && state.auth.accessToken);
export const selectAuthInitialized = (state: AuthRoot) => state.auth.initialized;
export default authSlice.reducer;
