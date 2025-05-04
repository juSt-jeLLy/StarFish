/**
 * Convert a human-readable interval string to seconds
 * @param interval The interval (e.g., 'daily', 'weekly', 'monthly', etc.)
 * @returns The interval in seconds
 */
export function convertIntervalToSeconds(interval: string): number {
  const day = 24 * 60 * 60; // seconds in a day
  
  switch (interval) {
    case 'daily':
      return day;
    case 'weekly':
      return 7 * day;
    case 'monthly':
      return 30 * day;
    case 'quarterly':
      return 90 * day;
    case 'yearly':
      return 365 * day;
    default:
      return 30 * day; // default to monthly
  }
}

/**
 * Format a date from a Unix timestamp (seconds since epoch)
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateFromTimestamp(timestamp: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

/**
 * Get the next payment date based on the current time and interval
 * @param intervalInSeconds Interval in seconds 
 * @returns Unix timestamp for the next payment date
 */
export function getNextPaymentDate(intervalInSeconds: number): number {
  const now = Math.floor(Date.now() / 1000); // current time in seconds
  return now + intervalInSeconds;
}

/**
 * Format an interval in seconds to a human-readable string
 * @param seconds Interval in seconds
 * @returns Human-readable interval (e.g., 'daily', 'weekly', etc.)
 */
export function formatIntervalFromSeconds(seconds: number): string {
  const days = seconds / 86400;
  if (days === 1) return 'daily';
  if (days === 7) return 'weekly';
  if (days >= 28 && days <= 31) return 'monthly';
  if (days >= 90 && days <= 92) return 'quarterly';
  if (days >= 365 && days <= 366) return 'yearly';
  return `${days} days`;
} 