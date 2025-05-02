"use client";

import React, { useState } from 'react';
import { useFirestoreCollection } from '@/hooks/useFirestoreRealtime';
import { where, orderBy, limit, QueryConstraint } from 'firebase/firestore';
import { Filter, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApplicationsTable } from '@/components/rec-chair/application/ApplicationsTable';
import { Button } from '@/components/ui/button';
import { ApplicationTableData } from '@/components/rec-chair/application/types';

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Build query constraints based on filters
  const queryConstraints: QueryConstraint[] = [];
  
  if (statusFilter) {
    queryConstraints.push(where('applicationStatus', '==', statusFilter));
  }
  
  // Always sort by most recent
  queryConstraints.push(orderBy('proponent.submissionDate', 'desc'));
  queryConstraints.push(limit(50));
  
  // Real-time collection subscription
  const { data: rawApplications, loading, error, refresh } = useFirestoreCollection(
    'protocolReviewApplications',
    queryConstraints
  );

  // Transform raw data to match the format expected by the ApplicationsTable component
  const transformedApplications: ApplicationTableData[] = React.useMemo(() => {
    if (!rawApplications) return [];
    
    return rawApplications.map(doc => ({
      id: doc.id,
      spupRecCode: doc.recCode || `SPUP_${new Date().getFullYear()}_${doc.id.substr(0, 5)}`,
      principalInvestigator: doc.proponent?.name || doc.principalInvestigator || "Unknown",
      submissionDate: doc.proponent?.submissionDate,
      courseProgram: doc.proponent?.courseProgram || doc.courseProgram || "N/A",
      title: doc.protocolDetails?.researchTitle || doc.title || "Untitled Protocol",
      status: doc.applicationStatus || "pending",
      category: doc.typeOfResearch || "Unknown"
    }));
  }, [rawApplications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // If the hook provides a refresh function, use it
      if (refresh) {
        await refresh();
      }
    } catch (error) {
      console.error("Error refreshing applications data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
          <p className="font-medium">Error loading applications</p>
          <p className="text-sm mt-1">{error.message}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      ) : transformedApplications.length === 0 ? (
        <div className="p-10 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">No applications found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {statusFilter ? 
              'Try changing your filters to see more results' : 
              'No applications have been submitted yet'}
          </p>
        </div>
      ) : (
        <ApplicationsTable 
          title="Protocol Review Applications"
          caption="List of protocol applications submitted for REC review"
          data={transformedApplications}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
