import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api.js';
import { disconnectSocket } from '../lib/socket.js';

const USER_KEY = 'sudha_setu_user';

const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const storeUser = (u) => {
  if (typeof window === 'undefined') return;
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {}
};

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data.user;
    } catch {
      return rejectWithValue(null);
    }
  },
  {
    condition: (_, { getState }) => {
      const { auth } = getState();
      return !auth.loading;
    },
  }
);

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? 'Login failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    disconnectSocket();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(),
    loading: false,
    initialized: false,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      storeUser(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.initialized = true;
        storeUser(action.payload);
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.loading = false;
        state.initialized = true;
        storeUser(null);
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        storeUser(action.payload);
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.initialized = true;
        storeUser(null);
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.initialized = true;
        storeUser(null);
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
