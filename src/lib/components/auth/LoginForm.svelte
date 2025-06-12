<script lang="ts">
	// Login form component placeholder
	export let onSubmit: (email: string, password: string) => Promise<void>;
	
	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			await onSubmit(email, password);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="login-form">
	<h2>Login</h2>
	
	{#if error}
		<div class="error">{error}</div>
	{/if}
	
	<div class="field">
		<label for="email">Email</label>
		<input 
			id="email" 
			type="email" 
			bind:value={email} 
			required 
			disabled={loading}
		/>
	</div>
	
	<div class="field">
		<label for="password">Password</label>
		<input 
			id="password" 
			type="password" 
			bind:value={password} 
			required 
			disabled={loading}
		/>
	</div>
	
	<button type="submit" disabled={loading}>
		{loading ? 'Logging in...' : 'Login'}
	</button>
</form>

<style>
	.login-form {
		max-width: 400px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.field {
		margin-bottom: 1rem;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}
	
	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}
	
	button {
		width: 100%;
		padding: 0.75rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
	}
	
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.error {
		background: #fee;
		color: #c33;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
</style>
