<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  export let form;

  let emailInput: HTMLInputElement;

  // Check for error messages from URL params
  $: errorFromUrl = $page.url.searchParams.get('error');

  onMount(() => {
    // Focus the email input after component mounts
    if (emailInput) {
      emailInput.focus();
    }
  });
</script>

<svelte:head>
  <title>Reset Password - HOA Court Reservations</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <h1>Reset Password</h1>
    <p class="subtitle">Enter your email address and we'll send you a link to reset your password.</p>

    {#if form?.success}
      <div class="success">
        {form.message}
      </div>
      <div class="auth-links">
        <a href="/auth/login">Back to Login</a>
      </div>
    {:else}
      {#if errorFromUrl}
        <div class="error">
          {errorFromUrl === 'invalid_link' ? 'Invalid or expired reset link. Please request a new one.' : errorFromUrl}
        </div>
      {/if}

      {#if form?.error}
        <div class="error">{form.error}</div>
      {/if}

      <form method="POST" use:enhance>
        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            bind:this={emailInput} 
            required 
            placeholder="Enter your email address"
          />
        </div>

        <button type="submit">Send Reset Link</button>
      </form>

      <div class="auth-links">
        <a href="/auth/login">Back to Login</a>
        <a href="/auth/register">Need an account? Register</a>
      </div>
    {/if}
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .auth-card {
    background: white;
    border-radius: 12px;
    padding: 2.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }

  h1 {
    text-align: center;
    margin-bottom: 0.5rem;
    color: #1f2937;
    font-size: 1.875rem;
    font-weight: 600;
  }

  .subtitle {
    text-align: center;
    margin-bottom: 2rem;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  button:hover {
    background-color: #0056b3;
  }

  .success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .auth-links {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .auth-links a {
    color: #007bff;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .auth-links a:hover {
    text-decoration: underline;
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .auth-container {
      padding: 1rem;
    }

    .auth-card {
      padding: 2rem;
    }

    input {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }
</style>
