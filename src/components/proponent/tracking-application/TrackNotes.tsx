import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Application } from "@/types/protocol-application/tracking";
import { PlusCircle, MessageCircle, ExternalLink } from "lucide-react";

interface TrackNotesProps {
  application: Application;
}

// Add an interface for comments
interface Comment {
  date: any;
  text: string;
  author?: string;
}

interface NoteItem {
  id: string;
  date: string;
  text: string;
  author?: string;
  type: "system" | "comment";
}

export const TrackNotes = ({ application }: TrackNotesProps) => {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<NoteItem | null>(null);
  
  // Get application status and progress for context
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'OR': 'On-going Review',
      'A': 'Approved',
      'C': 'Completed',
      'T': 'Terminated'
    };
    return statusMap[status] || status;
  };
  
  const getProgressText = (progress: string) => {
    const progressMap: Record<string, string> = {
      'SC': 'Submission Check',
      'IR': 'Initial Review',
      'RS': 'Resubmission',
      'AP': 'Approved',
      'PR': 'Progress Report',
      'FR': 'Final Report',
      'AR': 'Archived'
    };
    return progressMap[progress] || progress;
  };
  
  // Combine system notes with application comments
  const allNotes: NoteItem[] = [
    // System-generated notes based on application status
    {
      id: 'system-1',
      date: new Date(application.submissionDate).toLocaleDateString(),
      text: "Application submitted for review.",
      type: "system"
    },
    // Add initial review note if applicable
    ...(application.initialReview.date ? [{
      id: 'system-2',
      date: new Date(application.initialReview.date).toLocaleDateString(),
      text: `Application moved to ${getProgressText(application.progress)} stage.`,
      type: "system"
    }] : []),
    // Add approval note if applicable
    ...(application.approved.date ? [{
      id: 'system-3',
      date: new Date(application.approved.date).toLocaleDateString(),
      text: "Application has been approved.",
      type: "system"
    }] : []),
    
    // Use type assertion for application.comments
    // Add actual comments from REC Chair if available
    ...((application as any).comments || []).map((comment: Comment, index: number) => ({
      id: `comment-${index}`,
      date: comment.date ? new Date(
        typeof comment.date === 'object' && comment.date.seconds 
          ? comment.date.seconds * 1000 
          : comment.date
      ).toLocaleDateString() : 'Unknown date',
      text: comment.text || '',
      author: comment.author || 'REC Chair',
      type: "comment" as const
    }))
  ];
  
  // Sort notes by date (newest first)
  const sortedNotes = [...allNotes].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Reverse order (newest first)
  });

  // Function to add a new note - in a real implementation, this would save to Firebase
  const addNote = (text: string) => {
    // This would be implemented in a real application to save to Firebase
    setIsAddNoteOpen(false);
  };

  // Function to get truncated text with ellipsis for long comments
  const getTruncatedText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to handle viewing a full comment
  const handleViewComment = (note: NoteItem) => {
    setSelectedComment(note);
    setIsCommentDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notes & Updates</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsAddNoteOpen(true)}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        {sortedNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notes or comments yet.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedNotes.map((note) => (
              <div key={note.id} className={`border-b pb-3 last:border-b-0 last:pb-0 ${
                note.type === "comment" ? "bg-blue-50 p-3 rounded-md" : ""
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-muted-foreground">{note.date}</p>
                  {note.type === "comment" && note.author && (
                    <div className="flex items-center text-xs text-blue-600">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {note.author}
                    </div>
                  )}
                </div>
                <p className="text-sm">
                  {note.type === "comment" && note.text.length > 100 ? (
                    <>
                      {getTruncatedText(note.text)}
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="px-0 h-auto text-xs ml-1"
                        onClick={() => handleViewComment(note)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Full Comment
                      </Button>
                    </>
                  ) : note.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Note Text</label>
            <textarea 
              className="w-full h-24 p-2 border rounded-md" 
              placeholder="Enter your note here..."
              id="note-text"
            ></textarea>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              const textElem = document.getElementById('note-text') as HTMLTextAreaElement;
              if (textElem && textElem.value.trim()) {
                addNote(textElem.value);
              }
            }}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comments from {selectedComment?.author || 'REC Chair'}</DialogTitle>
            <DialogDescription>
              {selectedComment?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm whitespace-pre-wrap">
              {selectedComment?.text}
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCommentDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 