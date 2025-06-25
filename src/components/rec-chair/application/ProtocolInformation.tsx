"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtocolStatusBadge } from "@/components/ui/ProtocolStatusBadge";
import { ProtocolInformationProps, StatusUpdateParam } from "@/types/rec-chair";
import { formatDate } from "@/lib/application/application.utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useFirestoreDocument } from "@/hooks/useFirestoreRealtime";

// Lookup objects for converting between codes and full values
const FUNDING_OPTIONS = {
  "R": "(R) Researcher-funded",
  "I": "(I) Institution-funded",
  "A": "(A) Agency other than institution",
  "O": "(O) Others"
};

const RESEARCH_TYPE_OPTIONS = {
  "BM": "(BM) Biomedical studies",
  "HO": "(HO) Health Operations Research",
  "SR": "(SR) Social Research",
  "PH": "(PH) Public Health Research",
  "EX": "(EX) Experimental Research"
};

const STATUS_OPTIONS = {
  "OR": "(OR) On-going review",
  "A": "(A) Approved and on-going",
  "C": "(C) Completed",
  "T": "(T) Terminated",
  "W": "(W) Withdrawn",
  "Pending": "Pending"
};

const PROGRESS_OPTIONS = {
  "SC": "(SC) Submission Check",
  "IR": "(IR) Initial Review",
  "RS": "(RS) Resubmission",
  "AP": "(AP) Approved",
  "PR": "(PR) Progress Report",
  "FR": "(FR) Final Report",
  "AR": "(AR) Archiving"
};

const REVIEW_TYPE_OPTIONS = {
  "Full Review": "Full Review",
  "Expedited Review": "Expedited Review",
  "Exempt from Review": "Exempt from Review"
};

const DECISION_OPTIONS = {
  "Approved": "Approved",
  "Minor modification": "Minor modification",
  "Major modification": "Major modification",
  "Disapproved": "Disapproved",
  "Pending": "Pending"
};

// Helper function to extract code from display value if needed (for StatusBadge component)
const extractCode = (value: string): string => {
  const match = value.match(/^\(([A-Z]{1,2})\)/);
  return match ? match[1] : value;
};

// Helper function to get display value from either a full value or a code
const getDisplayValue = (value: string, options: Record<string, string>): string => {
  // If it's already a full value (contains parentheses), return it
  if (value.includes('(')) return value;
  
  // Otherwise, look up the full value from the code
  return options[value as keyof typeof options] || value;
};

