import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getAuth } from '../utils/secureStore';
import { loginSuccess, setRole, setPhone } from '../store/slices/authSlice';

export const useAuthBootstrap = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      const auth = await getAuth();

      if (auth) {
        dispatch(loginSuccess({ token: auth.token }));
        dispatch(setPhone(auth.phone));
        dispatch(setRole(auth.role as any));
      }
    };

    init();
  }, []);
};
