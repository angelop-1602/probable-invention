"use client";

import { useState } from "react";
import { Dashboard } from "./Dashboard";
import { mockProtocols } from "./mock-data";

export function MockDashboard() {
  const [loading, setLoading] = useState(true);

  // Simulate loading delay
  setTimeout(() => {
    setLoading(false);
  }, 1000);

  return <Dashboard protocols={mockProtocols} isLoading={loading} />;
} 