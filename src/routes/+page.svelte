<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { bookingStore, bookingActions } from '$lib/stores/booking';
	import BookingCard from '$lib/components/booking/BookingCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	
	let loading = true;
	
	// Reactive statement to handle auth state changes
	$: if ($authStore.initialized && !$authStore.user) {
		console.log('🔄 No user found, redirecting to login');
		goto('/auth/login');
	}

	onMount(async () => {
		// Only load bookings if user is authenticated
		if ($authStore.user) {
			await loadBookings();
		}
		loading = false;
	});

	async function loadBookings() {
		try {
			const response = await fetch('/api/bookings/my');
			if (response.ok) {
				const bookings = await response.json();
				bookingActions.setBookings(bookings);
			}
		} catch (error) {
			console.error('Failed to load bookings:', error);
		}
	}

	// Load bookings when user becomes available
	$: if ($authStore.user && $authStore.initialized) {
		loadBookings();
	}
	
	async function handleAcceptBooking(bookingId: string) {
		try {
			const response = await fetch(`/api/bookings/${bookingId}/accept`, {
				method: 'POST'
			});
			
			if (response.ok) {
				const updatedBooking = await response.json();
				bookingActions.updateBooking(bookingId, updatedBooking);
			}
		} catch (error) {
			console.error('Failed to accept booking:', error);
		}
	}
	
	async function handleDeclineBooking(bookingId: string) {
		try {
			const response = await fetch(`/api/bookings/${bookingId}/decline`, {
				method: 'POST'
			});
			
			if (response.ok) {
				bookingActions.removeBooking(bookingId);
			}
		} catch (error) {
			console.error('Failed to decline booking:', error);
		}
	}
	
	$: upcomingBookings = $bookingStore.bookings.filter(b => 
		b.status === 'confirmed' && new Date(b.start_time) > new Date()
	);
	
	$: pendingInvitations = $bookingStore.pendingBookings.filter(b => 
		b.organizer_id !== $authStore.user?.id
	);
</script>

<svelte:head>
	<title>Dashboard - HOA Court Reservations</title>
</svelte:head>

{#if !$authStore.user}
	<div class="loading">Loading...</div>
{:else}
	<div class="dashboard">
		<header class="dashboard-header">
			<h1>Welcome back, {$authStore.profile?.full_name || $authStore.user.email}!</h1>
			
			{#if $authStore.profile}
				<div class="hour-balance">
					<div class="balance-item">
						<span class="label">Prime Hours</span>
						<span class="value">{$authStore.profile.prime_hours}</span>
					</div>
					<div class="balance-item">
						<span class="label">Standard Hours</span>
						<span class="value">{$authStore.profile.standard_hours}</span>
					</div>
				</div>
			{/if}
		</header>
		
		<div class="quick-actions">
			<Button href="/booking/create" variant="primary" size="large">
				Create New Booking
			</Button>
			<Button href="/booking" variant="secondary">
				View All Bookings
			</Button>
		</div>
		
		{#if pendingInvitations.length > 0}
			<section class="pending-invitations">
				<h2>Pending Invitations ({pendingInvitations.length})</h2>
				<div class="booking-list">
					{#each pendingInvitations as booking}
						<BookingCard 
							{booking} 
							onAccept={handleAcceptBooking}
							onDecline={handleDeclineBooking}
						/>
					{/each}
				</div>
			</section>
		{/if}
		
		{#if upcomingBookings.length > 0}
			<section class="upcoming-bookings">
				<h2>Upcoming Bookings</h2>
				<div class="booking-list">
					{#each upcomingBookings.slice(0, 3) as booking}
						<BookingCard {booking} />
					{/each}
				</div>
				{#if upcomingBookings.length > 3}
					<Button href="/booking" variant="secondary" size="small">
						View All ({upcomingBookings.length})
					</Button>
				{/if}
			</section>
		{:else if !loading}
			<section class="no-bookings">
				<h2>No Upcoming Bookings</h2>
				<p>You don't have any confirmed bookings yet.</p>
				<Button href="/booking/create" variant="primary">
					Create Your First Booking
				</Button>
			</section>
		{/if}
		
		{#if loading}
			<div class="loading">Loading your bookings...</div>
		{/if}
	</div>
{/if}

<style>
	.dashboard {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.dashboard-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.dashboard-header h1 {
		color: #333;
		margin-bottom: 1rem;
	}
	
	.hour-balance {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1rem;
	}
	
	.balance-item {
		text-align: center;
		padding: 1rem;
		background: white;
		border-radius: 8px;
		border: 1px solid #dee2e6;
		min-width: 120px;
	}
	
	.balance-item .label {
		display: block;
		font-size: 0.875rem;
		color: #6c757d;
		margin-bottom: 0.25rem;
	}
	
	.balance-item .value {
		display: block;
		font-size: 1.5rem;
		font-weight: 600;
		color: #007bff;
	}
	
	.quick-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 3rem;
	}
	
	.pending-invitations,
	.upcoming-bookings,
	.no-bookings {
		margin-bottom: 2rem;
	}
	
	.pending-invitations h2,
	.upcoming-bookings h2,
	.no-bookings h2 {
		color: #333;
		margin-bottom: 1rem;
	}
	
	.booking-list {
		margin-bottom: 1rem;
	}
	
	.no-bookings {
		text-align: center;
		padding: 3rem 1rem;
		background: white;
		border-radius: 8px;
		border: 1px solid #dee2e6;
	}
	
	.no-bookings p {
		color: #6c757d;
		margin-bottom: 1.5rem;
	}
	
	.loading {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
	}
	
	@media (max-width: 768px) {
		.hour-balance {
			flex-direction: column;
			align-items: center;
		}
		
		.quick-actions {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
