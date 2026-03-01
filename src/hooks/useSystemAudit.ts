import { db } from '../lib/db';
import { useSaaSAuth } from '../features/admin/SaaSAuthContext';

export const useSystemAudit = () => {
    const { admin } = useSaaSAuth();

    const logActivity = async (action: string, targetId?: string | number, details?: string) => {
        if (!admin || !admin.id) {
            console.warn('SystemAudit: Cannot log activity without active admin session.');
            return;
        }

        try {
            await db.system_audit_logs.add({
                admin_id: admin.id,
                action,
                target_id: targetId,
                details,
                created_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to write system audit log', error);
        }
    };

    return { logActivity };
};
