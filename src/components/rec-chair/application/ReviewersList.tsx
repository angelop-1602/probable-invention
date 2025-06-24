"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ReviewersListProps } from "@/types/rec-chair";
import { formatDate } from "@/lib/application/application.utils";
import { AlertCircle, X, Search, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReviewerAssignmentService, ReviewerAssignment, ReviewerAssignmentInput } from '@/lib/reviewers/reviewer-assignment.service';
import { ReviewFormService, ReviewForm } from '@/lib/reviewers/review-form.service';
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from 'next/dynamic';

// Dynamic imports for form previews
const ProtocolReviewForm = dynamic(
  () => import('@/components/primary-reviewer/forms/protocol-review-assesment-form'),
  { loading: () => <p>Loading Protocol Form...</p> }
);
const InformedConsentForm = dynamic(
  () => import('@/components/primary-reviewer/forms/informed-consent-assesment-form'),
  { loading: () => <p>Loading Consent Form...</p> }
);
const ExemptionChecklistForm = dynamic(
  () => import('@/components/primary-reviewer/forms/exemption-checklist-form'),
  { loading: () => <p>Loading Exemption Form...</p> }
);
const IACUCForm = dynamic(
  () => import('@/components/primary-reviewer/forms/protcol-review-IACUC-form'),
  { loading: () => <p>Loading IACUC Form...</p> }
);

