"use client";

import { useEffect, useState, useCallback } from "react";
import { ChairTable } from "@/components/rec-chair/shared/Table";
import { AddReviewerCard } from "@/components/rec-chair/reviewers/AddReviewerCard";
import { fetchReviewers, Reviewer, prefetchReviewersData } from "@/lib/reviewers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Reviewers() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Function to trigger a refresh of the data
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Prefetch reviewers data for future navigations
  useEffect(() => {
    prefetchReviewersData();
  }, []);

  // Load reviewers data (from cache if available)
  useEffect(() => {
    const loadReviewers = async () => {
      setLoading(true);
      try {
        // If refreshTrigger was incremented, force a fresh fetch
        const forceRefresh = refreshTrigger > 0;
        const data = await fetchReviewers(forceRefresh, showActiveOnly);
        setReviewers(data);
      } catch (error) {
        console.error("Error loading reviewers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviewers();
  }, [refreshTrigger, showActiveOnly]);

  return (
    <div className="space-y-6">
      {/* Header with Add Reviewer button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Primary Reviewers</h1>
          <p className="text-muted-foreground mt-1">
            Manage Primary Reviewers
          </p>
        </div>
        <AddReviewerCard onReviewerAdded={refreshData} />
      </div>
      
      {/* Filter Switch */}
      <div className="flex items-center space-x-2">
        <Switch
          id="active-filter"
          checked={showActiveOnly}
          onCheckedChange={setShowActiveOnly}
        />
        <Label htmlFor="active-filter">
          {showActiveOnly ? "Showing active reviewers only" : "Showing all reviewers"}
        </Label>
      </div>
      
      {/* Reviewers Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ChairTable 
          tableType="reviewers"
          data={reviewers}
          caption={`${showActiveOnly ? 'Active' : 'Complete list of'} primary reviewers`}
          hidePagination={true}
          onRefresh={refreshData}
        />
      )}
    </div>
  );
}
