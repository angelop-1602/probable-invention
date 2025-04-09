"use client";

import React from "react";
import AlertExample from "@/components/ui/AlertExample";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AlertExamplePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Alert System Example</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
      
      <p className="text-gray-600 mb-8">
        This page demonstrates the alert system in action. Click the buttons below to trigger different types of alerts.
        All alerts will appear in the bottom-right corner of the screen.
      </p>
      
      <AlertExample />
      
      <div className="mt-12 p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
        <p className="mb-4">
          The alert system is implemented using React context and can be used anywhere in the application by importing the useAlerts hook:
        </p>
        <pre className="bg-black text-white p-4 rounded-md overflow-x-auto">
          {`import { useAlerts } from "@/components/shared/Alerts";

const { showAlert } = useAlerts();

// Show an alert
showAlert({
  title: "Success",
  message: "Operation completed successfully!",
  variant: "success",
  duration: 5000,
});`}
        </pre>
        <p className="mt-4">
          For more details, see the <code>src/docs/alerts-usage.md</code> documentation.
        </p>
      </div>
    </div>
  );
} 