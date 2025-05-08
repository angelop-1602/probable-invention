export * from './application.service';
export * from './application.types';
export * from './application.utils';

export { ApplicationService } from './application.service';

/**
 * Generate a SPUP REC code in the format SPUP_YYYY_NNNN_TR_FL
 * where YYYY is the current year and NNNN is a sequential number with leading zeros
 * based on the count of applications already in the system
 * @param principalInvestigator Name of the principal investigator (for initials)
 * @param researchType Type of research ("EX" for Exempted or "SR" for Social/Behavioral)
 * @returns SPUP REC code
 */
export async function generateSpupRecCode(
  principalInvestigator: string = "",
  researchType: string = "SR"
): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Default to first application (0001)
  let sequentialNumber = "0001"; 
  
  try {
    // Import required functions from Firestore
    const { collection, query, where, getDocs, getCountFromServer } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    
    // Create a query to count applications from the current year
    const applicationsRef = collection(db, "protocolReviewApplications");
    
    // First try to use the aggregation query (more efficient)
    try {
      // Count all applications that have a recCode starting with the current year
      const yearString = currentYear.toString();
      const yearQuery = query(
        applicationsRef, 
        where("recCode", ">=", `SPUP_${yearString}_`),
        where("recCode", "<", `SPUP_${yearString+1}_`)
      );
      
      // Get count of applications from this year
      const countSnapshot = await getCountFromServer(yearQuery);
      const count = countSnapshot.data().count;
      
      // Generate sequential number (current count + 1) with leading zeros
      sequentialNumber = (count + 1).toString().padStart(4, '0');
    } catch (aggregationError) {
      console.error("Error using aggregation query for counting:", aggregationError);
      
      // Fallback: manually fetch and count documents if aggregation fails
      const yearString = currentYear.toString();
      const yearQuery = query(
        applicationsRef, 
        where("recCode", ">=", `SPUP_${yearString}_`),
        where("recCode", "<", `SPUP_${yearString+1}_`)
      );
      
      const querySnapshot = await getDocs(yearQuery);
      const count = querySnapshot.size;
      
      // Generate sequential number (current count + 1) with leading zeros
      sequentialNumber = (count + 1).toString().padStart(4, '0');
    }
  } catch (error) {
    console.error("Error counting applications for SPUP REC code:", error);
    // Even in the error case, we'll default to 0001 as set at the beginning
    // This ensures we don't use random numbers
  }
  
  // Determine research type code (default to SR if not specified)
  const typeCode = researchType.toUpperCase() === "EX" ? "EX" : "SR";
  
  // Extract initials from principal investigator's name
  let initials = "FL";
  if (principalInvestigator) {
    const nameParts = principalInvestigator.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      // Get first letter of first name and first letter of last name
      const firstName = nameParts[0].charAt(0).toUpperCase();
      const lastName = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      initials = `${firstName}${lastName}`;
    } else if (nameParts.length === 1) {
      // If only one name is provided, use the first two letters
      initials = nameParts[0].substring(0, 2).toUpperCase();
    }
  }
  
  // Construct the SPUP REC code
  return `SPUP_${currentYear}_${sequentialNumber}_${typeCode}_${initials}`;
} 