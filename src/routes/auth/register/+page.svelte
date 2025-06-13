<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PhoneInput from '$lib/components/ui/PhoneInput.svelte';
  import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
  import { normalizePhoneNumber, isValidPhoneNumber } from '$lib/utils/phone';

  export let form;

  let phoneNumber = '';
  let phoneError: string | null = null;
  let password = '';
  let emailInput: HTMLInputElement;

  // Get invitation code from URL params
  $: invitationCode = $page.url.searchParams.get('code') || '';
  $: hoaName = $page.url.searchParams.get('hoa') || '';

  onMount(() => {
    // Focus the email input after component mounts
    if (emailInput) {
      emailInput.focus();
    }
  });

  // Validate phone number before form submission
  function validatePhone() {
    if (!phoneNumber.trim()) {
      phoneError = 'Phone number is required';
      return false;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      phoneError = 'Please enter a valid phone number';
      return false;
    }

    phoneError = null;
    return true;
  }

  // Enhanced form submission with phone validation
  function handleSubmit() {
    const isPhoneValid = validatePhone();

    if (!isPhoneValid) {
      return false; // Prevent form submission
    }

    return true; // Allow form submission
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Register</h1>

    {#if hoaName}
      <div class="hoa-info">
        <h2>Join {hoaName}</h2>
        <p>You've been invited to join this HOA community.</p>
      </div>
    {/if}

    {#if form?.error}
      <div class="error">{form.error}</div>
    {/if}

    <form method="POST" use:enhance on:submit={handleSubmit}>
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
          autocomplete="new-password"
          error={form?.error && form.error.toLowerCase().includes('password') ? form.error : null}
        />
        <!-- Hidden input to ensure form submission works -->
        <input type="hidden" name="password" value={password} />
      </div>

      <div class="form-group">
        <label for="fullName">Full Name</label>
        <input type="text" id="fullName" name="fullName" required />
      </div>

    <!-- Phone Number Input -->
    <PhoneInput
      bind:value={phoneNumber}
      error={phoneError}
      required={true}
      label="Phone Number"
      id="phoneNumber"
      name="phoneNumber"
    />

    <!-- Hidden field to pass normalized phone number to server -->
    <input
      type="hidden"
      name="phoneNumber"
      value={normalizePhoneNumber(phoneNumber)}
    />

    <!-- Hidden field for invitation code -->
    {#if invitationCode}
      <input type="hidden" name="invitationCode" value={invitationCode} />
    {:else}
      <div class="form-group">
        <label for="invitationCode">Invitation Code</label>
        <input type="text" id="invitationCode" name="invitationCode" required />
        <small>Enter the invitation code provided by your HOA</small>
      </div>
    {/if}

    <div class="form-group">
      <label for="householdId">Household ID</label>
      <input type="text" id="householdId" name="householdId" required />
      <small>Your household identifier (e.g., unit number, address)</small>
    </div>

      <button type="submit">Register</button>
    </form>

    <div class="auth-links">
      <a href="/auth/login">Already have an account? Login</a>
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

  small {
    display: block;
    color: #6c757d;
    margin-top: 0.25rem;
    font-size: 0.875rem;
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

  .hoa-info {
    background-color: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .hoa-info h2 {
    margin: 0 0 0.5rem;
    color: #1976d2;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .hoa-info p {
    margin: 0;
    color: #424242;
    font-size: 0.875rem;
  }
</style>