export function ReviewersList({ application, reviewers, onUpdateApplication }: ReviewersListProps) {
  const [selectedReviewers, setSelectedReviewers] = useState<{
    [slot: number]: ReviewerAssignmentInput
  }>({
    0: { reviewerId: "", formType: "" },
    1: { reviewerId: "", formType: "" },
    2: { reviewerId: "", formType: "" }
  });

  const [showThirdReviewer, setShowThirdReviewer] = useState(true);
  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>({});
  const [previewForm, setPreviewForm] = useState<{ code: string; isOpen: boolean }>({ code: "", isOpen: false });
  const [isMigratingCodes, setIsMigratingCodes] = useState(false);

  const assignmentService = ReviewerAssignmentService.getInstance();
  const formService = ReviewFormService.getInstance();

  // Reset selections if application changes
  useEffect(() => {
    setSelectedReviewers({
      0: { reviewerId: "", formType: "" },
      1: { reviewerId: "", formType: "" },
      2: { reviewerId: "", formType: "" }
    });
    setShowThirdReviewer(true);
  }, [application.id]);

  const handleSelectReviewer = (slot: number, reviewerId: string) => {
    setSelectedReviewers({
      ...selectedReviewers,
      [slot]: {
        ...selectedReviewers[slot],
        reviewerId: reviewerId
      }
    });
    setOpenPopovers(prev => ({ ...prev, [slot]: false }));
  };

  const handleSelectReviewForm = (slot: number, formType: string) => {
    setSelectedReviewers({
      ...selectedReviewers,
      [slot]: {
        ...selectedReviewers[slot],
        formType: formType === "_none_" ? "" : formType
      }
    });
  };

  const handleRemoveThirdReviewer = () => {
    setShowThirdReviewer(false);
    setSelectedReviewers({
      ...selectedReviewers,
      2: { reviewerId: "", formType: "" }
    });
  };

  const handleSubmitReviewerAssignments = async () => {
    // Filter out empty slots
    const validSelections = Object.values(selectedReviewers).filter(
      selection => selection.reviewerId && selection.formType
    );

    if (!application.id) {
      toast.error("Application ID is missing");
      return;
    }

    try {
      const updatedReviewers = await assignmentService.assignReviewers(
        application.id,
        validSelections,
        application.reviewers || [],
        reviewers
      );

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

      toast.success("Reviewers assigned successfully", {
        description: "The selected reviewers were assigned to this protocol",
      });

      // Reset selections
      setSelectedReviewers({
        0: { reviewerId: "", formType: "" },
        1: { reviewerId: "", formType: "" },
        2: { reviewerId: "", formType: "" }
      });
      setShowThirdReviewer(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to assign reviewers. Please try again.");
    }
  };

  const isFormValid = () => {
    return Object.values(selectedReviewers).some(
      (selection) => selection.reviewerId && selection.formType
    );
  };

  const areAllDocumentsApproved = application.documents?.every(doc => doc.status === "accepted");
  const availableReviewers = assignmentService.getAvailableReviewers(
    reviewers,
    application.reviewers || []
  );

  const getSelectedReviewerName = (slot: number) => {
    const reviewerId = selectedReviewers[slot].reviewerId;
    const reviewer = availableReviewers.find(r => r.id === reviewerId);
    return reviewer ? `${reviewer.name} (${reviewer.code})` : "Select reviewer...";
  };

  const getFormPreviewComponent = (formCode: string) => {
    switch (formCode) {
      case 'Form 06A':
        return ProtocolReviewForm;
      case 'Form 06C':
        return InformedConsentForm;
      case 'Form 06B':
        return IACUCForm;
      case 'Form 04A':
        return ExemptionChecklistForm;
      default:
        return null;
    }
  };

  const renderFormPreview = () => {
    const FormComponent = getFormPreviewComponent(previewForm.code);
    if (!FormComponent) return null;

    return (
      <Dialog open={previewForm.isOpen} onOpenChange={(open) => setPreviewForm(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{formService.getFormByCode(previewForm.code)?.name} Preview</DialogTitle>
          </DialogHeader>
          <FormComponent readOnly={true} />
        </DialogContent>
      </Dialog>
    );
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Assigned Reviewers</CardTitle>
            <CardDescription>
              Reviewers assigned to evaluate this protocol
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      {application.reviewers && application.reviewers.length > 0 ? (
        <CardContent className="pt-6 max-h-[400px] overflow-y-auto">
          <ul className="space-y-4">
            {application.reviewers.map((reviewer, index) => (
              <li key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{reviewer.name}</p>
                  <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground">
                    <span>Assigned: {formatDate(reviewer.assignDate)}</span>
                    {reviewer.reviewForm && (
                      <div className="flex items-center gap-2">
                        <span>Form: {reviewer.reviewForm}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setPreviewForm({ code: reviewer.reviewForm, isOpen: true })}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <StatusBadge
                  status={reviewer.status.toLowerCase() === "completed" ? "approved" : "under review"}
                  customLabel={reviewer.status}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      ) : (
        <CardContent>
          <div className="flex flex-wrap justify-start gap-4">
            {[0, 1].map((slot) => (
              <Card
                key={slot}
                className="flex-1 min-w-[200px] max-w-sm bg-muted/50 shadow-sm hover:shadow-md transition rounded-xl border"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-muted-foreground">
                    Reviewer {slot + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`reviewer-${slot}`} className="text-sm mb-1 block text-muted-foreground">
                      Select Reviewer
                    </Label>
                    <Popover
                      open={openPopovers[slot]}
                      onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [slot]: open }))}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPopovers[slot]}
                          className="w-full justify-between"
                          disabled={!areAllDocumentsApproved}
                        >
                          {getSelectedReviewerName(slot)}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search reviewer..." />
                          <CommandEmpty>No reviewer found.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-auto">
                            {availableReviewers.map((reviewer) => (
                              <CommandItem
                                key={reviewer.id}
                                value={reviewer.name}
                                onSelect={() => handleSelectReviewer(slot, reviewer.id)}
                              >
                                <div className="flex flex-col">
                                  <span>{reviewer.name}</span>
                                  <span className="text-sm text-muted-foreground">{reviewer.code}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor={`form-${slot}`} className="text-sm mb-1 block text-muted-foreground">
                      Select Review Form
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedReviewers[slot].formType}
                        onValueChange={(value) => handleSelectReviewForm(slot, value)}
                        disabled={!selectedReviewers[slot].reviewerId || !areAllDocumentsApproved}
                      >
                        <SelectTrigger id={`form-${slot}`} className="flex-1">
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">None</SelectItem>
                          {formService.getForms().map((form) => (
                            <SelectItem key={form.id} value={form.code}>
                              {form.code}: {form.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedReviewers[slot].formType && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewForm({ code: selectedReviewers[slot].formType, isOpen: true })}
                          disabled={!selectedReviewers[slot].formType}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {showThirdReviewer && (
              <Card className="flex-1 min-w-[200px] max-w-sm bg-muted/50 shadow-sm hover:shadow-md transition rounded-xl border relative">
                <CardHeader className="pb-2 flex justify-between items-start">
                  <CardTitle className="text-base font-semibold text-muted-foreground">
                    Reviewer 3 (Optional)
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={handleRemoveThirdReviewer}
                  >
                    <X size={16} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reviewer-2" className="text-sm mb-1 block text-muted-foreground">
                      Select Reviewer
                    </Label>
                    <Popover
                      open={openPopovers[2]}
                      onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, 2: open }))}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPopovers[2]}
                          className="w-full justify-between"
                          disabled={!areAllDocumentsApproved}
                        >
                          {getSelectedReviewerName(2)}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search reviewer..." />
                          <CommandEmpty>No reviewer found.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-auto">
                            {availableReviewers.map((reviewer) => (
                              <CommandItem
                                key={reviewer.id}
                                value={reviewer.name}
                                onSelect={() => handleSelectReviewer(2, reviewer.id)}
                              >
                                <div className="flex flex-col">
                                  <span>{reviewer.name}</span>
                                  <span className="text-sm text-muted-foreground">{reviewer.code}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="form-2" className="text-sm mb-1 block text-muted-foreground">
                      Select Review Form
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedReviewers[2].formType}
                        onValueChange={(value) => handleSelectReviewForm(2, value)}
                        disabled={!selectedReviewers[2].reviewerId || !areAllDocumentsApproved}
                      >
                        <SelectTrigger id="form-2" className="flex-1">
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">None</SelectItem>
                          {formService.getForms().map((form) => (
                            <SelectItem key={form.id} value={form.code}>
                              {form.code}: {form.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedReviewers[2].formType && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewForm({ code: selectedReviewers[2].formType, isOpen: true })}
                          disabled={!selectedReviewers[2].formType}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              variant="default"
              onClick={handleSubmitReviewerAssignments}
              disabled={!isFormValid() || !areAllDocumentsApproved}
              className="px-6 py-2"
            >
              Assign Selected Reviewers
            </Button>
          </div>
        </CardContent>
      )}

      {renderFormPreview()}
    </Card>
  );
} 