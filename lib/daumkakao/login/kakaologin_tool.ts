// https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#request-token-response-body
export type Kakaotokeninfo = {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number
  refresh_token_expires_in: number;
  id_token?: string;
  scope?: string;
}

// https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#req-user-info-response-body
export class Kakaouserinfo {
  id: number;
  connected_at: Date;
  properties?: {
    profile_image?: string;
  };
  kakao_account?: {
    name_needs_agreement: boolean;
    name: string;
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
    has_phone_number: boolean;
    phone_number_needs_agreement: boolean;
    phone_number: string;
  };
}

export class Kakaoauthdata {
  tokeninfo: Kakaotokeninfo;
  userinfo: Kakaouserinfo;
}