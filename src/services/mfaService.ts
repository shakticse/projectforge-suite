import api from '@/lib/api';

export interface MfaSetupResponse {
  qrCodeUri: string; // data URL or otpauth URL
  manualKey: string; // short-lived token to complete verification
}

export interface MfaVerifyResponse {
  success: boolean;
  // When verifying during login, server may return tokens/user
  accessToken?: string;
  refreshToken?: string;
  user?: any;
}

export const mfaService = {
  async setup(email?: string) : Promise<MfaSetupResponse> {
    const payload: any = { email };
    const res = await api.post('/api/mfa/setup', payload);
    return res.data;
  },

  async verify(email: string, code: string, options?: { setupToken?: string; loginToken?: string }) : Promise<MfaVerifyResponse> {
    const payload: any = {"email": email, "code": code };
    if (options?.setupToken) payload.setupToken = options.setupToken;
    if (options?.loginToken) payload.loginToken = options.loginToken;
    const res = await api.post('/api/mfa/verify', payload);
    return res.data;
  },

  async verifyCode(email: string, code: string, options?: { setupToken?: string; loginToken?: string }) {
    const payload: any = {"email": email, "code": code };
    if (options?.setupToken) payload.setupToken = options.setupToken;
    if (options?.loginToken) payload.loginToken = options.loginToken;
    const res = await api.post('/api/login/mfa', payload);
    return res.data;
  },

  async disable(email: string) : Promise<{ success: boolean }>{
    const payload: any = {"email": email};
    const res = await api.post('/api/mfa/disable', payload);
    return res.data;
  },

  async status(email: string) : Promise<{ mfaEnabled: boolean; mfaVerified?: boolean }> {
    const payload: any = {"email": email};
    const res = await api.post('/api/mfa/status', JSON.stringify(email));
    return res.data;
  }
};
