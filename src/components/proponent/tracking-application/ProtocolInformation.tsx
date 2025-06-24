import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, UserCog, Mail, FileSearch, MapPin, Activity, Calendar, Users, DollarSign, BookOpen, Clock, Target } from "lucide-react";

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

  // Basic information items
  const basicInfoItems = [
    { icon: User, label: "Principal Investigator", value: data.principalInvestigator },
    { icon: Mail, label: "Email", value: data.email },
    { icon: GraduationCap, label: "Position/Institution", value: data.position || data.courseProgram || 'Unknown' },
    { icon: UserCog, label: "Adviser", value: data.adviser }
  ];

  // Study details items
  const studyDetailsItems = [
    { icon: BookOpen, label: "Study Level", value: data.studyLevel || 'Unknown' },
    { icon: FileSearch, label: "Study Type", value: data.studyType || data.typeOfReview || 'Unknown' },
    { icon: MapPin, label: "Study Site", value: data.studySite || 'Not specified' },
    { icon: Clock, label: "Duration", value: formatDateRange() }
  ];

  // Participants and funding items
  const participantsAndFundingItems = [
    { icon: Users, label: "Number of Participants", value: data.participantCount ? data.participantCount.toString() : 'Not specified' },
    { icon: DollarSign, label: "Funding Source", value: formatFundingSources() }
  ];

  // Status and progress items
  const statusItems = [
    { icon: Activity, label: "Status", value: data.status, isStatus: true },
    { icon: Target, label: "Progress", value: formatProgressLabel(data.progress || 'SC'), isBadge: true }
  ];

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold text-green-800">Protocol Review Application Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Basic Information</h3>
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
        </div>

        {/* Additional Contact Information */}
        {(data.address || data.contactNumber) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Contact Details</h3>
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
          </div>
        )}

        {/* Co-Researchers */}
        {data.coResearchers && data.coResearchers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Co-Researchers</h3>
            <div className="space-y-2">
              {data.coResearchers.map((researcher, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-green-600" />
                  <p className="text-sm text-gray-900">{researcher}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Study Details</h3>
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
        </div>

        {/* Participants & Funding */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Participants & Funding</h3>
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
        </div>

        {/* Participant Description */}
        {data.participantDescription && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Participant Description</h3>
            <p className="text-sm text-gray-900 leading-relaxed">{data.participantDescription}</p>
          </div>
        )}

        {/* Brief Description */}
        {data.briefDescription && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Study Description</h3>
            <p className="text-sm text-gray-900 leading-relaxed">{data.briefDescription}</p>
          </div>
        )}

        {/* Status & Progress */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Status & Progress</h3>
          <div className="space-y-3">
            {statusItems.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <item.icon className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  {item.isStatus ? (
                    <Badge variant="outline" className={getStatusColor(data.status)}>
                      {data.status}
                    </Badge>
                  ) : item.isBadge ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {item.value}
                    </Badge>
                  ) : (
                    <p className="font-medium text-gray-900 text-sm">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 