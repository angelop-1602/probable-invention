'use client';

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ApplicationFormValues } from "@/types/protocol-application/submission";

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
  onFormDataChange: (data: ApplicationFormValues) => void;
  isSubmitting: boolean;
}

function ApplicationInformation({ onFormDataChange, isSubmitting }: ApplicationInformationProps) {
  // Track co-researchers in a separate state
  const [coResearchers, setCoResearchers] = useState<string[]>([]);
  
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      principalInvestigator: "",
      adviser: "",
      courseProgram: "",
      fundingType: "Researcher-funded",
      researchType: "Experimental",
      researchTitle: "",
      proponentName: "",
      proponentEmail: "",
      proponentAdvisor: "",
      proponentCourseProgram: "",
      notificationEmail: true,
      notificationSms: false,
      faqAcknowledged: false,
    },
  });

  // Update parent component with form values
  React.useEffect(() => {
    const subscription = form.watch((data) => {
      if (data && !Array.isArray(data)) {
      // Combine form data with co-researchers
        const formData: ApplicationFormValues = {
          ...data as FormSchemaType,
        coResearchers
      };
        onFormDataChange(formData);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onFormDataChange, coResearchers]);

  // Add a new co-researcher
  const addCoResearcher = () => {
    setCoResearchers([...coResearchers, ""]);
  };

  // Update a co-researcher at a specific index
  const updateCoResearcher = (index: number, value: string) => {
    const updated = [...coResearchers];
    updated[index] = value;
    setCoResearchers(updated);
  };

  // Remove a co-researcher at a specific index
  const removeCoResearcher = (index: number) => {
    setCoResearchers(coResearchers.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Protocol Review Application Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="principalInvestigator"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Principal Investigator</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCoResearcher}
                        disabled={isSubmitting}
                        className="h-8 px-2 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Co-Researcher
                      </Button>
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="Name of the leader or researcher" 
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Co-Researchers Section */}
              {coResearchers.length > 0 && (
                <div className="pl-6 space-y-2 pt-1 border-l-2 border-l-muted ml-2">
                  {coResearchers.map((researcher, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Co-Researcher ${index + 1}`}
                        value={researcher}
                        onChange={(e) => updateCoResearcher(index, e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCoResearcher(index)}
                        disabled={isSubmitting}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="researchTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Title of your research" 
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adviser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adviser</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of your adviser" 
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseProgram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course/Program (Acronym)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., BSCS, BSIT, etc." 
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proponentEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your@email.com" 
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export { ApplicationInformation };
