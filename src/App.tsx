import { useState } from 'react';
import { GmailSetup } from './components/GmailSetup';
import { RegistrationDashboard } from './components/RegistrationDashboard';

function App() {
  const [gmailConfig, setGmailConfig] = useState<{
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Luma Registration Automation</h1>
          <p className="text-gray-600">Automate event registrations with Gmail verification</p>
        </div>

        {!gmailConfig ? (
          <GmailSetup onConfigComplete={setGmailConfig} />
        ) : (
          <RegistrationDashboard gmailConfig={gmailConfig} />
        )}
      </div>
    </div>
  );
}

export default App;
