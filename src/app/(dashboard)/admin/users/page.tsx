import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto w-full animate-fade-in">
        <UserManagement />
      </div>
    </DashboardLayout>
  );
}
