'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  UserPlus, 
  FileText, 
  Search, 
  UserCheck, 
  MessageSquare, 
  CheckCircle, 
  BarChart3, 
  Archive,
  ChevronRight, 
  ChevronDown,
  Download,
  AlertCircle,
  Clock
} from 'lucide-react';

export function ProcessTracker() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const submissionSteps = [
    {
      step: 1,
      title: 'Create Your REC Proponent Account',
      description: 'Register and create an account to submit protocols, upload documents, and track your submission status.',
      icon: <UserPlus className="h-5 w-5" />,
      phase: "Registration",
      features: [
        'Submit your protocol application',
        'Upload required documents',
        'Track submission status',
        'Receive REC notifications and feedback'
      ],
      documents: []
    },
    {
      step: 2,
      title: 'Submit Your Research Protocol for Review',
      description: 'Complete your application and upload all required documents in PDF format.',
      icon: <FileText className="h-5 w-5" />,
      phase: "Submission",
      features: [
        'Click "New Protocol Submission"',
        'Complete the application form',
        'Upload all required documents',
        'Pay ethics review fee (₱1,650.00)'
      ],
      documents: [
        { name: 'Form 07A – Protocol Review Application', required: true },
        { name: 'Form 07B – Adviser\'s Certification', required: true },
        { name: 'Research Proposal or Study Protocol', required: true },
        { name: 'Abstract', required: true },
        { name: 'Form 07C – Informed Consent Form', required: true },
        { name: 'Minutes of Proposal Defense', required: true },
        { name: 'Curriculum Vitae of all researchers', required: true },
        { name: 'Questionnaire or Data Collection Tools', required: true },
        { name: 'Proof of Payment (₱1,650.00)', required: true },
        { name: 'Technical Review Approval', required: false }
      ]
    },
    {
      step: 3,
      title: 'Screening and Classification',
      description: 'REC Secretariat checks documents and classifies your protocol for appropriate review type.',
      icon: <Search className="h-5 w-5" />,
      phase: "Classification",
      features: [
        'Document completeness check',
        'Protocol classification',
        'Review type determination'
      ],
      reviewTypes: [
        { type: 'Exempt from Review', action: 'Complete Form 04A – Checklist for Exemption' },
        { type: 'Expedited Review', action: 'Assigned to qualified reviewer' },
        { type: 'Full Board Review', action: 'Reviewed by full committee' }
      ],
      documents: [
        { name: 'Form 04A – Checklist for Exemption', required: false },
        { name: 'Form 04B – Certificate of Exemption', required: false }
      ]
    },
    {
      step: 4,
      title: 'Assigned for Review',
      description: 'Primary Reviewer assigned to assess scientific design, participant safety, and ethical safeguards.',
      icon: <UserCheck className="h-5 w-5" />,
      phase: "Assignment",
      features: [
        'Primary Reviewer assignment',
        'Scientific design assessment',
        'Participant safety evaluation',
        'Informed consent review',
        'Confidentiality and ethical safeguards check'
      ],
      documents: []
    },
    {
      step: 5,
      title: 'Respond to Comments (If Needed)',
      description: 'Address reviewer feedback and submit revised documents with highlighted changes.',
      icon: <MessageSquare className="h-5 w-5" />,
      phase: "Revision",
      features: [
        'Receive feedback via dashboard',
        'Submit revised documents',
        'Highlight changes (bold and underlined)',
        'Indicate page and line numbers'
      ],
      documents: [
        { name: 'Form 08A – Protocol Resubmission Form', required: true },
        { name: 'Revised documents with changes highlighted', required: true }
      ]
    },
    {
      step: 6,
      title: 'Receive Approval',
      description: 'Get your Certificate of Approval and proceed with research implementation.',
      icon: <CheckCircle className="h-5 w-5" />,
      phase: "Approval",
      features: [
        'Certificate of Approval issued',
        'Permission to implement research',
        'Study officially approved'
      ],
      documents: [
        { name: 'Form 08C – Certificate of Approval', required: false }
      ]
    },
    {
      step: 7,
      title: 'Submit Progress Reports and Amendments',
      description: 'Maintain compliance through regular reporting and submit amendments as needed.',
      icon: <BarChart3 className="h-5 w-5" />,
      phase: "Monitoring",
      features: [
        'Submit progress reports per schedule',
        'Report protocol amendments',
        'Document deviations/violations',
        'Report negative events within 3 days'
      ],
      documents: [
        { name: 'Form 09B – Progress Report Form', required: true },
        { name: 'Form 10 – Protocol Amendment Form', required: false },
        { name: 'Form 11 – Protocol Deviation/Violation Form', required: false },
        { name: 'Form 12 – Reportable Negative Event Form', required: false },
        { name: 'Form 09A – Reminder Letter', required: false }
      ]
    },
    {
      step: 8,
      title: 'Submit Final Report or Early Termination',
      description: 'Complete your study with final reporting or document early termination.',
      icon: <Archive className="h-5 w-5" />,
      phase: "Closure",
      features: [
        'Submit final report upon completion',
        'Receive archiving notification',
        'Protocol marked as "Closed"',
        'Early termination option available'
      ],
      documents: [
        { name: 'Form 14A – Final Report Form', required: true },
        { name: 'Form 14B – Archiving Notification', required: false },
        { name: 'Form 15 – Early Study Termination Report', required: false }
      ]
    }
  ];

  const handleStepClick = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  return (
    <section id="process" className="py-12 sm:py-16 bg-spup-light-gray">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-montserrat font-bold text-2xl sm:text-3xl md:text-4xl text-spup-green mb-4">
            Research Ethics Review Process
          </h2>
          <p className="text-base sm:text-lg text-spup-dark-gray max-w-3xl mx-auto">
            Follow these eight steps to obtain ethical clearance for your research from SPUP REC
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {submissionSteps.map((step, index) => (
              <div key={step.step}>
                <Card className="shadow-md border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden py-0 ">
                  <CardContent className="p-0">
                    <div 
                      className="flex items-center justify-between cursor-pointer p-6 hover:bg-gray-50 transition-colors"
                      onClick={() => handleStepClick(step.step)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                          {step.step}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-opacity-20 text-spup-green rounded flex items-center justify-center">
                            {step.icon}
                          </div>
                          <div>
                            <Badge variant="outline" className="text-xs mb-1 bg-opacity-20 text-spup-green border-spup-green">
                              {step.phase}
                            </Badge>
                            <h3 className="font-semibold text-lg text-spup-dark-gray">{step.title}</h3>
                            <p className="text-gray-400 text-sm italic">{step.description}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-spup-green border-spup-green hover:bg-spup-green hover:text-white transition-colors">
                          {expandedStep === step.step ? 'Less Info' : 'More Info'}
                          {expandedStep === step.step ? 
                            <ChevronDown className="ml-1 h-4 w-4" /> : 
                            <ChevronRight className="ml-1 h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>
                   

                    {expandedStep === step.step && (
                      <div className="border-t border-gray-200 bg-gray-50 animate-fade-in">
                        <div className="p-6">
                          <div className="mb-6">
                            <h4 className="font-semibold text-lg text-spup-green mb-3 flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Key Requirements:
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {step.features.map((feature, featureIndex) => (
                                <div key={featureIndex} className="flex items-start space-x-3 bg-white p-3 rounded border border-gray-200">
                                  <div className="w-2 h-2 bg-spup-green rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-spup-dark-gray text-sm">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {step.reviewTypes && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-lg text-spup-green mb-3 flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                Review Types:
                              </h4>
                              <div className="space-y-3">
                                {step.reviewTypes.map((reviewType, typeIndex) => (
                                  <div key={typeIndex} className="bg-spup-yellow bg-opacity-10 border-l-4 border-spup-green p-4 rounded-r">
                                    <div className="font-medium text-spup-dark-gray mb-1">{reviewType.type}</div>
                                    <div className="text-sm text-gray-600">{reviewType.action}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Special Sign In Button for Step 1 */}
                          {step.step === 1 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-lg text-spup-green mb-3 flex items-center">
                                <UserPlus className="h-5 w-5 mr-2" />
                                Get Started:
                              </h4>
                              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r">
                                <p className="text-spup-dark-gray mb-4">
                                  Ready to submit your research protocol? Create your proponent account to get started with the submission process.
                                </p>
                                <Link href="/auth/sign-in">
                                  <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Create Account / Sign In
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          )}

                          {step.documents.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-lg text-spup-green mb-3 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                {step.step === 2 ? 'Protocol Review Application Documents' : 'Related Documents:'}
                              </h4>
                              <div className="space-y-2">
                                {step.documents.map((doc, docIndex) => (
                                  <div key={docIndex} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                      <FileText className="h-4 w-4 text-spup-green" />
                                      <div>
                                        <span className="text-spup-dark-gray font-medium">{doc.name}</span>
                                        {doc.required && (
                                          <Badge variant="destructive" className="ml-2 text-xs bg-red-100 text-red-800 hover:bg-red-100">
                                            Required
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Download className="h-4 w-4 text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {index < submissionSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-px h-8 bg-spup-green bg-opacity-30"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};