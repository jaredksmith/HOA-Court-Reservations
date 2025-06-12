<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, authActions } from '$lib/stores/auth';
	import { page } from '$app/stores';
	
	// Initialize auth state on app load
	onMount(async () => {
		try {
			// Check if user is already authenticated
			const response = await fetch('/api/auth/me');
			if (response.ok) {
				const { user, profile } = await response.json();
				authActions.setUser(user, profile);
			} else {
				authActions.initialize();
			}
		} catch (error) {
			console.error('Failed to initialize auth:', error);
			authActions.initialize();
		}
	});
	
	$: isAuthPage = $page.route.id?.startsWith('/auth');
</script>

<svelte:head>
	<title>HOA Court Reservations</title>
	<meta name="description" content="HOA Court Reservations PWA for managing pickleball court bookings" />
</svelte:head>

<div class="app">
	{#if !isAuthPage && $authStore.user}
		<nav class="main-nav">
			<div class="nav-container">
				<a href="/" class="logo">Court Reservations</a>
				
				<div class="nav-links">
					<a href="/booking" class:active={$page.route.id?.startsWith('/booking')}>
						Bookings
					</a>
					<a href="/profile" class:active={$page.route.id?.startsWith('/profile')}>
						Profile
					</a>
					{#if $authStore.profile?.is_admin}
						<a href="/admin" class:active={$page.route.id?.startsWith('/admin')}>
							Admin
						</a>
					{/if}
				</div>
				
				<div class="user-menu">
					<span class="user-name">{$authStore.profile?.full_name || $authStore.user?.email}</span>
					<form action="/api/auth/logout" method="post">
						<button type="submit" class="logout-btn">Logout</button>
					</form>
				</div>
			</div>
		</nav>
	{/if}
	
	<main class="main-content" class:with-nav={!isAuthPage && $authStore.user}>
		<slot />
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f8f9fa;
	}
	
	:global(*) {
		box-sizing: border-box;
	}
	
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.main-nav {
		background: white;
		border-bottom: 1px solid #dee2e6;
		padding: 0 1rem;
	}
	
	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 60px;
	}
	
	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: #007bff;
		text-decoration: none;
	}
	
	.nav-links {
		display: flex;
		gap: 2rem;
	}
	
	.nav-links a {
		color: #6c757d;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 0;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}
	
	.nav-links a:hover,
	.nav-links a.active {
		color: #007bff;
		border-bottom-color: #007bff;
	}
	
	.user-menu {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.user-name {
		font-size: 0.875rem;
		color: #6c757d;
	}
	
	.logout-btn {
		background: none;
		border: 1px solid #dc3545;
		color: #dc3545;
		padding: 0.375rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.logout-btn:hover {
		background: #dc3545;
		color: white;
	}
	
	.main-content {
		flex: 1;
		padding: 2rem 1rem;
	}
	
	.main-content.with-nav {
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}
	
	@media (max-width: 768px) {
		.nav-container {
			flex-direction: column;
			height: auto;
			padding: 1rem 0;
			gap: 1rem;
		}
		
		.nav-links {
			gap: 1rem;
		}
		
		.user-menu {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.main-content {
			padding: 1rem;
		}
	}
</style>
