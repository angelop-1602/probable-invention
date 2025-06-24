"use client";

import { Dashboard } from "@/components/proponent/dashboard/Dashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useState, useEffect } from "react";
import { Protocol } from "@/lib/application";

export default function DashboardPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real data fetching from Firebase
    // For now, simulate loading and show empty state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ProtectedRoute>
      <Dashboard protocols={protocols} isLoading={isLoading} />
    </ProtectedRoute>
  );
} 