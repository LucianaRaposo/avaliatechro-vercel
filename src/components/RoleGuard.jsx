import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function RoleGuard({ allowedRoles, redirectPath = "/professor" }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user?.role)) {
    // If user exists but role is not allowed, redirect
    if (user) return <Navigate to={redirectPath} replace />;
    // If user is null, wait (still loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return <Outlet />;
}