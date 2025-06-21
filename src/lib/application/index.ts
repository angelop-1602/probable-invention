import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { ApplicationStatus } from "@/components/ui/status-badge";

export interface Protocol {
  id: string;
  title: string;
  spupRecCode: string | null;
  status: ApplicationStatus;
  submissionDate: string;
  userId: string;
}

export async function fetchUserProtocols(userId: string): Promise<Protocol[]> {
  try {
    const protocolsRef = collection(db, "protocols");
    const q = query(protocolsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Protocol));
  } catch (error) {
    console.error("Error fetching protocols:", error);
    return [];
  }
}

/**
 * Generate a SPUP REC code in the format SPUP_YYYY_NNNN_TR_FL
 */
export function generateSpupRecCode(
  currentYear: number,
  sequentialNumber: number,
  typeCode: string,
  initials: string
): string {
  return `SPUP_${currentYear}_${sequentialNumber}_${typeCode}_${initials}`;
} 