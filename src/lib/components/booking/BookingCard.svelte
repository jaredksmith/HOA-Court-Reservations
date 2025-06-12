<script lang="ts">
	import type { Booking } from '$lib/types';
	
	export let booking: Booking;
	export let onAccept: ((bookingId: string) => Promise<void>) | undefined = undefined;
	export let onDecline: ((bookingId: string) => Promise<void>) | undefined = undefined;
	export let onCancel: ((bookingId: string) => Promise<void>) | undefined = undefined;
	
	let loading = false;
	
	async function handleAction(action: () => Promise<void>) {
		loading = true;
		try {
			await action();
		} catch (error) {
			console.error('Action failed:', error);
		} finally {
			loading = false;
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="booking-card" class:pending={booking.status === 'pending'}>
	<div class="booking-header">
		<h3>Court {booking.courts.join(', ')}</h3>
		<span class="status status-{booking.status}">{booking.status}</span>
	</div>
	
	<div class="booking-details">
		<div class="time">
			<strong>{formatDate(booking.start_time)}</strong>
			<span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
		</div>
		
		<div class="players">
			<span>{booking.total_players} players ({booking.guest_count} guests)</span>
		</div>
		
		{#if booking.status === 'pending'}
			<div class="expires">
				Expires: {formatDate(booking.expires_at)}
			</div>
		{/if}
	</div>
	
	{#if booking.status === 'pending' && (onAccept || onDecline)}
		<div class="actions">
			{#if onAccept}
				<button 
					class="accept" 
					disabled={loading}
					on:click={() => handleAction(() => onAccept(booking.id))}
				>
					Accept
				</button>
			{/if}
			
			{#if onDecline}
				<button 
					class="decline" 
					disabled={loading}
					on:click={() => handleAction(() => onDecline(booking.id))}
				>
					Decline
				</button>
			{/if}
		</div>
	{/if}
	
	{#if onCancel && (booking.status === 'pending' || booking.status === 'confirmed')}
		<div class="actions">
			<button 
				class="cancel" 
				disabled={loading}
				on:click={() => handleAction(() => onCancel(booking.id))}
			>
				Cancel Booking
			</button>
		</div>
	{/if}
</div>

<style>
	.booking-card {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		background: white;
	}
	
	.booking-card.pending {
		border-color: #ffa500;
		background: #fff8f0;
	}
	
	.booking-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	
	.booking-header h3 {
		margin: 0;
		color: #333;
	}
	
	.status {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.status-pending {
		background: #ffa500;
		color: white;
	}
	
	.status-confirmed {
		background: #28a745;
		color: white;
	}
	
	.status-cancelled {
		background: #dc3545;
		color: white;
	}
	
	.booking-details {
		margin-bottom: 1rem;
	}
	
	.time {
		margin-bottom: 0.5rem;
	}
	
	.time strong {
		display: block;
		color: #333;
	}
	
	.time span {
		color: #666;
		font-size: 0.875rem;
	}
	
	.players, .expires {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.25rem;
	}
	
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	
	.actions button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		flex: 1;
	}
	
	.accept {
		background: #28a745;
		color: white;
	}
	
	.decline, .cancel {
		background: #dc3545;
		color: white;
	}
	
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
