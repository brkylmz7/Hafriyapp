import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  role: 'driver' | 'supplier' | null;
  phone: string;
  token: string | null;
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  role: null,
  phone: '',
  token: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<AuthState['role']>) {
      state.role = action.payload;
    },
    setPhone(state, action: PayloadAction<string>) {
      state.phone = action.payload;
    },
    loginSuccess(state, action: PayloadAction<{ token: string }>) {
      state.token = action.payload.token;
      state.isLoggedIn = true;
    },
    logout(state) {
      state.token = null;
      state.isLoggedIn = false;
      state.phone = '';
      state.role = null;
    },
  }
});

export const { setRole, setPhone, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
