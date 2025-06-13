<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';
  
  export let data: PageData;
  export let form: ActionData;
  
  let loading = false;
  let name = '';
  let slug = '';
  let description = '';
  let address = '';
  let contactEmail = '';
  let contactPhone = '';
  let websiteUrl = '';
  let totalCourts = 4;
  let adminFullName = '';
  let adminPhoneNumber = '';
  let adminHouseholdId = 'admin';

  // Auto-generate slug from name
  $: if (name && !slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function handleCancel() {
    goto('/admin/hoas');
  }
</script>

<div class="create-hoa-page">
  <div class="page-header">
    <h1>Create New HOA</h1>
    <button type="button" class="btn btn-secondary" on:click={handleCancel}>
      Cancel
    </button>
  </div>

  {#if form?.error}
    <div class="error-message">{form.error}</div>
  {/if}

  <form 
    method="POST" 
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        loading = false;
        await update();
      };
    }}
    class="hoa-form"
  >
    <div class="form-section">
      <h2>Basic Information</h2>
      
      <div class="form-group">
        <label for="name">HOA Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          bind:value={name}
          required
          placeholder="e.g., Sunset Ridge HOA"
        />
      </div>

      <div class="form-group">
        <label for="slug">URL Slug *</label>
        <input
          type="text"
          id="slug"
          name="slug"
          bind:value={slug}
          required
          pattern="[a-z0-9-]+"
          placeholder="e.g., sunset-ridge"
        />
        <small>Used in URLs. Only lowercase letters, numbers, and hyphens allowed.</small>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          name="description"
          bind:value={description}
          rows="3"
          placeholder="Brief description of the HOA"
        ></textarea>
      </div>
    </div>

    <div class="form-section">
      <h2>Contact Information</h2>
      
      <div class="form-group">
        <label for="address">Address</label>
        <input
          type="text"
          id="address"
          name="address"
          bind:value={address}
          placeholder="HOA office or community address"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="contact_email">Contact Email</label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            bind:value={contactEmail}
            placeholder="contact@hoa.com"
          />
        </div>

        <div class="form-group">
          <label for="contact_phone">Contact Phone</label>
          <input
            type="tel"
            id="contact_phone"
            name="contact_phone"
            bind:value={contactPhone}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="website_url">Website URL</label>
        <input
          type="url"
          id="website_url"
          name="website_url"
          bind:value={websiteUrl}
          placeholder="https://www.hoa.com"
        />
      </div>
    </div>

    <div class="form-section">
      <h2>Court Configuration</h2>
      
      <div class="form-group">
        <label for="total_courts">Number of Courts *</label>
        <input
          type="number"
          id="total_courts"
          name="total_courts"
          bind:value={totalCourts}
          min="1"
          max="20"
          required
        />
        <small>Courts will be automatically named "Court 1", "Court 2", etc.</small>
      </div>
    </div>

    <div class="form-section">
      <h2>HOA Administrator</h2>
      
      <div class="form-row">
        <div class="form-group">
          <label for="admin_full_name">Admin Full Name *</label>
          <input
            type="text"
            id="admin_full_name"
            name="admin_full_name"
            bind:value={adminFullName}
            required
            placeholder="John Smith"
          />
        </div>

        <div class="form-group">
          <label for="admin_phone_number">Admin Phone Number *</label>
          <input
            type="tel"
            id="admin_phone_number"
            name="admin_phone_number"
            bind:value={adminPhoneNumber}
            required
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="admin_household_id">Admin Household ID</label>
        <input
          type="text"
          id="admin_household_id"
          name="admin_household_id"
          bind:value={adminHouseholdId}
          placeholder="admin"
        />
        <small>Unique identifier for the admin's household</small>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" on:click={handleCancel}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" disabled={loading}>
        {loading ? 'Creating...' : 'Create HOA'}
      </button>
    </div>
  </form>
</div>

<style>
  .create-hoa-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0;
    color: var(--text-primary);
  }

  .hoa-form {
    background: var(--surface);
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h2 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    border-bottom: 2px solid var(--primary);
    padding-bottom: 0.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }

  .error-message {
    background: var(--error-bg);
    color: var(--error-text);
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid var(--error-border);
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-dark);
  }

  .btn-secondary {
    background: var(--surface-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: var(--surface-hover);
  }

  @media (max-width: 768px) {
    .create-hoa-page {
      padding: 1rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .page-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
  }
</style>
