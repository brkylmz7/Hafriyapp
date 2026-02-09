import * as Keychain from 'react-native-keychain';

const SERVICE = 'hafriyapp.auth';

/* 🔐 TOKEN KAYDET */
/* 🔐 TOKEN KAYDET */
export const saveAuth = async ({
  token,
  phone,
  role,
  companyId,
}: {
  token: string;
  phone: string;
  role: string;
  companyId?: string;
}) => {
  await Keychain.setGenericPassword(
    phone,
    JSON.stringify({ token, role, companyId }),
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
    companyId: parsed.companyId,
  };
};

/* 🚪 LOGOUT */
export const clearAuth = async () => {
  await Keychain.resetGenericPassword({ service: SERVICE });
};
