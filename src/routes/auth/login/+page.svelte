<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import PasswordInput from '$lib/components/ui/PasswordInput.svelte';

  export let form;

  let password = '';
  let emailInput: HTMLInputElement;

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
    max-width: 500px;
    margin: 0 auto;
    padding: 2rem;
  }

  .auth-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #dee2e6;
  }

  .auth-card h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 1.5rem;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
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
</style>