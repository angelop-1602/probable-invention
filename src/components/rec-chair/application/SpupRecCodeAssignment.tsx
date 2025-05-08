"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateSpupRecCode } from "@/lib/application";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SpupRecCodeAssignmentProps {
  applicationId?: string;
  principalInvestigator?: string;
  researchType?: string;
  currentCode?: string;
  isFirstView?: boolean;
  onCodeSaved: (code: string) => void;
}

// Add toast helper functions at the top of the file
// Helper functions to prevent accidental rendering of toast returns
function showSuccessToast(toastFn: any, title: string, description: string) {
  toastFn.success(title, {
    description,
  });
}

function showErrorToast(toastFn: any, title: string, description: string) {
  toastFn.error(title, {
    description,
  });
}

export function SpupRecCodeAssignment({
  applicationId,
  principalInvestigator = "",
  researchType = "",
  currentCode = "",
  isFirstView = false,
  onCodeSaved
}: SpupRecCodeAssignmentProps) {
  const [isEditing, setIsEditing] = useState(isFirstView);
  const [spupRecCode, setSpupRecCode] = useState(currentCode);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load default SPUP REC code when in first view mode
  useEffect(() => {
    const loadDefaultCode = async () => {
      if (isFirstView && !currentCode && !spupRecCode) {
        try {
          setGeneratingCode(true);
          const generatedCode = await generateSpupRecCode(
            principalInvestigator,
            researchType
          );
          setSpupRecCode(generatedCode);
        } catch (error) {
          console.error("Error generating SPUP REC code:", error);
        } finally {
          setGeneratingCode(false);
        }
      }
    };
    
    loadDefaultCode();
  }, [isFirstView, principalInvestigator, researchType, currentCode, spupRecCode]);

  // Save SPUP REC code to the database
  const handleSaveSpupRecCode = async () => {
    if (!spupRecCode.trim()) {
      showErrorToast(toast, "Invalid SPUP REC Code", "Please enter a valid SPUP REC Code");
      return;
    }

    setIsSaving(true);
    
    try {
      // Only try to update if we have an ID
      if (applicationId) {
        await updateDoc(doc(db, "protocolReviewApplications", applicationId), {
          recCode: spupRecCode, // Use the recCode field name for the Firestore document
          // If this is first view, update status to "Submission Check"
          ...(isFirstView && { 
            applicationStatus: "Submission Check", 
            progress: "SC",
            reviewProgress: { submissionCheck: true }
          })
        });
      }

      // Notify parent component
      onCodeSaved(spupRecCode);

      // Exit editing mode
      setIsEditing(false);
      
      showSuccessToast(toast, "SPUP REC Code saved", "The SPUP REC Code has been successfully assigned");
    } catch (error) {
      console.error("Error saving SPUP REC code:", error);
      showErrorToast(toast, "Error saving SPUP REC code", "Failed to save SPUP REC code. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Assign SPUP REC Code</CardTitle>
          <CardDescription>
            {isFirstView ? "Assign a SPUP REC Code to begin the review process" : "Edit the SPUP REC Code"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="spup-rec-code">SPUP REC Code</Label>
              <div className="mt-1">
                <Input 
                  id="spup-rec-code" 
                  value={spupRecCode} 
                  onChange={(e) => setSpupRecCode(e.target.value)} 
                  placeholder="e.g., SPUP_2023_0001_SR_AB"
                  className="font-mono"
                  disabled={generatingCode}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">Auto-generated format:</span> SPUP_YYYY_NNNN_TR_FL
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                SPUP: Institution, YYYY: Year, NNNN: Sequential number, TR: Type of research (EX/SR), FL: Investigator initials
              </p>
            </div>
            
            <div className="flex gap-2 justify-end">
              {!isFirstView && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSaveSpupRecCode} 
                disabled={!spupRecCode.trim() || generatingCode || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : generatingCode ? (
                  "Generating..."
                ) : (
                  isFirstView ? "Assign Code & Begin Review" : "Save Code"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-accent/20 rounded-md mb-6">
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground">SPUP REC Code:</span>
        <span className="ml-2 font-mono font-medium">{currentCode || spupRecCode}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 ml-2" 
          title="Edit SPUP REC Code"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
} 