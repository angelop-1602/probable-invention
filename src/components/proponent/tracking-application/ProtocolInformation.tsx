"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, GraduationCap, UserCog, Mail, FileSearch, MapPin, Activity, Calendar, Users, DollarSign, BookOpen, Clock, Target, ChevronDown, ChevronRight } from "lucide-react";

interface ProtocolInformationProps {
  data: {
    principalInvestigator: string;
    courseProgram?: string;
    adviser: string;
    email: string;
    typeOfReview?: string;
    studySite?: string;
    status: string;
    // Additional detailed information from submission form
    position?: string;
    address?: string;
    contactNumber?: string;
    coResearchers?: string[];
    studyLevel?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
    participantCount?: number;
    participantDescription?: string;
    funding?: string;
    fundingDetails?: {
      selfFunded?: boolean;
      institutionFunded?: boolean;
      governmentFunded?: boolean;
      pharmaceuticalFunded?: boolean;
      scholarship?: boolean;
      researchGrant?: boolean;
      others?: string;
    };
    briefDescription?: string;
    progress?: string;
  };
}

export function ProtocolInformation({ data }: ProtocolInformationProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic'])); // Basic info open by default

  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      Draft: "bg-gray-100 text-gray-700",
      Accomplished: "bg-yellow-100 text-yellow-700",
      Approved: "bg-green-100 text-green-700",
      Revise: "bg-purple-100 text-purple-700",
      Rejected: "bg-red-100 text-red-700",
      Submitted: "bg-blue-100 text-blue-700",
      "Under Review": "bg-orange-100 text-orange-700",
      "Submission Check": "bg-indigo-100 text-indigo-700"
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  const formatFundingSources = () => {
    if (!data.fundingDetails) return data.funding || 'Unknown';
    
    const sources = [];
    if (data.fundingDetails.selfFunded) sources.push('Self-funded');
    if (data.fundingDetails.institutionFunded) sources.push('Institution-funded');
    if (data.fundingDetails.governmentFunded) sources.push('Government-funded');
    if (data.fundingDetails.pharmaceuticalFunded) sources.push('Pharmaceutical Company');
    if (data.fundingDetails.scholarship) sources.push('Scholarship');
    if (data.fundingDetails.researchGrant) sources.push('Research Grant');
    if (data.fundingDetails.others) sources.push(data.fundingDetails.others);
    
    return sources.length > 0 ? sources.join(', ') : 'Unknown';
  };

  const formatDateRange = () => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate).toLocaleDateString();
      const end = new Date(data.endDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return 'Not specified';
  };

  const formatProgressLabel = (progress: string) => {
    const progressLabels: Record<string, string> = {
      'SC': 'Submission Check',
      'IR': 'Initial Review',
      'SR': 'Secondary Review',
      'AP': 'Approved',
      'RS': 'Resubmission',
      'RJ': 'Rejected'
    };
    return progressLabels[progress] || progress;
  };

  // Basic Information Items
  const basicInfoItems = [
    { icon: User, label: "Principal Investigator", value: data.principalInvestigator },
    { icon: Mail, label: "Email", value: data.email },
    { icon: GraduationCap, label: "Course/Program", value: data.courseProgram || 'Unknown' },
    { icon: UserCog, label: "Adviser", value: data.adviser },
    { icon: FileSearch, label: "Type of Review", value: data.typeOfReview || 'Unknown' },
  ].filter(item => item.value && item.value !== 'Unknown');

  // Study Details Items
  const studyDetailsItems = [
    { icon: BookOpen, label: "Study Level", value: data.studyLevel },
    { icon: Target, label: "Study Type", value: data.studyType },
    { icon: Calendar, label: "Start Date", value: data.startDate },
    { icon: Calendar, label: "End Date", value: data.endDate },
    { icon: MapPin, label: "Study Site", value: data.studySite },
  ].filter(item => item.value);

  // Participants & Funding Items
  const participantsAndFundingItems = [
    { icon: Users, label: "Participant Count", value: data.participantCount?.toString() },
    { icon: DollarSign, label: "Funding", value: data.funding },
  ].filter(item => item.value);

  const CollapsibleSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode; 
  }) => {
    const isOpen = openSections.has(id);
    
    return (
      <Collapsible open={isOpen} onOpenChange={() => toggleSection(id)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {title}
              </h3>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold text-green-800">
          Protocol Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Basic Information - Collapsible */}
        <CollapsibleSection id="basic" title="Basic Information" icon={User}>
          <div className="space-y-3">
            {basicInfoItems.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <item.icon className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-medium text-gray-900 text-sm truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Contact Details - Collapsible */}
        {(data.address || data.contactNumber) && (
          <CollapsibleSection id="contact" title="Contact Details" icon={MapPin}>
            <div className="space-y-3">
              {data.address && (
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Address</p>
                    <p className="font-medium text-gray-900 text-sm">{data.address}</p>
                  </div>
                </div>
              )}
              {data.contactNumber && (
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Contact Number</p>
                    <p className="font-medium text-gray-900 text-sm">{data.contactNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Co-Researchers - Collapsible */}
        {data.coResearchers && data.coResearchers.length > 0 && (
          <CollapsibleSection id="researchers" title="Co-Researchers" icon={Users}>
            <div className="space-y-2">
              {data.coResearchers.map((researcher, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-green-600" />
                  <p className="text-sm text-gray-900">{researcher}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Study Details - Collapsible */}
        {studyDetailsItems.length > 0 && (
          <CollapsibleSection id="study" title="Study Details" icon={BookOpen}>
            <div className="space-y-3">
              {studyDetailsItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    <item.icon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-medium text-gray-900 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Participants & Funding - Collapsible */}
        {participantsAndFundingItems.length > 0 && (
          <CollapsibleSection id="funding" title="Participants & Funding" icon={DollarSign}>
            <div className="space-y-3">
              {participantsAndFundingItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    <item.icon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-medium text-gray-900 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Participant Description - Collapsible */}
        {data.participantDescription && (
          <CollapsibleSection id="participants" title="Participant Description" icon={Users}>
            <p className="text-sm text-gray-900 leading-relaxed">{data.participantDescription}</p>
          </CollapsibleSection>
        )}

        {/* Brief Description - Collapsible */}
        {data.briefDescription && (
          <CollapsibleSection id="description" title="Brief Description" icon={FileSearch}>
            <p className="text-sm text-gray-900 leading-relaxed">{data.briefDescription}</p>
          </CollapsibleSection>
        )}
      </CardContent>
    </Card>
  );
} 