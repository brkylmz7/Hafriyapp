import * as Keychain from 'react-native-keychain';

const SERVICE = 'hafriyapp.auth';

/* 🔐 TOKEN KAYDET */
export const saveAuth = async ({
  token,
  phone,
  role,
}: {
  token: string;
  phone: string;
  role: string;
}) => {
  await Keychain.setGenericPassword(
    phone,
    JSON.stringify({ token, role }),
    {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    },
  );
};

/* 🔑 TOKEN OKU */
export const getAuth = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: SERVICE,
  });

  if (!credentials) return null;

  const { username: phone, password } = credentials;
  const parsed = JSON.parse(password);

  return {
    phone,
    token: parsed.token,
    role: parsed.role,
  };
};

/* 🚪 LOGOUT */
export const clearAuth = async () => {
  await Keychain.resetGenericPassword({ service: SERVICE });
};
