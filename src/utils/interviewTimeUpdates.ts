
/**
 * Generates a system message to update the AI on the remaining interview time.
 * This is sent as a user message (hidden from UI) to guide the AI's pacing.
 * 
 * @param remainingMinutes Number of minutes remaining in the interview
 * @returns The formatted system message string
 */
export const getTimeUpdateMessage = (remainingMinutes: number): string => {
  const minutes = Math.max(0, Math.ceil(remainingMinutes));
  
  return `[SYSTEM UPDATE] The interview has ${minutes} minutes remaining. Please pace your questions accordingly to ensure you cover all necessary topics before the session ends.`;
};
