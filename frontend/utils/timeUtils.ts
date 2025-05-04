/**
 * Convert a human-readable interval string to seconds
 * @param interval The interval (e.g., 'daily', 'weekly', 'monthly', etc.)
 * @returns The interval in seconds
 */
export function convertIntervalToSeconds(interval: string): number {
  switch (interval.toLowerCase()) {
    case 'hourly':
      return 3600; // 60 * 60
    case 'daily':
      return 86400; // 24 * 60 * 60
    case 'weekly':
      return 604800; // 7 * 24 * 60 * 60
    case 'monthly':
      return 2592000; // 30 * 24 * 60 * 60 (approximation)
    case 'quarterly':
      return 7776000; // 90 * 24 * 60 * 60 (approximation)
    case 'yearly':
      return 31536000; // 365 * 24 * 60 * 60 (approximation)
    default:
      return 2592000; // Default to monthly if unknown
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
  if (!seconds || isNaN(seconds)) return 'unknown';

  // Define thresholds for different intervals
  const HOUR = 3600;
  const DAY = 86400;
  const WEEK = 604800;
  const MONTH = 2592000; // Approximate
  const QUARTER = 7776000; // Approximate
  const YEAR = 31536000; // Approximate

  // Find the closest interval
  if (seconds <= HOUR * 1.5) {
    return 'hourly';
  } else if (seconds <= DAY * 1.5) {
    return 'daily';
  } else if (seconds <= WEEK * 1.5) {
    return 'weekly';
  } else if (seconds <= MONTH * 1.5) {
    return 'monthly';
  } else if (seconds <= QUARTER * 1.5) {
    return 'quarterly';
  } else {
    return 'yearly';
  }
} 