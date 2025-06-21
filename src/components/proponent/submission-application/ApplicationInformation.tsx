'use client';

import * as React from "react";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Schema for the main form
const applicationSchema = z.object({
  principalInvestigator: z.string().min(2, "Principal Investigator name is required"),
  adviser: z.string().min(2, "Adviser name is required"),
  courseProgram: z.string().min(2, "Course/Program is required"),
  fundingType: z.enum(["Researcher-funded", "Institution-funded", "Agency-funded", "Pharmaceutical-funded", "Other"]),
  researchType: z.enum(["Experimental", "Social/Behavioral"]),
  researchTitle: z.string().min(5, "Research title is required"),
  proponentName: z.string().min(2, "Proponent name is required"),
  proponentEmail: z.string().email("Invalid email address"),
  proponentAdvisor: z.string().min(2, "Proponent advisor is required"),
  proponentCourseProgram: z.string().min(2, "Proponent course/program is required"),
  notificationEmail: z.boolean(),
  notificationSms: z.boolean(),
  faqAcknowledged: z.boolean(),
});

type FormSchemaType = z.infer<typeof applicationSchema>;

interface ApplicationInformationProps {
  formData: any;
  onChange: (data: any) => void;
}

export const ApplicationInformation = ({ formData, onChange }: ApplicationInformationProps) => {
  const handleInputChange = (field: string, value: string) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="principalInvestigator">Principal Investigator</Label>
            <Input
              id="principalInvestigator"
              value={formData.principalInvestigator}
              onChange={(e) => handleInputChange('principalInvestigator', e.target.value)}
              placeholder="Enter principal investigator name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adviser">Adviser</Label>
            <Input
              id="adviser"
              value={formData.adviser}
              onChange={(e) => handleInputChange('adviser', e.target.value)}
              placeholder="Enter adviser name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseProgram">Course/Program</Label>
            <Input
              id="courseProgram"
              value={formData.courseProgram}
              onChange={(e) => handleInputChange('courseProgram', e.target.value)}
              placeholder="Enter course or program"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.proponent?.email}
              onChange={(e) => handleInputChange('proponent.email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="researchTitle">Research Title</Label>
            <Input
              id="researchTitle"
              value={formData.protocolDetails?.researchTitle}
              onChange={(e) => handleInputChange('protocolDetails.researchTitle', e.target.value)}
              placeholder="Enter research title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundingType">Funding Type</Label>
            <Select
              value={formData.fundingType}
              onValueChange={(value) => handleInputChange('fundingType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funding type" />
              </SelectTrigger>
              <SelectContent>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="Researcher-funded">Researcher-funded</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research is funded by the researcher's personal resources</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="Institution-funded">Institution-funded</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research is funded by the academic institution or university</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="Agency-funded">Agency-funded</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research is funded by an external agency or organization</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="Pharmaceutical-funded">Pharmaceutical-funded</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research is funded by a pharmaceutical company or industry</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="Other">Other</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research is funded by other sources not listed above</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="researchType">Research Type</Label>
            <Select
              value={formData.researchType}
              onValueChange={(value) => handleInputChange('researchType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select research type" />
              </SelectTrigger>
              <SelectContent>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="Experimental">Experimental</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research that involves controlled testing of variables and hypotheses in a scientific setting</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="Social/Behavioral">Social/Behavioral</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research that studies human behavior, social interactions, and societal phenomena</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
