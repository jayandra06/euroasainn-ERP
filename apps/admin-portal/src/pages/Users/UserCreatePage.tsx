import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdPersonAddAlt } from 'react-icons/md';
import { useToast } from '../../components/shared/Toast';
import { UserForm } from './UserForm';

export function UserCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('User invited successfully!', 'success');
    navigate('/users');
  };

  const handleCancel = () => {
    navigate('/users');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to users"
          >
            <MdArrowBack className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Invite Admin User</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Create an account for a teammate. An invitation email with temporary credentials will be sent automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <UserForm user={null} onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        </div>
        <div className="xl:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <MdPersonAddAlt className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold">Why invite a teammate?</h2>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Share onboarding and licensing tasks with trusted colleagues.</li>
              <li>• Delegate support tickets and report management.</li>
              <li>• Keep audit logs up to date with individual accounts.</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm text-sm text-gray-600 dark:text-gray-300">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Tips</h3>
            <ul className="space-y-2">
              <li>• Use work email addresses to ensure the invite reaches their inbox.</li>
              <li>• Assign the Super Admin role only when full system access is required.</li>
              <li>• You can edit or deactivate users at any time from the Users list.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserCreatePage;








