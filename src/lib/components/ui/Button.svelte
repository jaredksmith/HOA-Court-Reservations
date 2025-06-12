<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let disabled = false;
	export let loading = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let href: string | undefined = undefined;
	
	$: tag = href ? 'a' : 'button';
	$: props = href ? { href } : { type, disabled: disabled || loading };
</script>

<svelte:element 
	this={tag} 
	class="btn btn-{variant} btn-{size}" 
	class:loading
	{...props}
	on:click
>
	{#if loading}
		<span class="spinner"></span>
	{/if}
	<slot />
</svelte:element>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}
	
	.btn:disabled,
	.btn.loading {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	/* Sizes */
	.btn-small {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}
	
	.btn-medium {
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}
	
	.btn-large {
		padding: 0.75rem 1.5rem;
		font-size: 1.125rem;
	}
	
	/* Variants */
	.btn-primary {
		background: #007bff;
		color: white;
	}
	
	.btn-primary:hover:not(:disabled):not(.loading) {
		background: #0056b3;
	}
	
	.btn-secondary {
		background: #6c757d;
		color: white;
	}
	
	.btn-secondary:hover:not(:disabled):not(.loading) {
		background: #545b62;
	}
	
	.btn-danger {
		background: #dc3545;
		color: white;
	}
	
	.btn-danger:hover:not(:disabled):not(.loading) {
		background: #c82333;
	}
	
	.btn-success {
		background: #28a745;
		color: white;
	}
	
	.btn-success:hover:not(:disabled):not(.loading) {
		background: #1e7e34;
	}
	
	/* Loading spinner */
	.spinner {
		width: 1em;
		height: 1em;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
