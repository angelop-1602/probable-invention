"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Calendar, AlertCircle, User, Mail, MapPin, Phone, Building, GraduationCap, FileText, Clock, Users, BookOpen, PhilippinePeso, CalendarDays } from "lucide-react";
import { SubmissionFormData } from "@/lib/submission/submission.types";

// Study level options from submission.json
const STUDY_LEVELS = [
  "Undergraduate Thesis",
  "Master's Thesis",
  "Doctoral Dissertation",
  "Faculty/Staff",
  "Funded Research",
  "Others",
];

// Study type options from submission.json
const STUDY_TYPES = [
  "Social/Behavioral",
  "Public Health Research",
  "Health Operations",
  "Biomedical Studies",
  "Clinical Trials",
  "Others",
];

interface ApplicationInformationProps {
  formData: Partial<SubmissionFormData>;
  onChange: (data: Partial<SubmissionFormData>) => void;
}

interface ValidationErrors {
  [key: string]: string;
}

  // Error display component with simple styling
const FieldError = ({ error, isHighlighted = false }: { error?: string; isHighlighted?: boolean }) => {
  if (!error) return null;
  
  return (
    <div className={`flex items-center gap-1 text-red-600 text-xs mt-1 font-medium ${
      isHighlighted ? 'bg-red-50 p-2 rounded-md border border-red-200' : ''
    }`}>
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span className={isHighlighted ? 'font-semibold' : ''}>{error}</span>
    </div>
  );
};

