"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ReviewersListProps, Reviewer } from "@/types/rec-chair";
import { formatDate } from "@/lib/utils";

export function ReviewersList({ application, reviewers, onUpdateApplication }: ReviewersListProps) {
  const [isAssigningReviewers, setIsAssigningReviewers] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [selectedReviewForms, setSelectedReviewForms] = useState<{[key: string]: string}>({});

  const handleAssignReviewer = (reviewerId: string) => {
    if (selectedReviewers.includes(reviewerId)) {
      setSelectedReviewers(selectedReviewers.filter(id => id !== reviewerId));
      
      // Remove form selection for this reviewer
      const updatedForms = {...selectedReviewForms};
      delete updatedForms[reviewerId];
      setSelectedReviewForms(updatedForms);
    } else {
      setSelectedReviewers([...selectedReviewers, reviewerId]);
    }
  };

  const handleSelectReviewForm = (reviewerId: string, formType: string) => {
    setSelectedReviewForms({
      ...selectedReviewForms,
      [reviewerId]: formType
    });
  };

  const handleSubmitReviewerAssignments = async () => {
    if (!application.id || selectedReviewers.length === 0) return;

    try {
      // Map selected reviewers to the format needed
      const assignedReviewers = selectedReviewers.map(id => {
        const reviewer = reviewers.find(r => r.id === id);
        return {
          id: id,
          name: reviewer?.name || "Unknown Reviewer",
          assignDate: new Date(),
          status: "Assigned",
          reviewForm: selectedReviewForms[id] || "Form 06A" // Default to Form 06A if not specified
        };
      });

      // Combine with existing reviewers if any
      const updatedReviewers = [...(application.reviewers || []), ...assignedReviewers];

      // Update Firestore with reviewer assignments and change to Initial Review (IR) stage
      await updateDoc(doc(db, "protocolReviewApplications", application.id), {
        reviewers: updatedReviewers,
        status: "Under Review", 
        progress: "IR" // Initial Review stage
      });

      // Update application locally
      const updatedApplication = {
        ...application,
        reviewers: updatedReviewers,
        status: "Under Review",
        progress: "IR"
      };

      if (onUpdateApplication) {
        onUpdateApplication(updatedApplication);
      }

      toast("Reviewers assigned successfully", {
        description: "The selected reviewers were assigned to this protocol",
      });
      
      setIsAssigningReviewers(false);
      setSelectedReviewers([]);
      setSelectedReviewForms({});
    } catch (error) {
      console.error("Error assigning reviewers:", error);
      toast.error("Failed to assign reviewers. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assigned Reviewers</CardTitle>
          <CardDescription>
            Reviewers assigned to evaluate this protocol
          </CardDescription>
        </div>
        
        {/* Check if all documents are approved before allowing reviewer assignment */}
        {application.documents && (
        <Dialog open={isAssigningReviewers} onOpenChange={setIsAssigningReviewers}>
          <DialogTrigger asChild>
            <Button 
              disabled={!application.documents?.every(doc => doc.status === "accepted")}
              title={!application.documents?.every(doc => doc.status === "accepted") ? 
                "All documents must be approved before assigning reviewers" : ""}
            >
              Assign Reviewers
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Assign Protocol Reviewers</DialogTitle>
              <DialogDescription>
                Select reviewers and the forms they should complete
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4 max-h-[400px] overflow-y-auto">
              {reviewers.length > 0 ? (
                reviewers.map((reviewer) => {
                  const isSelected = selectedReviewers.includes(reviewer.id);
                  return (
                    <div key={reviewer.id} className="flex flex-col space-y-2 border p-3 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`reviewer-${reviewer.id}`} 
                          checked={isSelected}
                          onCheckedChange={() => handleAssignReviewer(reviewer.id)} 
                        />
                        <Label 
                          htmlFor={`reviewer-${reviewer.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{reviewer.name}</div>
                          <div className="text-xs text-muted-foreground">Code: {reviewer.code}</div>
                        </Label>
                        {reviewer.isActive ? (
                          <StatusBadge status="approved" customLabel="Active" size="sm" />
                        ) : (
                          <StatusBadge status="rejected" customLabel="Inactive" size="sm" />
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="pl-7 mt-2">
                          <Label htmlFor={`form-${reviewer.id}`} className="text-sm mb-1 block">
                            Select Review Form
                          </Label>
                          <Select 
                            value={selectedReviewForms[reviewer.id] || ""}
                            onValueChange={(value) => handleSelectReviewForm(reviewer.id, value)}
                          >
                            <SelectTrigger id={`form-${reviewer.id}`}>
                              <SelectValue placeholder="Select Form" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Form 06A">Form 06A: Protocol Review Assessment</SelectItem>
                              <SelectItem value="Form 06C">Form 06C: Informed Consent Assessment</SelectItem>
                              <SelectItem value="Form 06B">Form 06B: Protocol Review Assessment (IACUC)</SelectItem>
                              <SelectItem value="Form 04A">Form 04A: Checklist of Exemption from Review</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-4 text-muted-foreground">No reviewers available</p>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssigningReviewers(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitReviewerAssignments} 
                disabled={selectedReviewers.length === 0 || 
                  selectedReviewers.some(id => !selectedReviewForms[id])}
              >
                Assign Selected Reviewers
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {application.reviewers && application.reviewers.length > 0 ? (
          <ul className="space-y-4">
            {application.reviewers.map((reviewer, index) => (
              <li key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{reviewer.name}</p>
                  <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground">
                    <span>Assigned: {formatDate(reviewer.assignDate)}</span>
                    {reviewer.reviewForm && <span>Form: {reviewer.reviewForm}</span>}
                  </div>
                </div>
                <StatusBadge 
                  status={reviewer.status.toLowerCase() === "completed" ? "approved" : "under review"}
                  customLabel={reviewer.status}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No reviewers have been assigned yet.</p>
            {application.status?.toLowerCase() === "approved" ? (
              <Button className="mt-4" onClick={() => setIsAssigningReviewers(true)}>
                Assign Reviewers
              </Button>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Reviewers can be assigned after the application is approved for initial review.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 