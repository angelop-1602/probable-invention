"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/components/shared/Alerts";

export default function AlertExample() {
  const { showAlert } = useAlerts();

  const handleShowDefaultAlert = () => {
    showAlert({
      title: "Information",
      message: "This is a default alert with automatic progress indicator.",
      // Duration is calculated automatically based on message length
    });
  };

  const handleShowSuccessAlert = () => {
    showAlert({
      title: "Success",
      message: "Operation completed successfully!",
      variant: "success",
    });
  };

  const handleShowWarningAlert = () => {
    showAlert({
      title: "Warning",
      message: "This action may have consequences.",
      variant: "warning",
    });
  };

  const handleShowErrorAlert = () => {
    showAlert({
      title: "Error",
      message: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  };

  const handleShowInfoAlert = () => {
    showAlert({
      title: "Info",
      message: "This is an informational message.",
      variant: "info",
    });
  };

  const handleShowLongMessageAlert = () => {
    showAlert({
      title: "Long Message",
      message: "This alert contains a longer message to demonstrate how the auto-close duration adapts to the length of the content. The more text there is to read, the longer the alert will stay visible, giving users adequate time to read the message before it disappears.",
      variant: "info",
    });
  };

  const handleShowCustomDurationAlert = () => {
    showAlert({
      title: "Custom Duration",
      message: "This alert has a custom duration of 10 seconds.",
      variant: "default",
      duration: 10000, // 10 seconds
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Alert Examples with Auto-Close</h2>
      <p className="text-sm text-gray-500 mb-4">
        All alerts now feature an automatic progress indicator showing when they will disappear.
        The duration is calculated based on the length of the message to ensure users have enough time to read.
      </p>
      
      <div className="flex flex-wrap gap-4">
        <Button onClick={handleShowDefaultAlert}>Default Alert</Button>
        <Button onClick={handleShowSuccessAlert} className="bg-green-600 hover:bg-green-700">Success Alert</Button>
        <Button onClick={handleShowWarningAlert} className="bg-yellow-600 hover:bg-yellow-700">Warning Alert</Button>
        <Button onClick={handleShowErrorAlert} className="bg-red-600 hover:bg-red-700">Error Alert</Button>
        <Button onClick={handleShowInfoAlert} className="bg-blue-600 hover:bg-blue-700">Info Alert</Button>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Special Examples</h3>
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleShowLongMessageAlert} variant="outline">Long Message Alert</Button>
          <Button onClick={handleShowCustomDurationAlert} variant="outline">Custom Duration Alert</Button>
        </div>
      </div>
    </div>
  );
} 