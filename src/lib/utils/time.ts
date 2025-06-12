/**
 * Utility functions for time and date handling
 */

/**
 * Check if a given time falls within prime time hours
 * Prime time is typically defined as weekday evenings and weekend days
 */
export function checkIsPrimeTime(date: Date): boolean {
	const day = date.getDay(); // 0 = Sunday, 6 = Saturday
	const hour = date.getHours();
	
	// Weekend (Saturday and Sunday) - all day is prime time
	if (day === 0 || day === 6) {
		return hour >= 8 && hour < 20; // 8 AM to 8 PM
	}
	
	// Weekdays - evening hours are prime time
	return hour >= 17 && hour < 21; // 5 PM to 9 PM
}

/**
 * Format a date for display in the UI
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Format a time for display in the UI
 */
export function formatTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});
}

/**
 * Format a full date and time for display
 */
export function formatDateTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

/**
 * Get the next bi-weekly reset date (every other Monday at 3 AM)
 */
export function getNextResetDate(): Date {
	const now = new Date();
	const nextMonday = new Date(now);
	
	// Find next Monday
	const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
	nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
	nextMonday.setHours(3, 0, 0, 0);
	
	// Check if this Monday is a reset Monday (bi-weekly)
	// For simplicity, we'll use a fixed epoch date to calculate bi-weekly cycles
	const epoch = new Date('2024-01-01'); // First Monday of 2024
	const weeksSinceEpoch = Math.floor((nextMonday.getTime() - epoch.getTime()) / (7 * 24 * 60 * 60 * 1000));
	
	if (weeksSinceEpoch % 2 === 0) {
		return nextMonday;
	} else {
		// Add another week to get the next bi-weekly reset
		nextMonday.setDate(nextMonday.getDate() + 7);
		return nextMonday;
	}
}

/**
 * Check if a booking is within the last-minute booking window (12 hours)
 */
export function isLastMinuteBooking(startTime: Date | string): boolean {
	const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
	const now = new Date();
	const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
	
	return hoursUntilStart <= 12;
}

/**
 * Calculate the expiration time for a pending booking (30 minutes from now)
 */
export function calculateExpirationTime(): Date {
	const expiration = new Date();
	expiration.setMinutes(expiration.getMinutes() + 30);
	return expiration;
}

/**
 * Check if a booking has expired
 */
export function isBookingExpired(expiresAt: Date | string): boolean {
	const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
	return new Date() > expiration;
}
