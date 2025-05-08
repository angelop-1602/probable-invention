"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2Icon, Eye } from "lucide-react";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Reviewer } from "@/types/protocol-application/utils";
import { ReviewersService } from "@/lib/reviewers/reviewers.service";
import { formatDate } from "@/lib/application/application.utils";

const SPECIALIZATIONS = [
  "Natural Science",
  "Medical Science",
  "Political Science",
  "Social Science",
  "Public Health",
  "Data Science",
  "Biosystems Engineering",
  "Languages",
  "Information Technologies"
];

const DEPARTMENTS = [
  "SASTE",
  "SBAHM",
  "SITE",
  "SNAHS",
  "BEU",
  "HR"
];

interface ViewReviewerDialogProps {
  reviewer: Reviewer;
  onReviewerUpdated?: () => void;
}

export function ViewReviewerDialog({ reviewer, onReviewerUpdated }: ViewReviewerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Editing state
  const [specialization, setSpecialization] = useState(reviewer.specialization || "");
  const [department, setDepartment] = useState(reviewer.department || "");
  const [isAffiliated, setIsAffiliated] = useState(reviewer.department !== "None" && reviewer.department !== "");
  const [isActive, setIsActive] = useState(reviewer.isActive);

  // Confirmation dialogs
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const expectedCode = "CONFIRM";

  // Handle department change when affiliation changes
  const handleAffiliatedChange = (value: boolean) => {
    setIsAffiliated(value);
    if (!value) {
      setDepartment("None");
    } else if (department === "None") {
      setDepartment("");
    }
  };

  // Update reviewer function
  const handleUpdateReviewer = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!reviewer.id) {
        throw new Error("Reviewer ID is missing");
      }

      const reviewerRef = doc(db, "reviewers", reviewer.id);
      await updateDoc(reviewerRef, {
        specialization,
        department: isAffiliated ? department : "None",
        isActive,
        updatedAt: serverTimestamp()
      });

      // Set success message
      setSuccess("Reviewer details updated successfully.");
      
      // Invalidate reviewers cache after successful update
      ReviewersService.getInstance().invalidateReviewersCache();

      // Call the callback
      if (onReviewerUpdated) {
        onReviewerUpdated();
      }

      // Reset form after a delay
      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (err: any) {
      console.error("Error updating reviewer:", err);
      setError(err.message || "Failed to update reviewer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Deactivate reviewer function
  const handleDeactivateReviewer = async () => {
    if (confirmationCode !== expectedCode) {
      setError("Incorrect confirmation code. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!reviewer.id) {
        throw new Error("Reviewer ID is missing");
      }

      const reviewerRef = doc(db, "reviewers", reviewer.id);
      await updateDoc(reviewerRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setIsActive(false);
      
      // Invalidate cache
      ReviewersService.getInstance().invalidateReviewersCache();
      
      // Show success message
      setSuccess("Reviewer deactivated successfully!");

      // Call the callback if provided
      if (onReviewerUpdated) {
        onReviewerUpdated();
      }

      // Close the confirmation dialog
      setShowDeactivateDialog(false);
      setConfirmationCode("");

    } catch (err: any) {
      console.error("Error deactivating reviewer:", err);
      setError(err.message || "Failed to deactivate reviewer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete reviewer function
  const handleDeleteReviewer = async () => {
    if (confirmationCode !== expectedCode) {
      setError("Incorrect confirmation code. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!reviewer.id) {
        throw new Error("Reviewer ID is missing");
      }

      const reviewerRef = doc(db, "reviewers", reviewer.id);
      await deleteDoc(reviewerRef);

      // Invalidate cache
      ReviewersService.getInstance().invalidateReviewersCache();
      
      // Show success message before closing
      setSuccess("Reviewer deleted successfully!");

      // Call the callback if provided
      if (onReviewerUpdated) {
        onReviewerUpdated();
      }

      // Close dialogs after a short delay to show the success message
      setTimeout(() => {
        setShowDeleteDialog(false);
        setOpen(false);
        setConfirmationCode("");
      }, 1500);

    } catch (err: any) {
      console.error("Error deleting reviewer:", err);
      setError(err.message || "Failed to delete reviewer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reviewer Details</DialogTitle>
            <DialogDescription>
              View and manage reviewer information
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            {/* Reviewer Info (Non-editable) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Code</Label>
              <div className="col-span-3 font-medium">{reviewer.code}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <div className="col-span-3 font-medium">{reviewer.name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date Added</Label>
              <div className="col-span-3">{formatDate(reviewer.createdAt)}</div>
            </div>

            {/* Reviewer Editable Fields */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialization" className="text-right">
                Specialization
              </Label>
              <div className="col-span-3">
                <Select 
                  value={specialization} 
                  onValueChange={setSpecialization}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="affiliation" className="text-right">
                Affiliated
              </Label>
              <div className="flex items-center col-span-3 space-x-2">
                <Switch 
                  id="affiliation"
                  checked={isAffiliated}
                  onCheckedChange={handleAffiliatedChange}
                />
                <span>{isAffiliated ? "Affiliated" : "Unaffiliated"}</span>
              </div>
            </div>

            {isAffiliated && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={department} 
                    onValueChange={setDepartment}
                    disabled={!isAffiliated}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="flex items-center col-span-3 space-x-2">
                <Switch 
                  id="status"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <span>{isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => setShowDeactivateDialog(true)}
                disabled={!isActive || isLoading}
              >
                Deactivate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
              >
                <Trash2Icon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            <Button 
              type="button"
              onClick={handleUpdateReviewer}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Reviewer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this reviewer? They will no longer be shown as active.
              <br /><br />
              To confirm, type <strong>{expectedCode}</strong> below:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder={`Type ${expectedCode} to confirm`}
              className="mb-2"
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationCode("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateReviewer}
              disabled={confirmationCode !== expectedCode || isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reviewer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reviewer? This action cannot be undone.
              <br /><br />
              To confirm, type <strong>{expectedCode}</strong> below:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder={`Type ${expectedCode} to confirm`}
              className="mb-2"
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationCode("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReviewer}
              disabled={confirmationCode !== expectedCode || isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 