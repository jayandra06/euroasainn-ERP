import { useQuery, useMutation } from '@tanstack/react-query';
import { Modal } from '../../components/shared/Modal';
import { apiFetch } from '../../utils/api';
import { useToast } from '../../components/shared/Toast';
import { MdRefresh, MdCancel } from 'react-icons/md';
function formatDate(date) {
    if (!date)
        return '—';
    return new Date(date).toLocaleString();
}
const statusStyles = {
    pending: 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/30',
    used: 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/30',
    revoked: 'bg-amber-100 text-[hsl(var(--foreground))] font-semibold dark:bg-amber-900/30',
    expired: 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/30',
};
export function OrganizationInvitationsModal({ organization, isOpen, onClose, apiBasePath }) {
    const { showToast } = useToast();
    const organizationId = organization?._id;
    const invitationsQuery = useQuery({
        queryKey: ['organization-invitations', apiBasePath, organizationId],
        enabled: isOpen && !!organizationId,
        queryFn: async () => {
            const response = await apiFetch(`${apiBasePath}/organizations/${organizationId}/invitations?includeAll=true`);
            if (!response.ok) {
                const error = await response.json().catch(() => null);
                throw new Error(error?.error || 'Failed to load invitations');
            }
            const data = await response.json();
            return data.data;
        },
    });
    const resendInvitation = useMutation({
        mutationFn: async (invitationId) => {
            const response = await apiFetch(`${apiBasePath}/organizations/${organizationId}/invitations/${invitationId}/resend`, {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json().catch(() => null);
                throw new Error(error?.error || 'Failed to resend invitation');
            }
            const data = await response.json();
            return data.data;
        },
        onSuccess: (result) => {
            invitationsQuery.refetch();
            const tempPassword = result.temporaryPassword ? ` Temporary password: ${result.temporaryPassword}` : '';
            showToast(`Invitation resent successfully.${tempPassword}`, 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to resend invitation', 'error');
        },
    });
    const revokeInvitation = useMutation({
        mutationFn: async (invitationId) => {
            const response = await apiFetch(`${apiBasePath}/organizations/${organizationId}/invitations/${invitationId}/revoke`, {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json().catch(() => null);
                throw new Error(error?.error || 'Failed to revoke invitation');
            }
            const data = await response.json();
            return data.data;
        },
        onSuccess: () => {
            invitationsQuery.refetch();
            showToast('Invitation revoked successfully.', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to revoke invitation', 'error');
        },
    });
    const handleResend = (invitationId) => {
        resendInvitation.mutate(invitationId);
    };
    const handleRevoke = (invitationId) => {
        revokeInvitation.mutate(invitationId);
    };
    const invitations = invitationsQuery.data || [];
    const isLoading = invitationsQuery.isLoading || invitationsQuery.isRefetching;
    return (<Modal isOpen={isOpen} onClose={onClose} title={`Invitations · ${organization?.name || ''}`} size="large">
      {isLoading ? (<div className="py-12 text-center text-[hsl(var(--muted-foreground))]">Loading invitations...</div>) : invitations.length === 0 ? (<div className="py-12 text-center text-[hsl(var(--muted-foreground))]">No invitations found.</div>) : (<div className="space-y-4">
          <div className="overflow-x-auto border border-[hsl(var(--border))] rounded-xl">
            <table className="w-full">
              <thead className="bg-[hsl(var(--secondary))]">
                <tr className="text-left text-xs text-[hsl(var(--foreground))] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Resends</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {invitations.map((invitation) => (<tr key={invitation._id} className="text-sm text-gray-900 dark:text-gray-100">
                    <td className="px-4 py-3">{invitation.email}</td>
                    <td className="px-4 py-3 capitalize">{invitation.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[invitation.status]}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(invitation.createdAt)}</td>
                    <td className="px-4 py-3">{formatDate(invitation.expiresAt)}</td>
                    <td className="px-4 py-3">{invitation.resendCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleResend(invitation._id)} disabled={invitation.status !== 'pending' || resendInvitation.isPending || revokeInvitation.isPending} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-[hsl(var(--foreground))] font-semibold hover:bg-blue-100 dark:hover:bg-blue-950/40 disabled:cursor-not-allowed disabled:opacity-60">
                          <MdRefresh className="w-4 h-4"/>
                          Resend
                        </button>
                        <button onClick={() => handleRevoke(invitation._id)} disabled={invitation.status !== 'pending' || resendInvitation.isPending || revokeInvitation.isPending} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-[hsl(var(--foreground))] font-semibold hover:bg-red-100 dark:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60">
                          <MdCancel className="w-4 h-4"/>
                          Revoke
                        </button>
                      </div>
                      {invitation.status === 'revoked' && invitation.revokedAt && (<div className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">Revoked {formatDate(invitation.revokedAt)}</div>)}
                      {invitation.status === 'used' && invitation.usedAt && (<div className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">Used {formatDate(invitation.usedAt)}</div>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Resending an invitation will generate a new onboarding link and temporary password. The previous invitation will be revoked automatically.
          </p>
        </div>)}
    </Modal>);
}
//# sourceMappingURL=OrganizationInvitationsModal.js.map