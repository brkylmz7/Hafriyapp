interface SendOtpResponse {
  success: boolean;
}

interface VerifyOtpResponse {
  success: boolean;
  token?: string; // optional çünkü yanlış OTP'de yok
}


export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  console.log("OTP gönderiliyor:", phone);

  return { success: true };
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  console.log("OTP doğrulanıyor:", phone, otp);

  if (otp === "1234") {
    return { success: true, token: "fake-token-123" };
  } 

  return { success: false };
}
