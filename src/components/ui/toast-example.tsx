"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function ToastExample() {
  const { toast } = useToast();

  const showDefaultToast = () => {
    toast("This is a default toast");
  };

  const showSuccessToast = () => {
    toast.success("Operation completed successfully!", {
      description: "Your data has been saved."
    });
  };

  const showErrorToast = () => {
    toast.error("An error occurred", {
      description: "Please try again later."
    });
  };

  const showLoadingToast = () => {
    const toastId = toast.loading("Loading data...");
    
    // Simulate async operation
    setTimeout(() => {
      toast.success("Data loaded successfully!", {
        id: toastId,
        description: "Your information is ready."
      });
    }, 2000);
  };

  const showPromiseToast = () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve({ name: "Sample Data" }), 2000);
    });

    toast.promise(promise, {
      loading: "Saving your data...",
      success: (data) => `Successfully saved ${(data as any).name}!`,
      error: "Error saving data"
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Toast Examples</h2>
      <div className="flex flex-wrap gap-4">
        <Button onClick={showDefaultToast}>Default Toast</Button>
        <Button onClick={showSuccessToast} variant="default" className="bg-green-500 hover:bg-green-600">Success Toast</Button>
        <Button onClick={showErrorToast} variant="destructive">Error Toast</Button>
        <Button onClick={showLoadingToast} variant="outline">Loading Toast</Button>
        <Button onClick={showPromiseToast} variant="secondary">Promise Toast</Button>
      </div>
    </div>
  );
} 