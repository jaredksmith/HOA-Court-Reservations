<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import PhoneInput from '$lib/components/ui/PhoneInput.svelte';
  import { normalizePhoneNumber, isValidPhoneNumber } from '$lib/utils/phone';

  export let form;

  let phoneNumber = '';
  let phoneError: string | null = null;

  // Get invitation code from URL params
  $: invitationCode = $page.url.searchParams.get('code') || '';
  $: hoaName = $page.url.searchParams.get('hoa') || '';

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
      <input type="email" id="email" name="email" required />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required />
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

<style>
  .auth-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .error {
    color: red;
    margin-bottom: 1rem;
  }
  
  small {
    display: block;
    color: #666;
    margin-top: 0.25rem;
  }
  
  .auth-links {
    margin-top: 1rem;
  }

  .hoa-info {
    background-color: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .hoa-info h2 {
    margin: 0 0 0.5rem;
    color: #1976d2;
  }

  .hoa-info p {
    margin: 0;
    color: #424242;
  }
</style>