"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChairTable } from "@/components/rec-chair/shared/Table";

type Application = {
  id?: string;
  spupRecCode?: string;
  principalInvestigator?: string;
  submissionDate?: any;
  courseProgram?: string;
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const applicationsCollection = collection(db, "applications");
        const applicationsSnapshot = await getDocs(applicationsCollection);
        const applicationsData = applicationsSnapshot.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            spupRecCode: data.spupRecCode || "",
            principalInvestigator: data.principalInvestigator || "",
            submissionDate: data.submissionDate || null,
            courseProgram: data.courseProgram || ""
          } as Application;
        });
        
        setApplications(applicationsData);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ChairTable 
          title="Protocol Applications" 
          caption="A list of recent submission of protocol review applications"
          data={applications}
        />
      )}
    </>
  );
}
