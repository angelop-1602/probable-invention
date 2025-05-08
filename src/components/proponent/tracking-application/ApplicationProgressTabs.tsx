import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Download, Upload, Plus, Trash2, XCircle, FileText } from "lucide-react";
import { Application } from "@/types/protocol-application/tracking";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApplicationProgressTabsProps {
  application: Application;
}

export const ApplicationProgressTabs = ({ application }: ApplicationProgressTabsProps) => {
  const [resubmissionDocs, setResubmissionDocs] = useState<string[]>(['']);
  const [progressReportDocs, setProgressReportDocs] = useState<string[]>(['']);
  const [finalReportDocs, setFinalReportDocs] = useState<string[]>(['']);
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({});

  const addDocumentField = (type: 'resubmission' | 'progress' | 'final') => {
    if (type === 'resubmission') {
      setResubmissionDocs([...resubmissionDocs, '']);
    } else if (type === 'progress') {
      setProgressReportDocs([...progressReportDocs, '']);
    } else if (type === 'final') {
      setFinalReportDocs([...finalReportDocs, '']);
    }
  };

  const removeDocumentField = (type: 'resubmission' | 'progress' | 'final', index: number) => {
    if (type === 'resubmission') {
      const newDocs = [...resubmissionDocs];
      newDocs.splice(index, 1);
      setResubmissionDocs(newDocs);
    } else if (type === 'progress') {
      const newDocs = [...progressReportDocs];
      newDocs.splice(index, 1);
      setProgressReportDocs(newDocs);
    } else if (type === 'final') {
      const newDocs = [...finalReportDocs];
      newDocs.splice(index, 1);
      setFinalReportDocs(newDocs);
    }
  };

  const validateFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const newErrors = { ...fileErrors };
    newErrors[fieldId] = null;
    setFileErrors(newErrors);

    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        newErrors[fieldId] = "Only PDF files are accepted. Please upload a PDF document.";
        setFileErrors(newErrors);
        e.target.value = ""; // Clear the input
      }
    }
  };

  const ResubmissionTab = ({ application }: { application: Application }) => {
    // For resubmission and subsequent statuses, we show information from the resubmission tab
    if (application.progress !== "RS" && application.progress !== "AP" && 
        application.progress !== "PR" && application.progress !== "FR" && 
        application.progress !== "AR") {
      return <p className="text-gray-500 italic p-4">No resubmission information yet.</p>;
    }

    // If there is resubmission history, display it along with documents
    const hasResubmissionHistory = application.resubmission.history && application.resubmission.history.length > 0;
    const documentsWithResubmissionVersions = application.documents.filter(doc => doc.resubmissionVersion);

    return (
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-lg font-medium">Resubmission Information</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date of Resubmission</p>
              <p className="font-medium">{application.resubmission.date ? new Date(application.resubmission.date).toLocaleDateString() : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Number of Resubmissions</p>
              <p className="font-medium">{application.resubmission.count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{application.resubmission.status || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Decision</p>
              <p className="font-medium">{application.resubmission.decision || "Pending"}</p>
            </div>
          </div>
        </div>

        {hasResubmissionHistory && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3">Resubmission History</h3>
            <div className="space-y-4">
              {application.resubmission.history?.map((historyItem, index) => {
                // Find documents that belong to this resubmission version
                const resubmissionNumber = index + 1;
                const resubmissionDocuments = application.documents.filter(
                  doc => doc.resubmissionVersion === resubmissionNumber
                );
                
                return (
                  <div key={index} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">Resubmission #{resubmissionNumber}</h4>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {historyItem.date ? new Date(historyItem.date).toLocaleDateString() : ""}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        historyItem.decision === "Approved" ? "bg-green-100 text-green-800" :
                        historyItem.decision === "Further Revisions Needed" ? "bg-amber-100 text-amber-800" :
                        historyItem.decision === "Minor Modifications Required" ? "bg-amber-100 text-amber-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {historyItem.decision || historyItem.status}
                      </span>
                    </div>
                    
                    {historyItem.feedback && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Feedback:</p>
                        <p className="text-sm bg-white p-3 border rounded-md">{historyItem.feedback}</p>
                      </div>
                    )}
                    
                    {resubmissionDocuments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 mb-2">Documents Submitted:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {resubmissionDocuments.map((doc, docIndex) => (
                            <div key={docIndex} className="text-xs flex items-center gap-1 bg-white p-2 border rounded-md">
                              <FileText className="h-3 w-3 text-gray-500" />
                              <span>{doc.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {!hasResubmissionHistory && documentsWithResubmissionVersions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3">Resubmitted Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentsWithResubmissionVersions.map((doc, index) => (
                <div key={index} className="flex items-center gap-2 border rounded-md p-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        Resubmission #{doc.resubmissionVersion}
                      </span>
                      <span className="text-xs text-gray-500">{doc.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Progress Details</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent>
        <Tabs defaultValue="initial-review">
          <TabsList className="grid grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="initial-review">Initial Review</TabsTrigger>
            <TabsTrigger value="resubmission">Resubmission</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
            <TabsTrigger value="progress-report" className="hidden md:flex">Progress Report</TabsTrigger>
            <TabsTrigger value="final-report" className="hidden md:flex">Final Report</TabsTrigger>
          </TabsList>

          {/* Initial Review Tab */}
          <TabsContent value="initial-review">
            <div className="space-y-4 p-4">
              <h3 className="font-semibold">Initial Review Status</h3>
              {application.initialReview?.date ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Review Date</h4>
                      <p>{application.initialReview?.date ? new Date(application.initialReview.date).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Decision</h4>
                      <p>{application.initialReview?.decision || "N/A"}</p>
                    </div>
                  </div>
                  
                  {/* Display reviewer feedback if available */}
                  {application.initialReview?.feedback && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Reviewer Feedback</h4>
                      <div className="mt-2 p-4 bg-gray-50 border rounded-md">
                        <p className="text-sm">{application.initialReview.feedback}</p>
                      </div>
                    </div>
                  )}
                  
                  {application.initialReview?.decision === "Minor Modifications Required" && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <h4 className="font-medium flex items-center text-amber-700">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Action Required
                      </h4>
                      <p className="text-sm mt-1">
                        Your application requires minor modifications. Please check your email for detailed feedback from the reviewers. 
                        After making the necessary changes, submit your revised documents using the Resubmission tab.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">
                  Your application is currently being reviewed. Initial review details will appear here once completed.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Resubmission Tab */}
          <TabsContent value="resubmission">
            <ResubmissionTab application={application} />
          </TabsContent>

          {/* Approval Tab */}
          <TabsContent value="approval">
            <div className="space-y-4 p-4">
              <h3 className="font-semibold">Approval Status</h3>
              {application.approved?.date ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Approval Date</h4>
                      <p>{application.approved?.date ? new Date(application.approved.date).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="font-medium flex items-center text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Your Protocol Has Been Approved
                    </h4>
                    <p className="text-sm mt-1">
                      Congratulations! Your protocol has been approved. You can download your Certificate of Approval below. 
                      Please remember to submit progress reports as required.
                    </p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" disabled={!application.approved?.certificateUrl}>
                        <Download className="h-4 w-4 mr-2" /> Download Certificate of Approval
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  Your application is not yet approved. This section will be updated once approval is granted.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Progress Report Tab */}
          <TabsContent value="progress-report">
            <div className="space-y-4 p-4">
              <h3 className="font-semibold">Progress Report</h3>
              {application.progressReport?.date ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Submission Date</h4>
                    <p>{application.progressReport?.date ? new Date(application.progressReport.date).toLocaleDateString() : "N/A"}</p>
                  </div>
                  {application.progressReport?.submissionCount && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Submissions Count</h4>
                      <p>{application.progressReport.submissionCount}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <p>Submitted</p>
                  </div>
                  {application.progressReport?.lastReportUrl && (
                    <div className="md:col-span-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(application.progressReport.lastReportUrl)}>
                        <Download className="h-4 w-4 mr-2" /> Download Last Progress Report
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    After your protocol is approved, you'll need to submit periodic progress reports.
                  </p>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Progress Report Submission</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Form 09B: Progress Report Form</label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={!application.approved?.date}>
                            <Download className="h-4 w-4 mr-2" /> Download Template
                          </Button>
                          <Input 
                            type="file" 
                            id="progress-report-form" 
                            className="max-w-xs" 
                            disabled={!application.approved?.date} 
                            accept=".pdf"
                            onChange={(e) => validateFileUpload(e, "progress-report-form")}
                          />
                        </div>
                        {fileErrors["progress-report-form"] && (
                          <Alert variant="destructive" className="mt-2">
                            <XCircle className="h-4 w-4 mr-2" />
                            <AlertDescription>
                              {fileErrors["progress-report-form"]}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Supporting Documents</h4>
                        <div id="progress-documents-container">
                          {progressReportDocs.map((_, index) => (
                            <div key={`progress-doc-${index}`} className="flex items-center gap-2 mb-3">
                              <Input 
                                type="file" 
                                className="max-w-xs" 
                                disabled={!application.approved?.date} 
                                accept=".pdf"
                                id={`progress-doc-${index}`}
                                onChange={(e) => validateFileUpload(e, `progress-doc-${index}`)}
                              />
                              {index === progressReportDocs.length - 1 ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={!application.approved?.date}
                                  onClick={() => addDocumentField('progress')}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={!application.approved?.date}
                                  onClick={() => removeDocumentField('progress', index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {progressReportDocs.map((_, index) => (
                            fileErrors[`progress-doc-${index}`] && (
                              <Alert key={`progress-doc-error-${index}`} variant="destructive" className="mt-2 mb-2">
                                <XCircle className="h-4 w-4 mr-2" />
                                <AlertDescription>
                                  {fileErrors[`progress-doc-${index}`]}
                                </AlertDescription>
                              </Alert>
                            )
                          ))}
                        </div>
                      </div>
                      
                      <Button disabled={!application.approved?.date}>
                        <Upload className="h-4 w-4 mr-2" /> Submit Progress Report
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Final Report Tab */}
          <TabsContent value="final-report">
            <div className="space-y-4 p-4">
              <h3 className="font-semibold">Final Report</h3>
              {application.finalReport?.date ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Submission Date</h4>
                    <p>{application.finalReport?.date ? new Date(application.finalReport.date).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <p>Submitted</p>
                  </div>
                  {application.finalReport?.reportUrl && (
                    <div className="md:col-span-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(application.finalReport.reportUrl)}>
                        <Download className="h-4 w-4 mr-2" /> Download Final Report
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    When your study is complete, you'll need to submit a final report.
                  </p>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Final Report Submission</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Form 14A: Final Report Form</label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={!application.approved?.date}>
                            <Download className="h-4 w-4 mr-2" /> Download Template
                          </Button>
                          <Input 
                            type="file" 
                            id="final-report-form" 
                            className="max-w-xs" 
                            disabled={!application.approved?.date} 
                            accept=".pdf"
                            onChange={(e) => validateFileUpload(e, "final-report-form")}
                          />
                        </div>
                        {fileErrors["final-report-form"] && (
                          <Alert variant="destructive" className="mt-2">
                            <XCircle className="h-4 w-4 mr-2" />
                            <AlertDescription>
                              {fileErrors["final-report-form"]}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Supporting Documents</h4>
                        <div id="final-report-documents-container">
                          {finalReportDocs.map((_, index) => (
                            <div key={`final-doc-${index}`} className="flex items-center gap-2 mb-3">
                              <Input 
                                type="file" 
                                className="max-w-xs" 
                                disabled={!application.approved?.date} 
                                accept=".pdf"
                                id={`final-doc-${index}`}
                                onChange={(e) => validateFileUpload(e, `final-doc-${index}`)}
                              />
                              {index === finalReportDocs.length - 1 ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={!application.approved?.date}
                                  onClick={() => addDocumentField('final')}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={!application.approved?.date}
                                  onClick={() => removeDocumentField('final', index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {finalReportDocs.map((_, index) => (
                            fileErrors[`final-doc-${index}`] && (
                              <Alert key={`final-doc-error-${index}`} variant="destructive" className="mt-2 mb-2">
                                <XCircle className="h-4 w-4 mr-2" />
                                <AlertDescription>
                                  {fileErrors[`final-doc-${index}`]}
                                </AlertDescription>
                              </Alert>
                            )
                          ))}
                        </div>
                      </div>
                      
                      <Button disabled={!application.approved?.date}>
                        <Upload className="h-4 w-4 mr-2" /> Submit Final Report
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 