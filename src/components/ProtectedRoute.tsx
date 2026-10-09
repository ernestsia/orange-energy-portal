import React, { useEffect, useState } from 'react';
import { getCurrentUserProfile, UserRole } from '../Lib/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const profile = await getCurrentUserProfile();
      setUserRole(profile ? profile.role : null);
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // If the user's role isn't allowed, render an Access Denied view
  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">Access Restricted</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
          Your account role (<span className="font-bold text-slate-700">{userRole || 'Guest'}</span>) does not have permission to access this module.
        </p>
        <span className="inline-block text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          Contact IT Admin for Access
        </span>
      </div>
    );
  }

  return <>{children}</>;
};