export interface LumaRegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  event_api_id?: string;
}

export interface LumaRegisterResponse {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  event_api_id: string;
  for_waitlist: boolean;
  payment_method: string | null;
  payment_currency: string | null;
  registration_answers: any[];
  coupon_code: string | null;
  timezone: string;
  token_gate_info: any;
  eth_address_info: any;
  phone_number: string;
  solana_address_info: any;
  expected_amount_cents: number;
  expected_amount_discount: number;
  expected_amount_tax: number;
  currency: string | null;
  event_invite_api_id: string | null;
  ticket_type_to_selection: Record<string, any>;
  solana_address: string | null;
  opened_from: string | null;
}

export interface SendCodeRequest {
  email: string;
}

export interface SignInRequest {
  email: string;
  code: string;
}

const LUMA_API_BASE = 'https://api2.luma.com';

export class LumaService {
  static async register(data: LumaRegisterRequest): Promise<LumaRegisterResponse> {
    const response = await fetch(`${LUMA_API_BASE}/event/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        event_api_id: data.event_api_id || 'evt-nTA5QQPkL5SrU9g',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Registration failed: ${error}`);
    }

    return response.json();
  }

  static async sendVerificationCode(email: string): Promise<void> {
    const response = await fetch(`${LUMA_API_BASE}/auth/email/send-sign-in-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send verification code: ${error}`);
    }
  }

  static async signInWithCode(email: string, code: string): Promise<any> {
    const response = await fetch(`${LUMA_API_BASE}/auth/email/sign-in-with-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sign in failed: ${error}`);
    }

    return response.json();
  }
}