export const ApplicationInformation = ({
  formData,
  onChange,
}: ApplicationInformationProps) => {
  const [coResearchers, setCoResearchers] = useState<string[]>(
    formData.general_information?.co_researchers?.map((r) => r.name) || []
  );
  const [advisers, setAdvisers] = useState<string[]>(
    formData.general_information?.advisers?.map((a) => a.name) || [""]
  );
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [highlightMissingFields, setHighlightMissingFields] = useState<boolean>(false);

  // Validate individual fields
  const validateField = (fieldPath: string, value: any) => {
    try {
      // Create a partial validation based on the field path
      const fieldSchema = getFieldSchema(fieldPath);
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error if validation passes
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldPath];
          return newErrors;
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        setValidationErrors(prev => ({
          ...prev,
          [fieldPath]: errorMessage
        }));
      }
    }
  };

  // Get field schema for validation
  const getFieldSchema = (fieldPath: string): z.ZodSchema<any> | null => {
    const schemas: { [key: string]: z.ZodSchema<any> } = {
      'general_information.protocol_title': z.string().min(5, 'Protocol title is required (minimum 5 characters)'),
      'general_information.principal_investigator.name': z.string().min(2, 'Principal Investigator name is required'),
      'general_information.principal_investigator.email': z.string().email('Valid email address is required'),
      'general_information.principal_investigator.address': z.string().min(5, 'Address is required'),
      'general_information.principal_investigator.contact_number': z.string().min(10, 'Valid contact number is required'),
      'general_information.principal_investigator.position_institution': z.string().min(2, 'Position/Institution is required'),
      'nature_and_type_of_study.level': z.string().min(1, 'Study level is required'),
      'nature_and_type_of_study.type': z.string().min(1, 'Study type is required'),
      'duration_of_study.start_date': z.string().min(1, 'Start date is required'),
      'duration_of_study.end_date': z.string().min(1, 'End date is required'),
      'participants.number_of_participants': z.number().min(1, 'Number of participants must be at least 1'),
      'participants.type_and_description': z.string().min(10, 'Participant description is required (minimum 10 characters)'),
      'brief_description_of_study': z.string().min(50, 'Brief description is required (minimum 50 characters)'),
      'advisers': z.array(z.object({ name: z.string().min(2, 'Adviser name is required') })).min(1, 'At least one adviser is required'),
    };
    
    return schemas[fieldPath] || null;
  };

  // Mark field as touched and validate
  const handleFieldBlur = (fieldPath: string, value: any) => {
    setTouchedFields(prev => new Set([...prev, fieldPath]));
    validateField(fieldPath, value);
  };

  // Handle input changes with immediate validation
  const handleInputChange = (field: string, value: any) => {
    const fieldParts = field.split(".");
    const updatedData = { ...formData } as any;

    let current = updatedData;
    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (!current[fieldParts[i]]) {
        current[fieldParts[i]] = {};
      }
      current = current[fieldParts[i]];
    }
    current[fieldParts[fieldParts.length - 1]] = value;

    onChange(updatedData);
    
    // Always validate immediately on change (not just when touched)
    // This provides immediate feedback as user types
    validateField(field, value);
    
    // Mark field as touched for future reference
    setTouchedFields(prev => new Set([...prev, field]));
  };

  // Validate date range
  const validateDateRange = () => {
    const startDate = formData.duration_of_study?.start_date;
    const endDate = formData.duration_of_study?.end_date;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        setValidationErrors(prev => ({
          ...prev,
          'duration_of_study.end_date': 'End date must be after start date'
        }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors['duration_of_study.end_date'];
          return newErrors;
        });
      }
    }
  };

  // Effect to validate date range when dates change
  useEffect(() => {
    validateDateRange();
  }, [formData.duration_of_study?.start_date, formData.duration_of_study?.end_date]);

  // Listen for validation highlighting events from parent component
  useEffect(() => {
    const handleHighlightFields = (event: CustomEvent) => {
      const { missingFields, errors } = event.detail;
      
      // Mark all fields as touched to show all validation errors
      const allFieldPaths = new Set<string>([
        'general_information.protocol_title',
        'general_information.principal_investigator.name',
        'general_information.principal_investigator.email',
        'general_information.principal_investigator.address',
        'general_information.principal_investigator.contact_number',
        'general_information.principal_investigator.position_institution',
        'nature_and_type_of_study.level',
        'nature_and_type_of_study.type',
        'duration_of_study.start_date',
        'duration_of_study.end_date',
        'participants.number_of_participants',
        'participants.type_and_description',
        'brief_description_of_study',
        'advisers',
        'source_of_funding'
      ]);
      
      setTouchedFields(allFieldPaths);
      setHighlightMissingFields(true);
      
      // Trigger validation for all required fields
      allFieldPaths.forEach(fieldPath => {
        if (fieldPath === 'general_information.protocol_title') {
          validateField(fieldPath, formData.general_information?.protocol_title);
        } else if (fieldPath === 'general_information.principal_investigator.name') {
          validateField(fieldPath, formData.general_information?.principal_investigator?.name);
        } else if (fieldPath === 'general_information.principal_investigator.email') {
          validateField(fieldPath, formData.general_information?.principal_investigator?.email);
        } else if (fieldPath === 'general_information.principal_investigator.address') {
          validateField(fieldPath, formData.general_information?.principal_investigator?.address);
        } else if (fieldPath === 'general_information.principal_investigator.contact_number') {
          validateField(fieldPath, formData.general_information?.principal_investigator?.contact_number);
        } else if (fieldPath === 'general_information.principal_investigator.position_institution') {
          validateField(fieldPath, formData.general_information?.principal_investigator?.position_institution);
        } else if (fieldPath === 'nature_and_type_of_study.level') {
          validateField(fieldPath, formData.nature_and_type_of_study?.level);
        } else if (fieldPath === 'nature_and_type_of_study.type') {
          validateField(fieldPath, formData.nature_and_type_of_study?.type);
        } else if (fieldPath === 'duration_of_study.start_date') {
          validateField(fieldPath, formData.duration_of_study?.start_date);
        } else if (fieldPath === 'duration_of_study.end_date') {
          validateField(fieldPath, formData.duration_of_study?.end_date);
        } else if (fieldPath === 'participants.number_of_participants') {
          validateField(fieldPath, formData.participants?.number_of_participants);
        } else if (fieldPath === 'participants.type_and_description') {
          validateField(fieldPath, formData.participants?.type_and_description);
        } else if (fieldPath === 'brief_description_of_study') {
          validateField(fieldPath, formData.brief_description_of_study);
        } else if (fieldPath === 'advisers') {
          const validatedAdvisers = advisers.filter(name => name.trim().length > 0).map(name => ({ name }));
          validateField(fieldPath, validatedAdvisers);
        }
      });
      
      // Reset highlighting after 10 seconds
      setTimeout(() => {
        setHighlightMissingFields(false);
      }, 10000);
    };

    // Add event listener
    window.addEventListener('highlightRequiredFields', handleHighlightFields as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('highlightRequiredFields', handleHighlightFields as EventListener);
    };
  }, [formData, advisers]);

  // Validate funding selection
  const validateFunding = () => {
    const funding = formData.source_of_funding;
    if (!funding) return;
    
    const hasFunding = funding.self_funded || 
                     funding.institution_funded || 
                     funding.government_funded || 
                     funding.pharmaceutical_company?.is_funded || 
                     funding.scholarship || 
                     funding.research_grant ||
                     (funding.others && funding.others.trim().length > 0);
    
    if (!hasFunding) {
      setValidationErrors(prev => ({
        ...prev,
        'source_of_funding': 'Please select at least one funding source'
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors['source_of_funding'];
        return newErrors;
      });
    }
  };

  // Effect to validate funding when funding options change
  useEffect(() => {
    if (touchedFields.has('source_of_funding')) {
      validateFunding();
    }
  }, [formData.source_of_funding]);

  const addCoResearcher = () => {
    const newCoResearchers = [...coResearchers, ""];
    setCoResearchers(newCoResearchers);
    handleInputChange(
      "general_information.co_researchers",
      newCoResearchers.map((name) => ({ name }))
    );
  };

  const removeCoResearcher = (index: number) => {
    const newCoResearchers = coResearchers.filter((_, i) => i !== index);
    setCoResearchers(newCoResearchers);
    handleInputChange(
      "general_information.co_researchers",
      newCoResearchers.map((name) => ({ name }))
    );
  };

  const updateCoResearcher = (index: number, value: string) => {
    const newCoResearchers = [...coResearchers];
    newCoResearchers[index] = value;
    setCoResearchers(newCoResearchers);
    handleInputChange(
      "general_information.co_researchers",
      newCoResearchers.map((name) => ({ name }))
    );
  };

  const updateAdviser = (index: number, value: string) => {
    const newAdvisers = [...advisers];
    newAdvisers[index] = value;
    setAdvisers(newAdvisers);
    handleInputChange(
      "general_information.advisers",
      newAdvisers.map((name) => ({ name }))
    );
    
    // Validate advisers
    if (touchedFields.has('advisers')) {
      const validatedAdvisers = newAdvisers.filter(name => name.trim().length > 0).map(name => ({ name }));
      validateField('advisers', validatedAdvisers);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            General Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Protocol Title */}
          <div className="space-y-2">
            <Label htmlFor="protocolTitle" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Protocol Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="protocolTitle"
              value={formData.general_information?.protocol_title || ""}
              onChange={(e) =>
                handleInputChange(
                  "general_information.protocol_title",
                  e.target.value
                )
              }
              onBlur={(e) => handleFieldBlur("general_information.protocol_title", e.target.value)}
              placeholder="Enter the complete title of your research protocol"
              className={`text-sm ${
                validationErrors['general_information.protocol_title'] || (highlightMissingFields && !formData.general_information?.protocol_title?.trim()) 
                  ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                  : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
              }`}
              required
            />
            <FieldError 
              error={validationErrors['general_information.protocol_title']} 
              isHighlighted={highlightMissingFields && !formData.general_information?.protocol_title?.trim()}
            />
          </div>

          {/* Principal Investigator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Principal Investigator
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  id="piName"
                  value={
                    formData.general_information?.principal_investigator
                      ?.name || ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "general_information.principal_investigator.name",
                      e.target.value
                    )
                  }
                  onBlur={(e) => handleFieldBlur("general_information.principal_investigator.name", e.target.value)}
                  placeholder="Full name of principal investigator"
                  className={`${
                    validationErrors['general_information.principal_investigator.name'] || (highlightMissingFields && !formData.general_information?.principal_investigator?.name?.trim())
                      ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                      : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                  }`}
                  required
                />
                <FieldError 
                  error={validationErrors['general_information.principal_investigator.name']} 
                  isHighlighted={highlightMissingFields && !formData.general_information?.principal_investigator?.name?.trim()}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCoResearcher}
                className="w-full max-w-xs col-start-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Co-Researcher
              </Button>
            </div>
            {/* Co-Researchers - Only show when there are any */}
            {coResearchers.length > 0 && (
              <div className="space-y-4">
                <Label>Co-Researchers</Label>
                {coResearchers.map((researcher, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={researcher}
                      onChange={(e) =>
                        updateCoResearcher(index, e.target.value)
                      }
                      placeholder="Co-researcher name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCoResearcher(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="piAddress" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Address
                </Label>
                <Input
                  id="piAddress"
                  value={
                    formData.general_information?.principal_investigator
                      ?.address || ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "general_information.principal_investigator.address",
                      e.target.value
                    )
                  }
                  onBlur={(e) => handleFieldBlur("general_information.principal_investigator.address", e.target.value)}
                  placeholder="Complete address"
                  className={`${
                    validationErrors['general_information.principal_investigator.address'] || (highlightMissingFields && !formData.general_information?.principal_investigator?.address?.trim())
                      ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                      : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                  }`}
                />
                <FieldError 
                  error={validationErrors['general_information.principal_investigator.address']} 
                  isHighlighted={highlightMissingFields && !formData.general_information?.principal_investigator?.address?.trim()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="piContact" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact Number
                </Label>
                <Input
                  id="piContact"
                  value={
                    formData.general_information?.principal_investigator
                      ?.contact_number || ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "general_information.principal_investigator.contact_number",
                      e.target.value
                    )
                  }
                  onBlur={(e) => handleFieldBlur("general_information.principal_investigator.contact_number", e.target.value)}
                  placeholder="Phone/mobile number"
                  className={`${
                    validationErrors['general_information.principal_investigator.contact_number'] || (highlightMissingFields && !formData.general_information?.principal_investigator?.contact_number?.trim())
                      ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                      : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                  }`}
                />
                <FieldError 
                  error={validationErrors['general_information.principal_investigator.contact_number']} 
                  isHighlighted={highlightMissingFields && !formData.general_information?.principal_investigator?.contact_number?.trim()}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="piPosition" className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Position/Institution
                </Label>
                <Input
                  id="piPosition"
                  value={
                    formData.general_information?.principal_investigator
                      ?.position_institution || ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "general_information.principal_investigator.position_institution",
                      e.target.value
                    )
                  }
                  onBlur={(e) => handleFieldBlur("general_information.principal_investigator.position_institution", e.target.value)}
                  placeholder="Position and institution"
                  className={`${
                    validationErrors['general_information.principal_investigator.position_institution'] || (highlightMissingFields && !formData.general_information?.principal_investigator?.position_institution?.trim())
                      ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                      : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                  }`}
                />
                <FieldError 
                  error={validationErrors['general_information.principal_investigator.position_institution']} 
                  isHighlighted={highlightMissingFields && !formData.general_information?.principal_investigator?.position_institution?.trim()}
                />
                <Label htmlFor="piEmail" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="piEmail"
                  type="email"
                  value={
                    formData.general_information?.principal_investigator
                      ?.email || ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "general_information.principal_investigator.email",
                      e.target.value
                    )
                  }
                  onBlur={(e) => handleFieldBlur("general_information.principal_investigator.email", e.target.value)}
                  placeholder="Email address"
                  className={`${
                    validationErrors['general_information.principal_investigator.email'] || (highlightMissingFields && !formData.general_information?.principal_investigator?.email?.trim())
                      ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                      : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                  }`}
                  required
                />
                <FieldError 
                  error={validationErrors['general_information.principal_investigator.email']} 
                  isHighlighted={highlightMissingFields && !formData.general_information?.principal_investigator?.email?.trim()}
                />
              </div>
            </div>
          </div>

          {/* Advisers - Simple single input */}
          <div className="space-y-2">
            <Label htmlFor="adviser" className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Adviser(s) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adviser"
              value={advisers[0] || ""}
              onChange={(e) => updateAdviser(0, e.target.value)}
              onBlur={(e) => {
                setTouchedFields(prev => new Set([...prev, 'advisers']));
                const validatedAdvisers = [e.target.value].filter(name => name.trim().length > 0).map(name => ({ name }));
                validateField('advisers', validatedAdvisers);
              }}
              placeholder="Primary adviser name (required)"
              className={`transition-colors ${validationErrors['advisers'] ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' : 'focus:border-blue-500 focus:ring-blue-200'}`}
              required
            />
            <FieldError error={validationErrors['advisers']} />
          </div>
        </CardContent>
      </Card>

      {/* Protocol Review Application Information - Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Nature and Type of Study */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Nature and Type of Study
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studyLevel" className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Study Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.nature_and_type_of_study?.level || ""}
                onValueChange={(value) => {
                  handleInputChange("nature_and_type_of_study.level", value);
                  handleFieldBlur("nature_and_type_of_study.level", value);
                }}
                required
              >
                <SelectTrigger className={`${
                  validationErrors['nature_and_type_of_study.level'] || (highlightMissingFields && !formData.nature_and_type_of_study?.level)
                    ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                    : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                }`}>
                  <SelectValue placeholder="Select study level" />
                </SelectTrigger>
                <SelectContent>
                  {STUDY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={validationErrors['nature_and_type_of_study.level']} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyType" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Study Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.nature_and_type_of_study?.type || ""}
                onValueChange={(value) => {
                  handleInputChange("nature_and_type_of_study.type", value);
                  handleFieldBlur("nature_and_type_of_study.type", value);
                }}
                required
              >
                <SelectTrigger className={`${
                  validationErrors['nature_and_type_of_study.type'] || (highlightMissingFields && !formData.nature_and_type_of_study?.type)
                    ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                    : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                }`}>
                  <SelectValue placeholder="Select study type" />
                </SelectTrigger>
                <SelectContent>
                  {STUDY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={validationErrors['nature_and_type_of_study.type']} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Study Site
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="withinUniversity"
                checked={
                  formData.study_site?.research_within_university || false
                }
                onCheckedChange={(checked) =>
                  handleInputChange(
                    "study_site.research_within_university",
                    checked
                  )
                }
              />
              <Label htmlFor="withinUniversity" className="text-sm">
                Research within the university
              </Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="outsideUniversity"
                  checked={
                    formData.study_site?.research_outside_university
                      ?.is_outside || false
                  }
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "study_site.research_outside_university.is_outside",
                      checked
                    )
                  }
                />
                <Label htmlFor="outsideUniversity" className="text-sm">
                  Research outside the university
                </Label>
              </div>
              {formData.study_site?.research_outside_university?.is_outside && (
                <div className="space-y-1">
                                      <Input
                      placeholder="Specify location outside university"
                      value={
                        formData.study_site?.research_outside_university?.specify ||
                        ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "study_site.research_outside_university.specify",
                          e.target.value
                        )
                      }
                      onBlur={(e) => {
                        if (formData.study_site?.research_outside_university?.is_outside) {
                          const schema = z.string().min(1, 'Please specify the external research site');
                          try {
                            schema.parse(e.target.value);
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors['study_site.research_outside_university.specify'];
                              return newErrors;
                            });
                          } catch (error) {
                            if (error instanceof z.ZodError) {
                              setValidationErrors(prev => ({
                                ...prev,
                                'study_site.research_outside_university.specify': error.errors[0]?.message || 'Please specify the external research site'
                              }));
                            }
                          }
                        }
                      }}
                      className={`ml-6 ${
                        validationErrors['study_site.research_outside_university.specify']
                          ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                          : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                      }`}
                    />
                  <div className="ml-6">
                    <FieldError error={validationErrors['study_site.research_outside_university.specify']} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Duration of Study */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Duration of Study
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.duration_of_study?.start_date || ""}
                onChange={(e) =>
                  handleInputChange(
                    "duration_of_study.start_date",
                    e.target.value
                  )
                }
                onBlur={(e) => handleFieldBlur("duration_of_study.start_date", e.target.value)}
                className={`${
                  validationErrors['duration_of_study.start_date'] || (highlightMissingFields && !formData.duration_of_study?.start_date?.trim())
                    ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                    : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                }`}
              />
              <FieldError 
                error={validationErrors['duration_of_study.start_date']} 
                isHighlighted={highlightMissingFields && !formData.duration_of_study?.start_date?.trim()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.duration_of_study?.end_date || ""}
                onChange={(e) =>
                  handleInputChange(
                    "duration_of_study.end_date",
                    e.target.value
                  )
                }
                onBlur={(e) => handleFieldBlur("duration_of_study.end_date", e.target.value)}
                className={`${
                  validationErrors['duration_of_study.end_date'] || (highlightMissingFields && !formData.duration_of_study?.end_date?.trim())
                    ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                    : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                }`}
              />
              <FieldError 
                error={validationErrors['duration_of_study.end_date']} 
                isHighlighted={highlightMissingFields && !formData.duration_of_study?.end_date?.trim()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Source of Funding */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PhilippinePeso className="h-5 w-5 text-primary" />
              Source of Funding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selfFunded"
                  checked={formData.source_of_funding?.self_funded || false}
                  onCheckedChange={(checked) => {
                    handleInputChange("source_of_funding.self_funded", checked);
                    setTouchedFields(prev => new Set([...prev, 'source_of_funding']));
                  }}
                />
                <Label htmlFor="selfFunded" className="text-sm">
                  Self-funded
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="institutionFunded"
                  checked={
                    formData.source_of_funding?.institution_funded || false
                  }
                  onCheckedChange={(checked) => {
                    handleInputChange(
                      "source_of_funding.institution_funded",
                      checked
                    );
                    setTouchedFields(prev => new Set([...prev, 'source_of_funding']));
                  }}
                />
                <Label htmlFor="institutionFunded" className="text-sm">
                  Institution-funded
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="governmentFunded"
                  checked={
                    formData.source_of_funding?.government_funded || false
                  }
                  onCheckedChange={(checked) => {
                    handleInputChange(
                      "source_of_funding.government_funded",
                      checked
                    );
                    setTouchedFields(prev => new Set([...prev, 'source_of_funding']));
                  }}
                />
                <Label htmlFor="governmentFunded" className="text-sm">
                  Government-funded
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scholarship"
                  checked={formData.source_of_funding?.scholarship || false}
                  onCheckedChange={(checked) => {
                    handleInputChange("source_of_funding.scholarship", checked);
                    setTouchedFields(prev => new Set([...prev, 'source_of_funding']));
                  }}
                />
                <Label htmlFor="scholarship" className="text-sm">
                  Scholarship
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="researchGrant"
                  checked={formData.source_of_funding?.research_grant || false}
                  onCheckedChange={(checked) => {
                    handleInputChange(
                      "source_of_funding.research_grant",
                      checked
                    );
                    setTouchedFields(prev => new Set([...prev, 'source_of_funding']));
                  }}
                />
                <Label htmlFor="researchGrant" className="text-sm">
                  Research Grant
                </Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pharmaceuticalFunded"
                    checked={
                      formData.source_of_funding?.pharmaceutical_company
                        ?.is_funded || false
                    }
                    onCheckedChange={(checked) => {
                      handleInputChange(
                        "source_of_funding.pharmaceutical_company.is_funded",
                        checked
                      );
                      setTouchedFields(prev => new Set([...prev, 'source_of_funding']));
                    }}
                  />
                  <Label htmlFor="pharmaceuticalFunded" className="text-sm">
                    Pharmaceutical Company
                  </Label>
                </div>
                {formData.source_of_funding?.pharmaceutical_company
                  ?.is_funded && (
                  <div className="space-y-1">
                    <Input
                      placeholder="Specify pharmaceutical company"
                      value={
                        formData.source_of_funding?.pharmaceutical_company
                          ?.specify || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "source_of_funding.pharmaceutical_company.specify",
                          e.target.value
                        )
                      }
                      onBlur={(e) => {
                        if (formData.source_of_funding?.pharmaceutical_company?.is_funded) {
                          const schema = z.string().min(1, 'Please specify the pharmaceutical company');
                          try {
                            schema.parse(e.target.value);
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors['source_of_funding.pharmaceutical_company.specify'];
                              return newErrors;
                            });
                          } catch (error) {
                            if (error instanceof z.ZodError) {
                              setValidationErrors(prev => ({
                                ...prev,
                                'source_of_funding.pharmaceutical_company.specify': error.errors[0]?.message || 'Please specify the pharmaceutical company'
                              }));
                            }
                          }
                        }
                      }}
                      className={`ml-6 ${
                        validationErrors['source_of_funding.pharmaceutical_company.specify']
                          ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                          : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                      }`}
                    />
                    <div className="ml-6">
                      <FieldError error={validationErrors['source_of_funding.pharmaceutical_company.specify']} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherFunding" className="text-sm flex items-center gap-2">
                  <PhilippinePeso className="h-4 w-4 text-primary" />
                  Others (specify)
                </Label>
                <Input
                  id="otherFunding"
                  value={formData.source_of_funding?.others || ""}
                  onChange={(e) => {
                    handleInputChange(
                      "source_of_funding.others",
                      e.target.value
                    );
                    setTouchedFields(prev => new Set([...prev, 'source_of_funding']));
                  }}
                  placeholder="Specify other funding sources"
                />
              </div>
              
              {/* Funding validation error */}
              <FieldError error={validationErrors['source_of_funding']} />
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="lg:col-span-2 xl:col-span-2 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="numberOfParticipants"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-primary" />
                Number of Participants
              </Label>
              <Input
                id="numberOfParticipants"
                type="number"
                min="0"
                value={formData.participants?.number_of_participants || 0}
                onChange={(e) =>
                  handleInputChange(
                    "participants.number_of_participants",
                    parseInt(e.target.value) || 0
                  )
                }
                onBlur={(e) => handleFieldBlur("participants.number_of_participants", parseInt(e.target.value) || 0)}
                placeholder="Enter number of participants"
                className={`${
                  validationErrors['participants.number_of_participants'] || (highlightMissingFields && (!formData.participants?.number_of_participants || formData.participants?.number_of_participants === 0))
                    ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                    : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                }`}
              />
              <FieldError 
                error={validationErrors['participants.number_of_participants']} 
                isHighlighted={highlightMissingFields && (!formData.participants?.number_of_participants || formData.participants?.number_of_participants === 0)}
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <Label
                htmlFor="participantDescription"
                className="text-sm font-medium flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-primary" />
                Type and Description
              </Label>
              <Textarea
                id="participantDescription"
                value={formData.participants?.type_and_description || ""}
                onChange={(e) =>
                  handleInputChange(
                    "participants.type_and_description",
                    e.target.value
                  )
                }
                onBlur={(e) => handleFieldBlur("participants.type_and_description", e.target.value)}
                placeholder="Describe the type and characteristics of participants"
                className={`flex-1 resize-none ${
                  validationErrors['participants.type_and_description'] || (highlightMissingFields && !formData.participants?.type_and_description?.trim())
                    ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                    : 'focus:border-blue-500 focus:ring-blue-200 border-gray-300'
                }`}
              />
              <FieldError 
                error={validationErrors['participants.type_and_description']} 
                isHighlighted={highlightMissingFields && !formData.participants?.type_and_description?.trim()}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brief Description - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Brief Description of Study
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="briefDescription" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Study Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="briefDescription"
              value={formData.brief_description_of_study || ""}
              onChange={(e) =>
                handleInputChange("brief_description_of_study", e.target.value)
              }
              onBlur={(e) => handleFieldBlur("brief_description_of_study", e.target.value)}
              placeholder="Provide a brief but comprehensive description of your study"
              rows={5}
              className={`${validationErrors['brief_description_of_study'] ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' : 'focus:border-blue-500 focus:ring-blue-200'}`}
            />
            <FieldError error={validationErrors['brief_description_of_study']} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
