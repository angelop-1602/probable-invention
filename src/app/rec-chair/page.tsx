'use client';

import { useAuthContext } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/rec-chair/Dashboard';

export default function RecChairDashboard() {
  const { user, signOut } = useAuthContext();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">REC Chair Dashboard</h1>
        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </div>

      <Dashboard />
    </div>
  );
}
  