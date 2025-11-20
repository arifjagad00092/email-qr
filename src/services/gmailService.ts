export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

export class GmailService {
  private config: GmailConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  private async refreshAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = now + (data.expires_in * 1000) - 60000;

    return this.accessToken;
  }

  async getVerificationCode(email: string, maxAttempts: number = 10, delayMs: number = 5000): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const token = await this.refreshAccessToken();

        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:noreply@luma.co to:${email} subject:verification newer_than:5m`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
          const messageId = data.messages[0].id;
          const messageResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!messageResponse.ok) {
            throw new Error('Failed to fetch message details');
          }

          const messageData = await messageResponse.json();
          const code = this.extractVerificationCode(messageData);

          if (code) {
            return code;
          }
        }

        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error('Verification code not found after maximum attempts');
  }

  private extractVerificationCode(message: any): string | null {
    try {
      let body = '';

      if (message.payload.body.data) {
        body = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            body += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        }
      }

      const codeMatch = body.match(/\b(\d{6})\b/);
      return codeMatch ? codeMatch[1] : null;
    } catch (error) {
      console.error('Error extracting code:', error);
      return null;
    }
  }

  static generateAuthUrl(clientId: string, redirectUri: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }
}
