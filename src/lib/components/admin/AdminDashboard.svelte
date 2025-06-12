<script lang="ts">
	// Admin dashboard component placeholder
	export let bookingStats: {
		totalBookings: number;
		pendingBookings: number;
		confirmedBookings: number;
		cancelledBookings: number;
	} = {
		totalBookings: 0,
		pendingBookings: 0,
		confirmedBookings: 0,
		cancelledBookings: 0
	};
	
	export let userStats: {
		totalUsers: number;
		activeUsers: number;
	} = {
		totalUsers: 0,
		activeUsers: 0
	};
</script>

<div class="admin-dashboard">
	<h2>Admin Dashboard</h2>
	
	<div class="stats-grid">
		<div class="stat-card">
			<h3>Total Bookings</h3>
			<div class="stat-value">{bookingStats.totalBookings}</div>
		</div>
		
		<div class="stat-card">
			<h3>Pending Bookings</h3>
			<div class="stat-value pending">{bookingStats.pendingBookings}</div>
		</div>
		
		<div class="stat-card">
			<h3>Confirmed Bookings</h3>
			<div class="stat-value confirmed">{bookingStats.confirmedBookings}</div>
		</div>
		
		<div class="stat-card">
			<h3>Cancelled Bookings</h3>
			<div class="stat-value cancelled">{bookingStats.cancelledBookings}</div>
		</div>
		
		<div class="stat-card">
			<h3>Total Users</h3>
			<div class="stat-value">{userStats.totalUsers}</div>
		</div>
		
		<div class="stat-card">
			<h3>Active Users</h3>
			<div class="stat-value">{userStats.activeUsers}</div>
		</div>
	</div>
	
	<div class="admin-actions">
		<h3>Quick Actions</h3>
		<div class="action-buttons">
			<a href="/admin/bookings" class="action-btn">Manage Bookings</a>
			<a href="/admin/users" class="action-btn">Manage Users</a>
			<a href="/admin/settings" class="action-btn">System Settings</a>
		</div>
	</div>
</div>

<style>
	.admin-dashboard {
		padding: 1rem;
	}
	
	.admin-dashboard h2 {
		margin-bottom: 2rem;
		color: #333;
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}
	
	.stat-card {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1.5rem;
		text-align: center;
	}
	
	.stat-card h3 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: #6c757d;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.stat-value {
		font-size: 2rem;
		font-weight: 600;
		color: #333;
	}
	
	.stat-value.pending {
		color: #ffa500;
	}
	
	.stat-value.confirmed {
		color: #28a745;
	}
	
	.stat-value.cancelled {
		color: #dc3545;
	}
	
	.admin-actions h3 {
		margin-bottom: 1rem;
		color: #333;
	}
	
	.action-buttons {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.action-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #007bff;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}
	
	.action-btn:hover {
		background: #0056b3;
	}
	
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
		
		.action-buttons {
			flex-direction: column;
		}
	}
</style>
