<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PasswordInput from '$lib/components/ui/PasswordInput.svelte';

  export let form;

  let password = '';
  let emailInput: HTMLInputElement;

  // Check for success messages from URL params
  $: resetSuccess = $page.url.searchParams.get('reset') === 'success';
  $: registrationSuccess = $page.url.searchParams.get('registered') === 'true';

  onMount(() => {
    // Focus the email input after component mounts
    if (emailInput) {
      emailInput.focus();
    }
  });
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Login</h1>

    {#if resetSuccess}
      <div class="success">
        Your password has been successfully reset. You can now log in with your new password.
      </div>
    {/if}

    {#if registrationSuccess}
      <div class="success">
        Registration successful! You can now log in with your credentials.
      </div>
    {/if}

    {#if form?.error}
      <div class="error">{form.error}</div>
    {/if}

    <form method="POST" use:enhance>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" bind:this={emailInput} required />
      </div>

      <div class="form-group">
        <PasswordInput
          bind:value={password}
          id="password"
          name="password"
          label="Password"
          required={true}
          error={form?.error && form.error.toLowerCase().includes('password') ? form.error : null}
        />
        <!-- Hidden input to ensure form submission works -->
        <input type="hidden" name="password" value={password} />
      </div>

      <button type="submit">Login</button>
    </form>

    <div class="auth-links">
      <a href="/auth/register">Need an account? Register</a>
      <a href="/auth/reset-password">Forgot password?</a>
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

  .auth-card h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #1f2937;
    font-size: 1.875rem;
    font-weight: 600;
  }

  .form-group {
    margin-bottom: 1rem;
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

  .error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
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