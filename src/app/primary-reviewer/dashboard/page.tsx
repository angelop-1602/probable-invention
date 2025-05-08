'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReviewersService } from "@/lib/reviewers/reviewers.service";
import { Reviewer } from '@/types';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define types for the application data
interface Application {
  id: string;
  recCode: string;
  formToUse: string;
  submissionDate: string;
  status: string;
  assignment: any; // reviewer assignment details
}

export default function DashboardPage() {
  const [currentReviewer, setCurrentReviewer] = useState<Reviewer | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if reviewer is authenticated
    const reviewerCode = localStorage.getItem('reviewerCode');
    if (!reviewerCode) {
      router.push('/primary-reviewer');
      return;
    }

    // Fetch reviewer data
    const service = ReviewersService.getInstance();
    service.getReviewerByCode(reviewerCode).then(reviewer => {
      if (!reviewer) {
        localStorage.removeItem('reviewerCode');
        router.push('/primary-reviewer');
        return;
      }
      setCurrentReviewer(reviewer);
    });

    // Fetch assigned applications from Firestore
    const fetchApplications = async () => {
      setLoading(true);
      const appsCol = collection(db, 'protocolReviewApplications');
      const appsSnap = await getDocs(appsCol);
      const result: Application[] = [];
      for (const appDoc of appsSnap.docs) {
        const appId = appDoc.id;
        const appData = appDoc.data();
        // Check if reviewer is assigned in primaryReviewers subcollection
        const reviewerRef = doc(db, `protocolReviewApplications/${appId}/primaryReviewers/${reviewerCode}`);
        const reviewerSnap = await getDoc(reviewerRef);
        if (reviewerSnap.exists()) {
          const assignment = reviewerSnap.data();
          result.push({
            id: appId,
            recCode: appData.protocolDetails?.recCode || appData.recCode || appId,
            formToUse: assignment.reviewForm || '',
            submissionDate: appData.createdAt?.toDate?.().toISOString().slice(0, 10) || '',
            status: assignment.status || 'initial',
            assignment,
          });
        }
      }
      setApplications(result);
      setLoading(false);
    };
    fetchApplications();
  }, [router]);

  const tabStatusMap: Record<string, string[]> = {
    initial: ['initial'],
    resubmission: ['resubmission'],
    terminated: ['terminated'],
    submitted: ['submitted'],
    accepted: ['accepted'],
    completed: ['completed'],
    all: [] // all applications
  };

  const getApplicationsByStatus = (status: string) => {
    if (status === 'all') return applications;
    const allowed = tabStatusMap[status] || [];
    return applications.filter(app => allowed.includes(app.status));
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case 'initial':
      case 'resubmission':
      case 'terminated':
        return 'Review';
      case 'submitted':
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
      submitted: { variant: "secondary" },
      accepted: { variant: "success" },
      completed: { variant: "outline" }
    };

    return <Badge variant={variants[status]?.variant || "default"} className="capitalize">{status}</Badge>;
  };

  const handleSignOut = () => {
    localStorage.removeItem('reviewerCode');
    router.push('/primary-reviewer');
  };

  if (!currentReviewer) {
    return null; // or loading spinner
  }

  return (
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
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-lg">
                    {currentReviewer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{currentReviewer.name}</h2>
                  <p className="text-gray-500">{currentReviewer.department}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
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
                <TabsTrigger value="submitted">Submitted</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all" className="hidden md:block">All</TabsTrigger>
              </TabsList>

              {['initial', 'resubmission', 'terminated', 'submitted', 'accepted', 'completed', 'all'].map((tabValue) => (
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
                        {(tabValue === 'all' ? applications : getApplicationsByStatus(tabValue)).map((app) => (
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
                        {(tabValue === 'all' ? applications : getApplicationsByStatus(tabValue)).length === 0 && (
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
  );
}
