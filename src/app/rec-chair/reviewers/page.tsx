"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChairTable } from "@/components/rec-chair/shared/Table";
import { AddReviewerCard } from "@/components/rec-chair/reviewers/AddReviewerCard";

type Reviewer = {
  id?: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function Reviewers() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger a refresh of the data
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Extract number from reviewer code for sorting
  const extractNumber = (code: string): number => {
    const match = code.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 999; // Default to a high number if no match
  };

  // Sort reviewers by the numeric part of their code
  const sortReviewers = (reviewersData: Reviewer[]): Reviewer[] => {
    return [...reviewersData].sort((a, b) => {
      return extractNumber(a.code) - extractNumber(b.code);
    });
  };

  useEffect(() => {
    const fetchReviewers = async () => {
      setLoading(true);
      try {
        const reviewersCollection = collection(db, "reviewers");
        const reviewersSnapshot = await getDocs(reviewersCollection);
        const reviewersData = reviewersSnapshot.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            code: data.code || "",
            name: data.name || "",
            isActive: data.isActive || false,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null
          } as Reviewer;
        });
        
        // Sort reviewers by code number
        setReviewers(sortReviewers(reviewersData));
      } catch (error) {
        console.error("Error fetching reviewers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewers();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  return (
    <div className="space-y-6">
      {/* Header with Add Reviewer button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-600">Primary Reviewers</h1>
          <p className="text-muted-foreground mt-1">
            Manage primary reviewers for protocol evaluation
          </p>
        </div>
        <AddReviewerCard onReviewerAdded={refreshData} />
      </div>
      
      {/* Reviewers Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <ChairTable 
          tableType="reviewers"
          data={reviewers}
          caption="Complete list of primary reviewers"
          hidePagination={true}
        />
      )}
    </div>
  );
}
