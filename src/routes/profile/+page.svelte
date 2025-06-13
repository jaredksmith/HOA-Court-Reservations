<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import PhoneInput from '$lib/components/ui/PhoneInput.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { normalizePhoneNumber, isValidPhoneNumber } from '$lib/utils/phone';
  
  export let data;
  export let form;

  let isEditing = false;
  let phoneNumber = data.profile.phone_number || '';
  let phoneError: string | null = null;
  let isSubmitting = false;

  // Form validation
  function validatePhone() {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!isValidPhoneNumber(normalized)) {
      phoneError = 'Please enter a valid phone number';
      return false;
    }
    phoneError = null;
    return true;
  }

  function handleSubmit() {
    if (!validatePhone()) {
      return;
    }
    isSubmitting = true;
  }

  // Reset form state when switching between edit/view modes
  function toggleEdit() {
    if (isEditing) {
      // Reset to original values when canceling
      phoneNumber = data.profile.phone_number || '';
      phoneError = null;
    }
    isEditing = !isEditing;
  }

  // Show success/error messages
  $: if (form?.success) {
    isEditing = false;
    isSubmitting = false;
  }
  
  $: if (form?.error) {
    isSubmitting = false;
  }
</script>

<svelte:head>
  <title>Profile - HOA Court Reservations</title>
</svelte:head>

<div class="profile-page">
  <div class="profile-header">
    <h1>My Profile</h1>
    <p>Manage your account information and preferences</p>
  </div>

  {#if form?.success}
    <div class="alert alert-success">
      {form.message}
    </div>
  {/if}

  {#if form?.error}
    <div class="alert alert-error">
      {form.error}
    </div>
  {/if}

  <div class="profile-content">
    <!-- Profile Information Card -->
    <div class="profile-card">
      <div class="card-header">
        <h2>Personal Information</h2>
        {#if !isEditing}
          <Button variant="secondary" size="small" on:click={toggleEdit}>
            Edit Profile
          </Button>
        {/if}
      </div>

      {#if isEditing}
        <!-- Edit Form -->
        <form method="POST" action="?/updateProfile" use:enhance on:submit={handleSubmit}>
          <div class="form-grid">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input 
                type="text" 
                id="fullName" 
                name="fullName" 
                value={data.profile.full_name}
                required 
              />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={data.user.email}
                disabled
                title="Email cannot be changed. Contact your HOA administrator if you need to update your email."
              />
              <small>Email cannot be changed</small>
            </div>

            <div class="form-group">
              <PhoneInput
                bind:value={phoneNumber}
                error={phoneError}
                required={true}
                label="Phone Number"
                id="phoneNumber"
                name="phoneNumber"
              />
            </div>

            <div class="form-group">
              <label for="householdId">Household ID</label>
              <input 
                type="text" 
                id="householdId" 
                name="householdId" 
                value={data.profile.household_id}
                required 
              />
              <small>Your household identifier (e.g., unit number, address)</small>
            </div>
          </div>

          <div class="form-actions">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" on:click={toggleEdit}>
              Cancel
            </Button>
          </div>
        </form>
      {:else}
        <!-- View Mode -->
        <div class="profile-info">
          <div class="info-grid">
            <div class="info-item">
              <label>Full Name</label>
              <span>{data.profile.full_name}</span>
            </div>

            <div class="info-item">
              <label>Email</label>
              <span>{data.user.email}</span>
            </div>

            <div class="info-item">
              <label>Phone Number</label>
              <span>{data.profile.phone_number}</span>
            </div>

            <div class="info-item">
              <label>Household ID</label>
              <span>{data.profile.household_id}</span>
            </div>

            <div class="info-item">
              <label>Role</label>
              <span class="role-badge role-{data.profile.role}">
                {data.profile.role === 'super_admin' ? 'Super Admin' : 
                 data.profile.role === 'hoa_admin' ? 'HOA Admin' : 'Member'}
              </span>
            </div>

            <div class="info-item">
              <label>Member Since</label>
              <span>{new Date(data.profile.joined_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- HOA Information Card -->
    <div class="profile-card">
      <div class="card-header">
        <h2>HOA Information</h2>
      </div>

      <div class="hoa-info">
        <div class="info-grid">
          <div class="info-item">
            <label>HOA Name</label>
            <span>{data.hoa.name}</span>
          </div>

          <div class="info-item">
            <label>Address</label>
            <span>{data.hoa.address || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <label>Contact Email</label>
            <span>{data.hoa.contact_email || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <label>Contact Phone</label>
            <span>{data.hoa.contact_phone || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <label>Total Courts</label>
            <span>{data.hoa.total_courts}</span>
          </div>

          <div class="info-item">
            <label>Court Names</label>
            <span>{data.hoa.court_names?.join(', ') || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Hour Balance Card -->
    <div class="profile-card">
      <div class="card-header">
        <h2>Hour Balance</h2>
      </div>

      <div class="hour-balance">
        <div class="balance-grid">
          <div class="balance-item prime">
            <div class="balance-value">{data.profile.prime_hours}</div>
            <div class="balance-label">Prime Hours</div>
            <div class="balance-time">({data.hoa.prime_time_start} - {data.hoa.prime_time_end})</div>
          </div>

          <div class="balance-item standard">
            <div class="balance-value">{data.profile.standard_hours}</div>
            <div class="balance-label">Standard Hours</div>
            <div class="balance-time">(All other times)</div>
          </div>
        </div>

        <div class="balance-info">
          <small>
            Last reset: {new Date(data.profile.last_reset).toLocaleDateString()}
          </small>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .profile-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .profile-header {
    margin-bottom: 2rem;
  }

  .profile-header h1 {
    font-size: 2rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
  }

  .profile-header p {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }

  .profile-content {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
  }

  .profile-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--color-border);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .card-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .form-grid,
  .info-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .form-group input {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 1rem;
  }

  .form-group input:disabled {
    background-color: var(--color-background-secondary);
    color: var(--color-text-secondary);
    cursor: not-allowed;
  }

  .form-group small {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-item label {
    font-weight: 500;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-item span {
    color: var(--color-text-primary);
    font-size: 1rem;
  }

  .role-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .role-super_admin {
    background-color: #fef3c7;
    color: #92400e;
  }

  .role-hoa_admin {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .role-member {
    background-color: #f3f4f6;
    color: #374151;
  }

  .balance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .balance-item {
    text-align: center;
    padding: 1.5rem;
    border-radius: 8px;
    border: 2px solid;
  }

  .balance-item.prime {
    border-color: #f59e0b;
    background-color: #fef3c7;
  }

  .balance-item.standard {
    border-color: #10b981;
    background-color: #d1fae5;
  }

  .balance-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .balance-item.prime .balance-value {
    color: #92400e;
  }

  .balance-item.standard .balance-value {
    color: #065f46;
  }

  .balance-label {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .balance-time {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .balance-info {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }

  .alert {
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
  }

  .alert-success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
  }

  .alert-error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
  }

  @media (max-width: 768px) {
    .profile-page {
      padding: 1rem;
    }

    .form-grid,
    .info-grid {
      grid-template-columns: 1fr;
    }

    .balance-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
