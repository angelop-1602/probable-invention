'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, User, ClipboardCheck, FileText, FileCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";
import ProtocolReviewForm from '@/components/primary-reviewer/forms/protocol-review-assesment-form';
import InformedConsentForm from '@/components/primary-reviewer/forms/informed-consent-assesment-form';
import ExemptionChecklistForm from '@/components/primary-reviewer/forms/exemption-checklist-form';
import IACUCForm from '@/components/primary-reviewer/forms/protcol-review-IACUC-form';
import { Separator } from '@/components/ui/separator';
import ProtocolFormPreview from '@/components/primary-reviewer/ProtocolFormPreview';
// Define types for the application data
interface Application {
  id: number;
  recCode: string;
  formToUse: string;
  submissionDate: string;
  status: string;
}

// Define types for reviewer data
interface Reviewer {
  code: string;
  name: string;
  department: string;
  avatarUrl?: string;
}

// Dummy reviewers data
const dummyReviewers: Reviewer[] = [
  { code: '123456', name: 'Dr. Maria Santos', department: 'Faculty of Medicine', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=maria' },
  { code: '789012', name: 'Dr. John Cruz', department: 'Faculty of Science', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=john' },
  { code: 'test', name: 'Dr. Ana Reyes', department: 'Faculty of Ethics', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ana' },
];

// Dummy data for application assignments
const dummyApplications: Application[] = [
  {
    id: 1,
    recCode: 'SPUP-REC-2023-001',
    formToUse: 'Full Review Form',
    submissionDate: '2023-10-15',
    status: 'initial',
  },
  {
    id: 2,
    recCode: 'SPUP-REC-2023-002',
    formToUse: 'Expedited Review Form',
    submissionDate: '2023-10-20',
    status: 'initial',
  },
  {
    id: 3,
    recCode: 'SPUP-REC-2023-003',
    formToUse: 'Full Review Form',
    submissionDate: '2023-09-28',
    status: 'resubmission',
  },
  {
    id: 4,
    recCode: 'SPUP-REC-2023-004',
    formToUse: 'Exemption Form',
    submissionDate: '2023-10-05',
    status: 'editable',
  },
  {
    id: 5,
    recCode: 'SPUP-REC-2023-005',
    formToUse: 'Full Review Form',
    submissionDate: '2023-09-18',
    status: 'accepted',
  },
  {
    id: 6,
    recCode: 'SPUP-REC-2023-006',
    formToUse: 'Expedited Review Form',
    submissionDate: '2023-09-10',
    status: 'completed',
  },
  {
    id: 7,
    recCode: 'SPUP-REC-2023-007',
    formToUse: 'Full Review Form',
    submissionDate: '2023-10-01',
    status: 'terminated',
  },
];

export default function PrimaryReviewerPage() {
  const [reviewerCode, setReviewerCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentReviewer, setCurrentReviewer] = useState<Reviewer | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Add states for modal form preview
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);
  const [previewFormType, setPreviewFormType] = useState<string | null>(null);
  
  // Function to open form preview
  const openFormPreview = (formType: string) => {
    setPreviewFormType(formType);
    setIsFormPreviewOpen(true);
  };

  // Function to close form preview
  const closeFormPreview = () => {
    setIsFormPreviewOpen(false);
    setPreviewFormType(null);
  };
  
  // Function to render the correct form based on type
  const renderFormPreview = () => {
    switch (previewFormType) {
      case 'protocol-review':
        return <ProtocolReviewForm />;
      
      case 'informed-consent':
        return <InformedConsentForm />;
      
      case 'exemption':
        return <ExemptionChecklistForm />;
      
      case 'iacuc':
        return <IACUCForm />;
      
      default:
        return <p>No form selected</p>;
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);

    // Find reviewer by code
    const reviewer = dummyReviewers.find(r => r.code === reviewerCode.trim());

    if (reviewer) {
      setCurrentReviewer(reviewer);
      setIsAuthenticated(true);
    } else {
      setAuthError('Invalid reviewer code. Please try again.');
    }
  };

  const getApplicationsByStatus = (status: string) => {
    return dummyApplications.filter(app => app.status === status);
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case 'initial':
      case 'resubmission':
      case 'terminated':
        return 'Review';
      case 'editable':
        return 'Edit';
      case 'accepted':
      case 'completed':
        return 'View';
      default:
        return 'Action';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      initial: { variant: "default" },
      resubmission: { variant: "outline" },
      terminated: { variant: "destructive" },
      editable: { variant: "secondary" },
      accepted: { variant: "success" },
      completed: { variant: "outline" }
    };

    return <Badge variant={variants[status]?.variant || "default"} className="capitalize">{status}</Badge>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Form Preview Modal */}
      <Dialog open={isFormPreviewOpen} onOpenChange={setIsFormPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="mt-4">
            {renderFormPreview()}
          </div>
        </DialogContent>
      </Dialog>

      {!isAuthenticated ? (
        <>
          {/* Hero Section */}
          <div className="relative bg-primary text-white">
            <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 relative z-10">
              <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6">
                  Primary Reviewer Portal
                </h1>
                <p className="max-w-3xl mx-auto text-xl text-primary-100 mb-10">
                  Access and manage your assigned research protocol reviews efficiently
                </p>
                {authError && (
                  <div className="text-white bg-red-500/80 py-2 px-4 rounded-md max-w-md mx-auto mb-6">
                    {authError}
                  </div>
                )}
                <div className="mt-10 sm:flex sm:justify-center">
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row items-center max-w-xl w-full mx-auto border-2 border-white rounded-lg overflow-hidden shadow-xl"
                  >
                    {/* Input: fills left side, no border or rounding of its own */}
                    <div className="relative flex-1 w-full">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        size={24}
                      />
                      <Input
                        type="text"
                        placeholder="Enter your reviewer code"
                        value={reviewerCode}
                        onChange={e => setReviewerCode(e.target.value)}
                        className="pl-12 h-16 w-full text-lg bg-white border-none focus:ring-0 rounded-none"
                      />
                    </div>


                    {/* Button: fills right side, no border or rounding of its own */}
                    <Button
                      type="submit"
                      className="w-full sm:w-auto h-16 px-8 text-lg font-medium bg-white text-primary hover:bg-gray-100 border-t-2 sm:border-t-0 sm:border-l-2 border-white focus:ring-0 rounded-none"
                    >
                      Access Reviews
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Information Section - Updated to focus on Primary Reviewers */}
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  Primary Reviewer Features
                </h2>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                  As a primary reviewer, you play a critical role in ensuring that research protocols meet ethical standards.
                </p>
              </div>

              <div className="mt-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                      <ClipboardCheck size={30} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Protocol Review Categories</h3>
                    <p className="text-base text-gray-500 text-center">
                      Easily navigate between initial reviews, resubmissions, terminations, and other categories in an organized tab interface.
                    </p>
                  </div>

                  <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                      <FileText size={30} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Review Form Access</h3>
                    <p className="text-base text-gray-500 text-center">
                      Complete the appropriate review form (Full, Expedited, or Exemption) based on the assigned protocol type.
                    </p>
                  </div>

                  <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                      <FileCheck size={30} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Document Review</h3>
                    <p className="text-base text-gray-500 text-center">
                      View submitted protocol documents alongside your review form with our convenient 80/20 split view layout.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Preview Section */}
         <ProtocolFormPreview />
        </>
      ) : (
        <div className="p-6 space-y-8">
          <header className="text-center">
            <h1 className="text-3xl font-bold text-primary-500 mb-2">Primary Reviewer Portal</h1>
            <p className="text-gray-600">Review and manage assigned protocol applications</p>
          </header>

          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Reviewer info */}
            <Card className="shadow-sm bg-white/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary-100">
                      <AvatarImage src={currentReviewer?.avatarUrl} />
                      <AvatarFallback className="bg-primary-100 text-primary-700 text-lg">
                        {currentReviewer?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{currentReviewer?.name}</h2>
                      <p className="text-gray-500">{currentReviewer?.department}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setIsAuthenticated(false);
                    setReviewerCode('');
                    setCurrentReviewer(null);
                  }}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Application tabs */}
            <Card className="shadow-md">
              <CardContent className="p-6">
                <Tabs defaultValue="initial">
                  <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-6">
                    <TabsTrigger value="initial">Initial</TabsTrigger>
                    <TabsTrigger value="resubmission">Resubmission</TabsTrigger>
                    <TabsTrigger value="terminated">Termination</TabsTrigger>
                    <TabsTrigger value="editable">Editable</TabsTrigger>
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="all" className="hidden md:block">All</TabsTrigger>
                  </TabsList>

                  {['initial', 'resubmission', 'terminated', 'editable', 'accepted', 'completed', 'all'].map((tabValue) => (
                    <TabsContent key={tabValue} value={tabValue} className="mt-2">
                      <h2 className="text-xl font-semibold mb-4 capitalize">
                        {tabValue === 'all' ? 'All Applications' : `${tabValue} Applications`}
                      </h2>
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">SPUP REC Code</TableHead>
                              <TableHead className="hidden md:table-cell">Form to Use</TableHead>
                              <TableHead>Submission Date</TableHead>
                              <TableHead className="hidden md:table-cell">Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(tabValue === 'all' ? dummyApplications : getApplicationsByStatus(tabValue)).map((app) => (
                              <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.recCode}</TableCell>
                                <TableCell className="hidden md:table-cell">{app.formToUse}</TableCell>
                                <TableCell>{app.submissionDate}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {getStatusBadge(app.status)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant={app.status === 'initial' || app.status === 'resubmission' ? "default" : "outline"}
                                    className="hover:bg-primary-50 text-primary-700 font-medium"
                                    size="sm"
                                  >
                                    {getActionLabel(app.status)}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {(tabValue === 'all' ? dummyApplications : getApplicationsByStatus(tabValue)).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                                  No applications found in this category
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">SPUP Research Ethics Committee</h3>
              <p className="text-gray-400 text-sm">
                Primary reviewers are integral to the ethical review process, providing expert assessment of research protocols.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Primary Reviewer Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Reviewer Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ethics Framework</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Form Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact REC Office</h3>
              <address className="text-gray-400 text-sm not-italic">
                St. Paul University Philippines<br />
                Mabini St., Tuguegarao City<br />
                Cagayan, Philippines 3500<br /><br />
                Email: rec@spup.edu.ph<br />
                Phone: +63 (078) 123-4567
              </address>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} St. Paul University Philippines Research Ethics Committee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
