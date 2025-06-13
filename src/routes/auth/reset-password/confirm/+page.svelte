<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import PasswordInput from '$lib/components/ui/PasswordInput.svelte';

  export let data;
  export let form;

  let password = '';
  let confirmPassword = '';

  onMount(() => {
    // Focus will be handled by the PasswordInput component
  });
</script>

<svelte:head>
  <title>Set New Password - HOA Court Reservations</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <h1>Set New Password</h1>
    <p class="subtitle">Enter your new password below.</p>

    {#if form?.error}
      <div class="error">{form.error}</div>
    {/if}

    <form method="POST" use:enhance>
      <!-- Hidden field for reset token -->
      <input type="hidden" name="token" value={data.token} />

      <div class="form-group">
        <PasswordInput
          bind:value={password}
          id="password"
          name="password"
          label="New Password"
          required={true}
          autocomplete="new-password"
          placeholder="Enter your new password"
        />
        <small>Password must be at least 8 characters long</small>
      </div>

      <div class="form-group">
        <PasswordInput
          bind:value={confirmPassword}
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm New Password"
          required={true}
          autocomplete="new-password"
          placeholder="Confirm your new password"
        />
      </div>

      <button type="submit">Update Password</button>
    </form>

    <div class="auth-links">
      <a href="/auth/login">Back to Login</a>
    </div>
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

  .form-group small {
    display: block;
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
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
  }
</style>
