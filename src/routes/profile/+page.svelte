<script lang="ts">
  import { enhance } from '$app/forms';
  import PhoneInput from '$lib/components/ui/PhoneInput.svelte';
  import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
  import StateSelect from '$lib/components/ui/StateSelect.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { normalizePhoneNumber, isValidPhoneNumber, formatPhoneForDisplay } from '$lib/utils/phone';
  
  export let data;
  export let form;

  let isEditing = false;
  let phoneNumber = formatPhoneForDisplay(data.profile.phone_number || '');
  let phoneError: string | null = null;
  let isSubmitting = false;

  // Password change variables (now integrated into Personal Information section)
  let isChangingPassword = false;
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let isPasswordSubmitting = false;

  // Address fields
  let streetAddress = data.profile.street_address || '';
  let city = data.profile.city || '';
  let state = data.profile.state || '';
  let zipCode = data.profile.zip_code || '';

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
      phoneNumber = formatPhoneForDisplay(data.profile.phone_number || '');
      streetAddress = data.profile.street_address || '';
      city = data.profile.city || '';
      state = data.profile.state || '';
      zipCode = data.profile.zip_code || '';
      phoneError = null;
      // Also reset password change state if it was open
      if (isChangingPassword) {
        togglePasswordChange();
      }
    }
    isEditing = !isEditing;
  }

  // Password change functions
  function togglePasswordChange() {
    if (isChangingPassword) {
      // Reset password fields when canceling
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    }
    isChangingPassword = !isChangingPassword;
  }

  function handlePasswordSubmit() {
    isPasswordSubmitting = true;
  }

  // Show success/error messages
  $: if (form?.success) {
    isEditing = false;
    isSubmitting = false;
    // Reset password form if password was changed successfully
    if (form.message?.includes('Password changed')) {
      isChangingPassword = false;
      isPasswordSubmitting = false;
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    }
  }

  $: if (form?.error) {
    isSubmitting = false;
    isPasswordSubmitting = false;
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
          <div class="header-actions">
            <Button variant="secondary" size="small" on:click={toggleEdit}>
              Edit Profile
            </Button>
            <Button variant="secondary" size="small" on:click={togglePasswordChange}>
              Change Password
            </Button>
          </div>
        {/if}
      </div>

      {#if isEditing}
        <!-- Edit Form -->
        <form method="POST" action="?/updateProfile" use:enhance on:submit={handleSubmit}>
          <div class="form-grid">
            <!-- Full Name - Full width -->
            <div class="form-row full-width">
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
            </div>

            <!-- Email and Phone Number - Side by side on desktop -->
            <div class="form-row two-columns">
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
            </div>

            <!-- Household ID - Full width -->
            <div class="form-row full-width">
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

            <!-- Street Address - Full width -->
            <div class="form-row full-width">
              <div class="form-group">
                <label for="streetAddress">Street Address</label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  bind:value={streetAddress}
                />
              </div>
            </div>

            <!-- City, State, ZIP Code - Three columns on desktop -->
            <div class="form-row three-columns">
              <div class="form-group city-field">
                <label for="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  bind:value={city}
                />
              </div>

              <div class="form-group state-field">
                <StateSelect
                  bind:value={state}
                  id="state"
                  name="state"
                  label="State"
                  placeholder="Select a state"
                />
              </div>

              <div class="form-group zip-field">
                <label for="zipCode">ZIP Code</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  bind:value={zipCode}
                  maxlength="10"
                  placeholder="12345"
                />
              </div>
            </div>
          </div>

          <!-- Password Change Section (when enabled) -->
          {#if isChangingPassword}
            <div class="password-change-section">
              <h3>Change Password</h3>
              <div class="form-grid">
                <div class="form-row full-width">
                  <div class="form-group">
                    <PasswordInput
                      bind:value={currentPassword}
                      id="currentPassword"
                      name="currentPassword"
                      label="Current Password"
                      required={true}
                      autocomplete="current-password"
                    />
                  </div>
                </div>

                <div class="form-row full-width">
                  <div class="form-group">
                    <PasswordInput
                      bind:value={newPassword}
                      id="newPassword"
                      name="newPassword"
                      label="New Password"
                      required={true}
                      autocomplete="new-password"
                    />
                    <small>Password must be at least 8 characters long</small>
                  </div>
                </div>

                <div class="form-row full-width">
                  <div class="form-group">
                    <PasswordInput
                      bind:value={confirmPassword}
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirm New Password"
                      required={true}
                      autocomplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <div class="form-actions">
            {#if !isChangingPassword}
              <!-- Profile update actions -->
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            {/if}
            <Button type="button" variant="secondary" on:click={toggleEdit}>
              Cancel
            </Button>
          </div>
        </form>

        <!-- Separate Password Change Form (when in edit mode) -->
        {#if isChangingPassword && isEditing}
          <form method="POST" action="?/changePassword" use:enhance on:submit={handlePasswordSubmit} class="password-form">
            <div class="form-actions">
              <Button type="submit" variant="primary" disabled={isPasswordSubmitting}>
                {isPasswordSubmitting ? 'Changing Password...' : 'Save Password'}
              </Button>
              <Button type="button" variant="secondary" on:click={togglePasswordChange}>
                Cancel Password Change
              </Button>
            </div>
          </form>
        {/if}
      {:else}
        <!-- View Mode -->
        <div class="profile-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Full Name</span>
              <span>{data.profile.full_name}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Email</span>
              <span>{data.user.email}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Phone Number</span>
              <span>{formatPhoneForDisplay(data.profile.phone_number)}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Household ID</span>
              <span>{data.profile.household_id}</span>
            </div>

            <!-- Address Fields -->
            <div class="info-item">
              <span class="info-label">Street Address</span>
              <span>{data.profile.street_address || 'Not specified'}</span>
            </div>

            <div class="info-item">
              <span class="info-label">City</span>
              <span>{data.profile.city || 'Not specified'}</span>
            </div>

            <div class="info-item">
              <span class="info-label">State</span>
              <span>{data.profile.state || 'Not specified'}</span>
            </div>

            <div class="info-item">
              <span class="info-label">ZIP Code</span>
              <span>{data.profile.zip_code || 'Not specified'}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Role</span>
              <span class="role-badge role-{data.profile.role}">
                {data.profile.role === 'super_admin' ? 'Super Admin' :
                 data.profile.role === 'hoa_admin' ? 'HOA Admin' : 'Member'}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">Member Since</span>
              <span>{new Date(data.profile.joined_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <!-- Password Change Section (when not editing but password change is active) -->
        {#if isChangingPassword && !isEditing}
          <div class="password-change-standalone">
            <h3>Change Password</h3>
            <form method="POST" action="?/changePassword" use:enhance on:submit={handlePasswordSubmit}>
              <div class="form-grid">
                <div class="form-row full-width">
                  <div class="form-group">
                    <PasswordInput
                      bind:value={currentPassword}
                      id="currentPassword"
                      name="currentPassword"
                      label="Current Password"
                      required={true}
                      autocomplete="current-password"
                    />
                  </div>
                </div>

                <div class="form-row full-width">
                  <div class="form-group">
                    <PasswordInput
                      bind:value={newPassword}
                      id="newPassword"
                      name="newPassword"
                      label="New Password"
                      required={true}
                      autocomplete="new-password"
                    />
                    <small>Password must be at least 8 characters long</small>
                  </div>
                </div>

                <div class="form-row full-width">
                  <div class="form-group">
                    <PasswordInput
                      bind:value={confirmPassword}
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirm New Password"
                      required={true}
                      autocomplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <Button type="submit" variant="primary" disabled={isPasswordSubmitting}>
                  {isPasswordSubmitting ? 'Changing Password...' : 'Save Password'}
                </Button>
                <Button type="button" variant="secondary" on:click={togglePasswordChange}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        {/if}
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
            <span class="info-label">HOA Name</span>
            <span>{data.hoa?.name || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Address</span>
            <span>{data.hoa?.address || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Contact Email</span>
            <span>{data.hoa?.contact_email || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Contact Phone</span>
            <span>{data.hoa?.contact_phone || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Total Courts</span>
            <span>{data.hoa?.total_courts || 'Not specified'}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Court Names</span>
            <span>{data.hoa?.court_names?.join(', ') || 'Not specified'}</span>
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
            <div class="balance-time">({data.hoa?.prime_time_start || '17:00'} - {data.hoa?.prime_time_end || '21:00'})</div>
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

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: flex;
    gap: 1rem;
    width: 100%;
  }

  .form-row.full-width {
    flex-direction: column;
  }

  .form-row.two-columns {
    flex-direction: column;
  }

  .form-row.three-columns {
    flex-direction: column;
  }

  /* Desktop layout - screens wider than 768px */
  @media (min-width: 769px) {
    .form-row.two-columns {
      flex-direction: row;
    }

    .form-row.two-columns .form-group {
      flex: 1;
    }

    .form-row.three-columns {
      flex-direction: row;
    }

    .form-row.three-columns .form-group.city-field {
      flex: 2; /* ~50% width */
    }

    .form-row.three-columns .form-group.state-field {
      flex: 1; /* ~25% width */
    }

    .form-row.three-columns .form-group.zip-field {
      flex: 1; /* ~25% width */
    }
  }

  .info-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .form-group {
    margin-bottom: 1rem;
    flex: 1;
    min-width: 0; /* Prevents flex items from overflowing */
  }

  .form-row.full-width .form-group {
    flex: none;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .form-group small {
    display: block;
    color: #6c757d;
    margin-top: 0.25rem;
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

  .info-item .info-label {
    font-weight: 500;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-item span:not(.info-label) {
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

  .password-change-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  }

  .password-change-section h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 1.5rem;
  }

  .password-change-standalone {
    margin-top: 2rem;
    padding: 1.5rem;
    background-color: var(--color-background-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .password-change-standalone h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 1.5rem;
  }

  .password-form {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }

  /* Ensure PhoneInput and StateSelect components take full width of their containers */
  .form-group :global(.phone-input-container),
  .form-group :global(.state-select-container),
  .form-group :global(.password-input-container) {
    margin-bottom: 0;
    width: 100%;
  }

  .form-group :global(.phone-input),
  .form-group :global(.state-select),
  .form-group :global(.password-input) {
    width: 100%;
  }

  /* Ensure proper spacing between form rows */
  .form-row + .form-row {
    margin-top: 0.5rem;
  }

  /* Adjust spacing for password change section */
  .password-change-section .form-row + .form-row {
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .profile-page {
      padding: 1rem;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .balance-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .header-actions {
      flex-direction: column;
      gap: 0.5rem;
    }

    .password-change-standalone {
      padding: 1rem;
    }

    .form-group input {
      font-size: 16px; /* Prevents zoom on iOS */
    }

    /* Ensure all form rows stack vertically on mobile */
    .form-row.two-columns,
    .form-row.three-columns {
      flex-direction: column;
    }

    .form-row {
      gap: 0;
    }
  }
</style>
