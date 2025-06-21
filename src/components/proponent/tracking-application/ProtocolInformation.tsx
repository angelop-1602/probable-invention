import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, UserCog, Mail, FileSearch, MapPin, Activity } from "lucide-react";

interface ProtocolInformationProps {
  data: {
    principalInvestigator: string;
    courseProgram: string;
    adviser: string;
    email: string;
    typeOfReview: string;
    studySite: string;
    status: string;
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
      Submitted: "bg-blue-100 text-blue-700"
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  const infoItems = [
    { icon: User, label: "Principal Investigator", value: data.principalInvestigator },
    { icon: GraduationCap, label: "Course/Program", value: data.courseProgram },
    { icon: UserCog, label: "Adviser", value: data.adviser },
    { icon: Mail, label: "Email", value: data.email },
    { icon: FileSearch, label: "Type of Review", value: data.typeOfReview },
    { icon: MapPin, label: "Study Site", value: data.studySite },
    { icon: Activity, label: "Status", value: data.status, isStatus: true }
  ];

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold text-green-800">Protocol Review Application Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {infoItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="mt-0.5">
                <item.icon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                {item.isStatus ? (
                  <Badge variant="outline" className={getStatusColor(data.status)}>
                    {data.status}
                  </Badge>
                ) : (
                  <p className="font-medium text-gray-900">{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 