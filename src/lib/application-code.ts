/**
 * Generate a random string of specified length
 * @param length Length of the random string to generate
 * @returns Random string of specified length
 */
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
}

/**
 * Generate an application code in the format RECYYYYRC
 * where YYYY is the current year and RC is a random 6-character string
 * @returns Application code
 */
export function generateApplicationCode(): string {
  const currentYear = new Date().getFullYear();
  const randomChars = generateRandomString(6);
  
  return `REC${currentYear}${randomChars}`;
}

/**
 * Validate if a string is a valid application code
 * @param code The code to validate
 * @returns Whether the code is valid
 */
export function isValidApplicationCode(code: string): boolean {
  const regex = /^REC\d{4}[A-Z0-9]{6}$/;
  return regex.test(code);
} 