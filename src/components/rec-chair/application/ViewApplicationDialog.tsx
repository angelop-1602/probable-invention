"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCommentDialog } from "./AddCommentDialog";
import { FileText } from "lucide-react";
import { formatDate } from "@/lib/application/application.utils";
import { ViewApplicationDialogProps } from "@/types/rec-chair";

export function ViewApplicationDialog({ application, onApplicationUpdated }: ViewApplicationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleCommentAdded = () => {
    if (onApplicationUpdated) {
      onApplicationUpdated();
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Application</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>Review application information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Application Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-md font-medium mb-3">Application Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Application ID</p>
                  <p className="text-sm font-medium">{application.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="text-sm font-medium">{application.title || "No title"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{application.status || "Pending"}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">
                    {application.submissionDate ? formatDate(application.submissionDate) : "Not submitted"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proponent Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-md font-medium mb-3">Proponent Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{application.principalInvestigator || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{application.email || "No email provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
            
          {/* Primary Reviewer Information */}
          {application.reviewers && application.reviewers.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-md font-medium mb-3">Primary Reviewer Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">
                      {application.reviewers[0].name || "Pending"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-sm font-medium">
                      {application.reviewers[0].status || "Not assigned"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Assigned Date</p>
                    <p className="text-sm font-medium">
                      {application.reviewers[0].assignDate ? formatDate(application.reviewers[0].assignDate) : "Not assigned"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List */}
            {application.documents && application.documents.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-md font-medium mb-3">Documents</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {application.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {doc.title || "Untitled Document"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          <div className="flex space-x-2">
            {application.id && <AddCommentDialog applicationId={application.id} onCommentAdded={handleCommentAdded} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
} 