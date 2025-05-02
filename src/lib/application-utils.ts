import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Generate a properly formatted SPUP REC code for a protocol review application
 * 
 * Format: SPUP_YYYY_NNNN_TR_FL where:
 * - SPUP: Institution
 * - YYYY: Year of submission
 * - NNNN: Sequential number (e.g., 0001, 0002)
 * - TR: Type of research (EX: Exempted from review, SR: Social/Behavioral Research)
 * - FL: Initials of first and last name of principal investigator
 * 
 * @param principalInvestigator The full name of the principal investigator
 * @param researchType The type of research (defaults to 'SR' if not specified or not 'exempt')
 * @returns Promise with generated SPUP REC code
 */
export async function generateSpupRecCode(
  principalInvestigator: string,
  researchType?: string
): Promise<string> {
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Find the latest sequential number for this year
  const sequentialNumber = await getNextSequentialNumber(currentYear);
  
  // Determine research type code
  const typeCode = researchType?.toLowerCase().includes('exempt') ? 'EX' : 'SR';
  
  // Get initials from principal investigator
  let initials = '';
  if (principalInvestigator) {
    const nameParts = principalInvestigator.split(' ');
    // Get first letter of first name
    if (nameParts.length > 0) {
      initials += nameParts[0][0] || '';
    }
    // Get first letter of last name (assuming last name is the last part)
    if (nameParts.length > 1) {
      initials += nameParts[nameParts.length - 1][0] || '';
    }
  }
  
  // Format the code
  return `SPUP_${currentYear}_${sequentialNumber}_${typeCode}_${initials.toUpperCase()}`;
}

/**
 * Get the next sequential number for SPUP REC codes for the current year
 * 
 * @param year The year to get the next sequential number for
 * @returns Promise with the next sequential number as a zero-padded string (e.g., "0001")
 */
async function getNextSequentialNumber(year: number): Promise<string> {
  try {
    // Query the database for all REC codes from the current year
    const yearPrefix = `SPUP_${year}_`;
    const applicationsRef = collection(db, "protocolReviewApplications");
    const q = query(
      applicationsRef,
      where("recCode", ">=", yearPrefix),
      where("recCode", "<", `SPUP_${year + 1}_`),
      orderBy("recCode", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    // If no applications found for this year, start with 0001
    if (querySnapshot.empty) {
      return "0001";
    }
    
    // Get the latest code
    const latestRecCode = querySnapshot.docs[0].data().recCode;
    
    // Extract the sequential number part (format is SPUP_YYYY_NNNN_XX_YY)
    const parts = latestRecCode.split('_');
    if (parts.length >= 3) {
      const currentNum = parseInt(parts[2], 10);
      const nextNum = currentNum + 1;
      // Pad with leading zeros to make it 4 digits
      return nextNum.toString().padStart(4, '0');
    }
    
    // Fallback to 0001 if we can't parse the number for any reason
    return "0001";
  } catch (error) {
    console.error("Error getting next sequential number:", error);
    // Return a safe default in case of error
    return "0001";
  }
}

/**
 * Format a principal investigator name to get the initials
 * 
 * @param name Full name of the investigator
 * @returns Two-letter initials (first and last name)
 */
export function getInvestigatorInitials(name: string): string {
  if (!name) return '';
  
  const nameParts = name.split(' ');
  let initials = '';
  
  // Get first letter of first name
  if (nameParts.length > 0) {
    initials += nameParts[0][0] || '';
  }
  
  // Get first letter of last name (assuming last name is the last part)
  if (nameParts.length > 1) {
    initials += nameParts[nameParts.length - 1][0] || '';
  }
  
  return initials.toUpperCase();
} 