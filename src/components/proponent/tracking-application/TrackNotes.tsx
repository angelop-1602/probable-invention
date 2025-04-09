import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Application } from "@/types/protocol-application/tracking";
import { PlusCircle } from "lucide-react";

interface TrackNotesProps {
  application: Application;
}

export const TrackNotes = ({ application }: TrackNotesProps) => {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  // In a real implementation, you'd fetch these from Firebase
  const [notes, setNotes] = useState<Array<{id: number; date: string; text: string}>>([
    {
      id: 1,
      date: new Date(application.submissionDate).toLocaleDateString(),
      text: "Initial submission received and assigned for screening."
    },
    // Conditionally add review note if in review or further
    ...(application.progress !== 'SC' ? [{
      id: 2,
      date: application.initialReview.date 
        ? new Date(application.initialReview.date).toLocaleDateString() 
        : new Date().toLocaleDateString(),
      text: "Application passed screening and forwarded to reviewers."
    }] : [])
  ]);
  
  // Function to add a new note - in a real implementation, this would save to Firebase
  const addNote = (text: string) => {
    const newNote = {
      id: notes.length + 1,
      date: new Date().toISOString().split('T')[0],
      text
    };
    
    setNotes([...notes, newNote]);
    setIsAddNoteOpen(false);
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
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notes yet. Add a note to track important events or communications.
          </p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-muted-foreground">{note.date}</p>
                </div>
                <p className="text-sm">{note.text}</p>
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
    </Card>
  );
}; 