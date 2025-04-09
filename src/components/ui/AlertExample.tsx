"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/components/shared/Alerts";

export default function AlertExample() {
  const { showAlert } = useAlerts();

  const handleShowDefaultAlert = () => {
    showAlert({
      title: "Information",
      message: "This is a default alert that will disappear in 5 seconds.",
      duration: 5000, // 5 seconds
    });
  };

  const handleShowSuccessAlert = () => {
    showAlert({
      title: "Success",
      message: "Operation completed successfully!",
      variant: "success",
      duration: 5000,
    });
  };

  const handleShowWarningAlert = () => {
    showAlert({
      title: "Warning",
      message: "This action may have consequences.",
      variant: "warning",
      duration: 5000,
    });
  };

  const handleShowErrorAlert = () => {
    showAlert({
      title: "Error",
      message: "Something went wrong. Please try again.",
      variant: "destructive",
      duration: 5000,
    });
  };

  const handleShowInfoAlert = () => {
    showAlert({
      title: "Info",
      message: "This is an informational message.",
      variant: "info",
      duration: 5000,
    });
  };

  const handleShowPersistentAlert = () => {
    showAlert({
      title: "Persistent Alert",
      message: "This alert will not auto-dismiss. You must close it manually.",
      variant: "info",
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Alert Examples</h2>
      <div className="flex flex-wrap gap-4">
        <Button onClick={handleShowDefaultAlert}>Default Alert</Button>
        <Button onClick={handleShowSuccessAlert} className="bg-green-600 hover:bg-green-700">Success Alert</Button>
        <Button onClick={handleShowWarningAlert} className="bg-yellow-600 hover:bg-yellow-700">Warning Alert</Button>
        <Button onClick={handleShowErrorAlert} className="bg-red-600 hover:bg-red-700">Error Alert</Button>
        <Button onClick={handleShowInfoAlert} className="bg-blue-600 hover:bg-blue-700">Info Alert</Button>
        <Button onClick={handleShowPersistentAlert} variant="outline">Persistent Alert</Button>
      </div>
    </div>
  );
} 