export function ProtocolInformation({ application, onStatusUpdated }: ProtocolInformationProps) {
  // Use Firestore real-time updates
  const { data: liveApplication, loading } = useFirestoreDocument<any>(
    "protocolReviewApplications",
    application.id || ""
  );
  
  // Combined application data (prefer live data when available)
  const appData = liveApplication || application;
  
  // State for tracking edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State for saving indicator
  const [isSaving, setIsSaving] = useState(false);
  
  // Track values only during edit mode
  const [editValues, setEditValues] = useState({
    status: "",
    progress: "",
    funding: "",
    researchType: "",
    reviewType: "",
    decision: ""
  });
  
  // Convert code to display value with code
  const getFullFundingValue = (code: string): string => {
    return FUNDING_OPTIONS[code as keyof typeof FUNDING_OPTIONS] || code;
  };
  
  const getFullResearchTypeValue = (code: string): string => {
    return RESEARCH_TYPE_OPTIONS[code as keyof typeof RESEARCH_TYPE_OPTIONS] || code;
  };
  
  const getFullStatusValue = (code: string): string => {
    return STATUS_OPTIONS[code as keyof typeof STATUS_OPTIONS] || code;
  };
  
  const getFullProgressValue = (code: string): string => {
    return PROGRESS_OPTIONS[code as keyof typeof PROGRESS_OPTIONS] || code;
  };
  
  // Initialize edit values when edit mode is activated
  useEffect(() => {
    if (isEditing && appData) {
      // Convert codes to full values for editing
      setEditValues({
        status: getFullStatusValue(appData.status || "Pending"),
        progress: getFullProgressValue(appData.progress || "SC"),
        funding: getFullFundingValue(appData.funding || "R"),
        researchType: getFullResearchTypeValue(appData.researchType || "SR"),
        reviewType: appData.reviewType || "Full Review",
        decision: appData.decision || "Pending"
      });
    }
  }, [isEditing, appData]);
  
  // Generic handle change function for all select inputs
  const handleChange = (field: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const toggleEditMode = () => {
    if (isEditing) {
      // Save changes
      saveChanges();
    } else {
      setIsEditing(true);
    }
  };
  
  const cancelEdit = () => {
    setIsEditing(false);
  };
  
  const saveChanges = async () => {
    if (!appData.id) {
      toast.error("Cannot save changes: Application ID is missing");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create a complete document update with full values
      const updates = {
        // Save the full values to Firestore
        status: editValues.status,
        progress: editValues.progress,
        funding: editValues.funding,
        researchType: editValues.researchType,
        reviewType: editValues.reviewType,
        decision: editValues.decision,
        updatedAt: new Date()
      };
      
      // Update Firestore
      const applicationRef = doc(db, "protocolReviewApplications", appData.id);
      await updateDoc(applicationRef, updates);
      
      // Notify parent component if callback provided
      if (onStatusUpdated) {
        Object.entries(updates).forEach(([field, value]) => {
          if (typeof value !== 'object') {
            const update: StatusUpdateParam = { field, value: value as string };
            onStatusUpdated(update);
          }
        });
      }
      
      setIsEditing(false);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      if (error instanceof Error) {
        toast.error(`Failed to save: ${error.message}`);
      } else {
        toast.error("Failed to save changes. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading && !appData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocol Review Application Information</CardTitle>
          <CardDescription>Loading application data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Protocol Review Application Information</CardTitle>
          <CardDescription>
            Manage the information of the protocol review application
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cancelEdit}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={saveChanges}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Information
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">  
          <div>
            <h4 className="text-sm font-medium">Principal Investigator</h4>
            <p className="text-sm text-muted-foreground">
              {appData.principalInvestigator || appData.proponent?.name || "Not specified"}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Submission Date</h4>
            <p className="text-sm text-muted-foreground">
              {formatDate(appData.submissionDate || appData.proponent?.submissionDate)}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Course/Program</h4>
            <p className="text-sm text-muted-foreground">
              {appData.courseProgram || appData.proponent?.courseProgram || "Not specified"}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Research Type</h4>
            {isEditing ? (
              <Select
                value={editValues.researchType}
                onValueChange={(value) => handleChange('researchType', value)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select research type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESEARCH_TYPE_OPTIONS).map(([code, label]) => (
                    <SelectItem key={code} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {getDisplayValue(appData.researchType || "SR", RESEARCH_TYPE_OPTIONS)}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Adviser</h4>
            <p className="text-sm text-muted-foreground">
              {appData.adviser || appData.proponent?.advisor || "Not specified"}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Email Address</h4>
            <p className="text-sm text-muted-foreground">
              {appData.email || appData.proponent?.email || "Not provided"}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Funding</h4>
            {isEditing ? (
              <Select
                value={editValues.funding}
                onValueChange={(value) => handleChange('funding', value)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select funding" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FUNDING_OPTIONS).map(([code, label]) => (
                    <SelectItem key={code} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {getDisplayValue(appData.funding || "R", FUNDING_OPTIONS)}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Review Type</h4>
            {isEditing ? (
              <Select
                value={editValues.reviewType}
                onValueChange={(value) => handleChange('reviewType', value)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select review type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REVIEW_TYPE_OPTIONS).map(([code, label]) => (
                    <SelectItem key={code} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {getDisplayValue(appData.reviewType || "Full Review", REVIEW_TYPE_OPTIONS)}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Decision</h4>
            {isEditing ? (
              <Select
                value={editValues.decision}
                onValueChange={(value) => handleChange('decision', value)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DECISION_OPTIONS).map(([code, label]) => (
                    <SelectItem key={code} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {getDisplayValue(appData.decision || "Pending", DECISION_OPTIONS)}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Status</h4>
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <Select
                  value={editValues.status}
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_OPTIONS).map(([code, label]) => (
                      <SelectItem key={code} value={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm">
                  {getDisplayValue(appData.status || "Pending", STATUS_OPTIONS)}
                </div>
              )}
            </div>
          </div>
          
          
        </div>
        
        {appData.coInvestigators && appData.coInvestigators.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">Co-Investigators</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
              {appData.coInvestigators.map((name: string, index: number) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
        )}
        
      
      </CardContent>
    </Card>
  );
} 