import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, FundingSource, ResearchType } from "@/types/protocol-application/tracking";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mapping for funding source display
const fundingText: Record<FundingSource, string> = {
  "R": "Researcher-funded",
  "I": "Institution-funded",
  "A": "Agency other than institution",
  "D": "Pharmaceutical companies",
  "O": "Others"
};

// Mapping for research type display
const researchTypeText: Record<ResearchType, string> = {
  "EX": "Experimental Research",
  "SR": "Social/Behavioral Research"
};

// Helper functions
const getFundingText = (funding: FundingSource): string => {
  return fundingText[funding] || "Unknown";
};

const getResearchTypeText = (type: ResearchType): string => {
  return researchTypeText[type] || "Unknown";
};

interface ApplicationDetailsProps {
  application: Application;
}

export const ApplicationDetails = ({ application }: ApplicationDetailsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedApplication, setEditedApplication] = useState({ ...application });

  const handleEditClick = () => {
    setEditedApplication({ ...application });
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedApplication(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = () => {
    // In a real implementation, this would call an API to update the application
    // For now we just close the dialog
    setIsEditDialogOpen(false);
    // To implement: Update application data in Firestore
  };

  // Format submission date for display
  const formattedSubmissionDate = application.submissionDate 
    ? new Date(application.submissionDate).toLocaleDateString() 
    : "N/A";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Protocol Review Application Information</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEditClick} 
            className="h-8 w-8 p-0"
          >
            <PenSquare className="h-4 w-4" />
          </Button>
        </CardHeader>
        <Separator />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Application Code</h3>
              <p className="font-medium">{application.applicationCode}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">SPUP REC Code</h3>
              <p className="font-medium">{application.spupRecCode || "Not yet assigned"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Principal Investigator</h3>
              <p>{application.principalInvestigator}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Submission Date</h3>
              <p>{formattedSubmissionDate}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-gray-500">Research Title</h3>
              <p>{application.researchTitle}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Adviser</h3>
              <p>{application.adviser}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Course/Program</h3>
              <p>{application.courseProgram}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Email Address</h3>
              <p>{application.emailAddress}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Type of Research</h3>
              <p>{getResearchTypeText(application.typeOfResearch)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500">Funding</h3>
              <p>{getFundingText(application.funding)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Protocol Information</DialogTitle>
            <DialogDescription>
              Update the information about your research protocol.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="principalInvestigator">Principal Investigator</Label>
              <Input
                id="principalInvestigator"
                name="principalInvestigator"
                value={editedApplication.principalInvestigator}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="adviser">Adviser</Label>
              <Input
                id="adviser"
                name="adviser"
                value={editedApplication.adviser}
                onChange={handleInputChange}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="researchTitle">Research Title</Label>
              <Input
                id="researchTitle"
                name="researchTitle"
                value={editedApplication.researchTitle}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="courseProgram">Course/Program</Label>
              <Input
                id="courseProgram"
                name="courseProgram"
                value={editedApplication.courseProgram}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input
                id="emailAddress"
                name="emailAddress"
                type="email"
                value={editedApplication.emailAddress}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 