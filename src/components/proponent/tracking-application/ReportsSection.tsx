'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCheck, Upload, Archive, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReportsSectionProps {
  progressReports: Array<{
    reportDate: Date;
    formUrl: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  finalReport?: {
    submittedDate: Date;
    formUrl: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  archiving?: {
    date: Date;
    notificationUrl: string;
  };
  onSubmitProgressReport: () => void;
  onSubmitFinalReport: () => void;
  isApproved: boolean; // Whether the protocol is approved and can accept progress reports
  isCompleted: boolean; // Whether all research activities are completed
}

export function ReportsSection({
  progressReports,
  finalReport,
  archiving,
  onSubmitProgressReport,
  onSubmitFinalReport,
  isApproved,
  isCompleted
}: ReportsSectionProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'final' | 'archive'>('progress');

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-4 h-4 mr-1" /> Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="w-4 h-4 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="w-4 h-4 mr-1" /> Needs Revision</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Research Reports</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'progress' ? 'default' : 'outline'}
              onClick={() => setActiveTab('progress')}
              size="sm"
            >
              Progress Reports
            </Button>
            <Button
              variant={activeTab === 'final' ? 'default' : 'outline'}
              onClick={() => setActiveTab('final')}
              size="sm"
            >
              Final Report
            </Button>
            <Button
              variant={activeTab === 'archive' ? 'default' : 'outline'}
              onClick={() => setActiveTab('archive')}
              size="sm"
            >
              Archive
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'progress' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Progress Reports</h3>
              {isApproved && !isCompleted && (
                <Button onClick={onSubmitProgressReport}>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Progress Report
                </Button>
              )}
            </div>
            {progressReports.length > 0 ? (
              <div className="space-y-3">
                {progressReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Progress Report #{index + 1}</p>
                      <p className="text-sm text-gray-500">
                        Submitted on {report.reportDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(report.status)}
                      <Button variant="outline" size="sm" asChild>
                        <a href={report.formUrl} target="_blank" rel="noopener noreferrer">
                          <FileCheck className="w-4 h-4 mr-2" />
                          View Report
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No progress reports submitted yet.</p>
            )}
          </div>
        )}

        {activeTab === 'final' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Final Report</h3>
              {isApproved && !finalReport && (
                <Button onClick={onSubmitFinalReport}>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Final Report
                </Button>
              )}
            </div>
            {finalReport ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Final Research Report</p>
                    <p className="text-sm text-gray-500">
                      Submitted on {finalReport.submittedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(finalReport.status)}
                    <Button variant="outline" size="sm" asChild>
                      <a href={finalReport.formUrl} target="_blank" rel="noopener noreferrer">
                        <FileCheck className="w-4 h-4 mr-2" />
                        View Report
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No final report submitted yet.</p>
            )}
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Archive Status</h3>
            {archiving ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Protocol Archived</p>
                    <p className="text-sm text-gray-500">
                      Archived on {archiving.date.toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={archiving.notificationUrl} target="_blank" rel="noopener noreferrer">
                      <Archive className="w-4 h-4 mr-2" />
                      View Archive Notification
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {finalReport?.status === 'approved' 
                  ? 'Waiting for archive notification from REC Chair'
                  : 'Protocol will be archived after final report approval'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 