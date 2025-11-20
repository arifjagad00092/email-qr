import { useState } from 'react';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface GmailSetupProps {
  onConfigComplete: (config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
  }) => void;
}

export function GmailSetup({ onConfigComplete }: GmailSetupProps) {
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('http://localhost:5173/oauth/callback');
  const [authCode, setAuthCode] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [error, setError] = useState('');

  const handleGenerateAuthUrl = () => {
    if (!clientId || !redirectUri) {
      setError('Please enter Client ID and Redirect URI');
      return;
    }

    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.open(authUrl, '_blank');
    setStep(2);
  };

  const handleExchangeCode = async () => {
    if (!authCode) {
      setError('Please enter authorization code');
      return;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: authCode,
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
      setRefreshToken(data.refresh_token);
      setStep(3);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to exchange code');
    }
  };

  const handleComplete = () => {
    onConfigComplete({
      clientId,
      clientSecret,
      redirectUri,
      refreshToken,
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Gmail API Setup</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className={`p-4 rounded-lg border-2 ${step >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <h3 className="font-semibold text-lg">Configure OAuth Credentials</h3>
          </div>
          <div className="ml-10 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Google OAuth Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Google OAuth Client Secret"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
              <input
                type="text"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="http://localhost:5173/oauth/callback"
              />
            </div>
            <button
              onClick={handleGenerateAuthUrl}
              disabled={step > 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Generate Authorization URL
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${step >= 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <h3 className="font-semibold text-lg">Get Authorization Code</h3>
          </div>
          <div className="ml-10 space-y-3">
            <p className="text-sm text-gray-600">
              After authorizing, copy the authorization code from the URL and paste it below.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Authorization Code</label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                disabled={step < 2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Paste authorization code here"
              />
            </div>
            <button
              onClick={handleExchangeCode}
              disabled={step < 2 || step > 2}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Exchange for Refresh Token
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${step >= 3 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {step >= 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
            </div>
            <h3 className="font-semibold text-lg">Complete Setup</h3>
          </div>
          {step >= 3 && (
            <div className="ml-10 space-y-3">
              <div className="p-3 bg-white rounded border border-green-200">
                <p className="text-sm font-medium text-gray-700 mb-1">Refresh Token:</p>
                <code className="text-xs text-gray-600 break-all">{refreshToken}</code>
              </div>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
