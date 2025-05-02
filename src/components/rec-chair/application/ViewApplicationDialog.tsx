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
import { Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ViewApplicationDialogProps } from "@/types/rec-chair";

export function ViewApplicationDialog({ application, onApplicationUpdated }: ViewApplicationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleCommentAdded = () => {
    if (onApplicationUpdated) {
      onApplicationUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Eye className="mr-2 h-4 w-4" />
          Quick View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{application.title}</DialogTitle>
          <DialogDescription>
            Submission Date: {formatDate(application.submissionDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardContent className="p-4 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">SPUP REC Code:</span>
                  <p className="font-medium">{application.spupRecCode || "Not Assigned"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div>
                    <Badge 
                      className={
                        application.status?.toLowerCase() === "approved" ? "bg-green-100 text-green-800" :
                        application.status?.toLowerCase() === "rejected" ? "bg-red-100 text-red-800" :
                        application.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-blue-100 text-blue-800"
                      }
                    >
                      {application.status || "Pending"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Principal Investigator:</span>
                  <p className="font-medium">{application.principalInvestigator}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Course/Program:</span>
                  <p className="font-medium">{application.courseProgram}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <p className="font-medium">{application.email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Research Type:</span>
                  <p className="font-medium">{application.researchType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-2">
            {application.id && <AddCommentDialog applicationId={application.id} onCommentAdded={handleCommentAdded} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 