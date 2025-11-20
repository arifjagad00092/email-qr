import { useState, useEffect } from 'react';
import { Upload, Play, Trash2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Registration } from '../lib/supabase';
import { RegistrationService, EmailEntry } from '../services/registrationService';
import { GmailService } from '../services/gmailService';

interface RegistrationDashboardProps {
  gmailConfig: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
  };
}

export function RegistrationDashboard({ gmailConfig }: RegistrationDashboardProps) {
  const [emailEntries, setEmailEntries] = useState<EmailEntry[]>([]);
  const [eventApiId, setEventApiId] = useState('evt-nTA5QQPkL5SrU9g');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<Record<string, string>>({});
  const [registrationService, setRegistrationService] = useState<RegistrationService | null>(null);

  useEffect(() => {
    const gmailService = new GmailService(gmailConfig);
    const service = new RegistrationService(gmailService);
    setRegistrationService(service);
    loadRegistrations(service);
  }, [gmailConfig]);

  const loadRegistrations = async (service: RegistrationService) => {
    try {
      const data = await service.getRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Failed to load registrations:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const entries = JSON.parse(content) as EmailEntry[];
        setEmailEntries(entries);
      } catch (error) {
        alert('Failed to parse JSON file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleStartProcessing = async () => {
    if (!registrationService || emailEntries.length === 0) return;

    setIsProcessing(true);
    setCurrentProgress({});

    await registrationService.processBulkRegistrations(
      emailEntries,
      eventApiId,
      (email, status) => {
        setCurrentProgress((prev) => ({ ...prev, [email]: status }));
      }
    );

    await loadRegistrations(registrationService);
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    if (!registrationService) return;

    try {
      await registrationService.deleteRegistration(id);
      await loadRegistrations(registrationService);
    } catch (error) {
      alert('Failed to delete registration');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      case 'code_sent':
      case 'signed_in':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'code_sent':
      case 'signed_in':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Luma Event Registration Automation</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event API ID</label>
            <input
              type="text"
              value={eventApiId}
              onChange={(e) => setEventApiId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="evt-nTA5QQPkL5SrU9g"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Email List (JSON)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                <Upload className="w-5 h-5" />
                Choose File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {emailEntries.length > 0 && (
                <span className="text-sm text-gray-600">
                  {emailEntries.length} email{emailEntries.length !== 1 ? 's' : ''} loaded
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Format: [{"{"}"email": "user@example.com", "firstName": "John", "lastName": "Doe"{"}"}]
            </p>
          </div>

          <button
            onClick={handleStartProcessing}
            disabled={isProcessing || emailEntries.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            {isProcessing ? 'Processing...' : 'Start Registration Process'}
          </button>
        </div>

        {Object.keys(currentProgress).length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Current Progress</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(currentProgress).map(([email, status]) => (
                <div key={email} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{email}</span>
                  <span className="text-gray-600">{status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Registration History</h3>
          <button
            onClick={() => registrationService && loadRegistrations(registrationService)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Event ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(reg.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(reg.status)}`}>
                        {reg.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{reg.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {reg.first_name} {reg.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{reg.event_api_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(reg.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {registrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No registrations yet. Upload an email list and start processing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
