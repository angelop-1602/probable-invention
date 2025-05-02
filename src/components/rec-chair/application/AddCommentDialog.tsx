"use client";

import { useState } from "react";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus } from "lucide-react";

interface AddCommentDialogProps {
  applicationId: string;
  onCommentAdded?: () => void;
}

export function AddCommentDialog({ applicationId, onCommentAdded }: AddCommentDialogProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!comment.trim() || !applicationId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationRef = doc(db, "protocolReviewApplications", applicationId);
      
      // Create a comment object with a unique ID and timestamp
      const newComment = {
        id: `comment-${Date.now()}`,
        user: "REC Chair", // For now, hardcoded as REC Chair
        text: comment.trim(),
        timestamp: serverTimestamp()
      };
      
      // Add the comment to the comments array using arrayUnion
      await updateDoc(applicationRef, {
        comments: arrayUnion(newComment)
      });
      
      // Reset form and close dialog
      setComment("");
      setOpen(false);
      
      // Notify parent component if callback is provided
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Add Comment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogDescription>
            Add a comment to this protocol application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting || !comment.trim()} onClick={handleAddComment}>
            {isSubmitting ? "Adding..." : "Add Comment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 