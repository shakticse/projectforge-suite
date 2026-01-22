export interface MfaSetupResponse {
  qrCode: string;
  setupToken: string;
}

export interface MfaVerifyResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
}

export interface MfaStatus {
  mfaEnabled: boolean;
  mfaVerified?: boolean;
}
