"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileBadge2,
  Users,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Mail,
} from "lucide-react";

const AboutSection = () => {
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    const handler = () => setShowMembers(true);
    window.addEventListener("openCommitteeMembers", handler);
    return () => window.removeEventListener("openCommitteeMembers", handler);
  }, []);

  const members = [
    {
      name: "Dr. Elizabeth Iquin",
      role: "REC Chairperson",
      qualifications: "MD, MPH",
      photo: "/Image of Members/elizabeth iquin.png",
    },
    {
      name: "Dr. Angelo P. Peralta",
      role: "REC Vice-Chairperson",
      qualifications: "PhD in Educational Management",
      photo: "/Image of Members/Peralta, Angelo P.png",
    },
    {
      name: "Dr. Nova R. Domingo",
      role: "REC Secretary",
      qualifications: "PhD in Nursing",
      photo: "/Image of Members/Domingo, Nova R.png",
    },
    {
      name: "Dr. Everett T. Laureta",
      role: "REC Member",
      qualifications: "PhD in Psychology",
      photo: "/Image of Members/Laureta, Everett T.png",
    },
    {
      name: "Dr. Sergio G. Imperio",
      role: "REC Member",
      qualifications: "MD, Specialist in Internal Medicine",
      photo: "/Image of Members/Imperio, Sergio G.png",
    },
    {
      name: "Dr. Maria Felina B. Agbayani",
      role: "REC Member",
      qualifications: "PhD in Education",
      photo: "/Image of Members/Agbayani, Maria Felina B.png",
    },
    {
      name: "Dr. Claudeth U. Gamiao",
      role: "REC Member",
      qualifications: "PhD in Education",
      photo: "/Image of Members/Gamiao, Claudeth U.png",
    },
    {
      name: "Dr. Allan Paulo L. Blaquera",
      role: "REC Member",
      qualifications: "PhD in Business Administration",
      photo: "/Image of Members/Blaquera, Allan Paulo L.png",
    },
    {
      name: "Dr. Marjorie L. Bambalan",
      role: "REC Member",
      qualifications: "PhD in Education",
      photo: "/Image of Members/Bambalan, Marjorie L.png",
    },
  ];

  return (
    <section id="about" className="py-12 sm:py-16 bg-spup-light-gray scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl sm:text-3xl md:text-4xl text-primary mb-6 sm:mb-8">
            About SPUP Research Ethics Committee
          </h2>

          <div className="text-left mb-12 space-y-6">
            <p className="text-lg text-spup-dark-gray leading-relaxed">
              Established in 2021, the St. Paul University Philippines Research
              Ethics Committee (SPUP REC) is committed to upholding the highest
              standards of research ethics. We ensure that all research
              involving human participants conducted within our institution
              adheres to international ethical principles and national
              guidelines.
            </p>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
              <div className="flex items-center mb-4">
                <FileBadge2 className="h-8 w-8 text-secondary mr-3" />
                <h3 className="font-montserrat font-bold text-xl text-primary">
                  PHREB Level 1 Accreditation
                </h3>
              </div>
              <p className="text-spup-dark-gray">
                SPUP REC is proudly accredited as a{" "}
                <strong className="text-primary">
                  Level 1 Research Ethics Committee
                </strong>{" "}
                by the Philippine Health Research Ethics Board (PHREB). This
                accreditation validates our commitment to maintaining rigorous
                ethical standards and is valid from{" "}
                <strong className="text-primary">
                  November 2024 to November 2025
                </strong>
                .
              </p>
            </div>

            <p className="text-lg text-spup-dark-gray leading-relaxed">
              Our committee operates under the fundamental ethical principles of
              respect for persons, beneficence, and justice, ensuring that
              research participants' rights, safety, and well-being are always
              protected.
            </p>
          </div>

          <div className="text-center">
            <Collapsible open={showMembers} onOpenChange={setShowMembers}>
              <CollapsibleTrigger asChild>
                <Button className="text-primary hover:bg-primary text-white px-8 py-3">
                  {showMembers ? (
                    <>
                      Hide Committee Members{" "}
                      <ChevronDown className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Meet Our Committee Members{" "}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent
                className="mt-8 scroll-mt-[9.375rem]"
                id="members"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {members.map((member) => (
                    <div
                      key={member.name}
                      className="group relative bg-primary rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                      {/* Image with grayscale and brightness on hover */}
                      <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
                        />
                        {/* Gradient overlay, only visible on hover */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/90 via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center"></div>
                      </div>
                      {/* Member Info - visible only when not hovered */}
                      <div className="p-4 bg-primary">
                        <div className="transition-all duration-300 group-hover:absolute group-hover:bottom-0 group-hover:left-0 group-hover:w-full group-hover:h-full group-hover:bg-primary/50 group-hover:flex group-hover:flex-col group-hover:justify-center group-hover:items-center">
                          <h3 className="font-montserrat font-bold text-sm text-white leading-tight transition-all duration-300">
                            {member.name}
                          </h3>
                          <p className="text-secondary font-semibold text-sm">
                            {member.role}
                          </p>
                          <p className="text-xs text-white hidden group-hover:block transition-opacity duration-300">
                            {member.qualifications}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
