import { writable } from 'svelte/store';
import type { Booking } from '$lib/types';

export interface BookingState {
	bookings: Booking[];
	pendingBookings: Booking[];
	loading: boolean;
	error: string | null;
}

const initialState: BookingState = {
	bookings: [],
	pendingBookings: [],
	loading: false,
	error: null
};

export const bookingStore = writable<BookingState>(initialState);

export const bookingActions = {
	setBookings: (bookings: Booking[]) => {
		bookingStore.update(state => ({
			...state,
			bookings,
			pendingBookings: bookings.filter(b => b.status === 'pending')
		}));
	},
	
	addBooking: (booking: Booking) => {
		bookingStore.update(state => ({
			...state,
			bookings: [...state.bookings, booking],
			pendingBookings: booking.status === 'pending' 
				? [...state.pendingBookings, booking]
				: state.pendingBookings
		}));
	},
	
	updateBooking: (bookingId: string, updates: Partial<Booking>) => {
		bookingStore.update(state => {
			const bookings = state.bookings.map(b => 
				b.id === bookingId ? { ...b, ...updates } : b
			);
			
			return {
				...state,
				bookings,
				pendingBookings: bookings.filter(b => b.status === 'pending')
			};
		});
	},
	
	removeBooking: (bookingId: string) => {
		bookingStore.update(state => ({
			...state,
			bookings: state.bookings.filter(b => b.id !== bookingId),
			pendingBookings: state.pendingBookings.filter(b => b.id !== bookingId)
		}));
	},
	
	setLoading: (loading: boolean) => {
		bookingStore.update(state => ({
			...state,
			loading
		}));
	},
	
	setError: (error: string | null) => {
		bookingStore.update(state => ({
			...state,
			error
		}));
	}
};
