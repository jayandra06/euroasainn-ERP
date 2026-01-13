import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LicenseForm } from './LicenseForm';
import { useToast } from '../../components/shared/Toast';
import { apiFetch } from '../../utils/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function CreateLicensePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type');
    // Fetch organizations
    const { data: orgsData } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const response = await apiFetch('/api/v1/admin/organizations');
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['licenses'] });
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        showToast('License created successfully with pricing!', 'success');
        navigate('/licenses');
    };
    const handleCancel = () => {
        navigate('/onboarding-data');
    };
    if (!organizationId) {
        return (<div className="w-full min-h-screen p-8">
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Invalid Request</h2>
          <p className="text-red-600 dark:text-red-300">Organization ID is required to create a license.</p>
          <button onClick={() => navigate('/onboarding-data')} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            Back to Onboarding
          </button>
        </div>
      </div>);
    }
    return (<div className="w-full min-h-screen p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Create License
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
          Create license with pricing for the approved organization
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <LicenseForm organizations={orgsData || []} organizationId={organizationId} onSuccess={handleSuccess} onCancel={handleCancel}/>
      </div>
    </div>);
}
//# sourceMappingURL=CreateLicensePage.js.map