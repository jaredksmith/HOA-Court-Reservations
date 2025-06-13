<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';
  
  export let data: PageData;
  export let form: ActionData;
  
  $: hoa = data.hoa;
  
  let loading = false;
  let name = hoa.name;
  let description = hoa.description || '';
  let address = hoa.address || '';
  let contactEmail = hoa.contact_email || '';
  let contactPhone = hoa.contact_phone || '';
  let websiteUrl = hoa.website_url || '';
  let totalCourts = hoa.total_courts;
  let isActive = hoa.is_active;

  function handleCancel() {
    goto(`/admin/hoas/${hoa.id}`);
  }
</script>

<div class="edit-hoa-page">
  <div class="page-header">
    <div class="header-left">
      <button type="button" class="btn btn-secondary" on:click={handleCancel}>
        ← Back to HOA Details
      </button>
      <h1>Edit {hoa.name}</h1>
    </div>
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
        <label for="description">Description</label>
        <textarea
          id="description"
          name="description"
          bind:value={description}
          rows="3"
          placeholder="Brief description of the HOA"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            name="is_active"
            bind:checked={isActive}
          />
          <span class="checkmark"></span>
          Active HOA
        </label>
        <small>Inactive HOAs cannot accept new registrations or bookings</small>
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
        <small>
          {#if totalCourts !== hoa.total_courts}
            <strong>Warning:</strong> Changing the number of courts will reset court names to "Court 1", "Court 2", etc.
          {:else}
            Courts will be automatically named "Court 1", "Court 2", etc.
          {/if}
        </small>
      </div>
    </div>

    <div class="form-section">
      <h2>Read-Only Information</h2>
      
      <div class="readonly-grid">
        <div class="readonly-item">
          <label>Slug:</label>
          <span class="code">{hoa.slug}</span>
        </div>
        <div class="readonly-item">
          <label>Invitation Code:</label>
          <span class="code">{hoa.invitation_code}</span>
        </div>
        <div class="readonly-item">
          <label>Created:</label>
          <span>{new Date(hoa.created_at).toLocaleDateString()}</span>
        </div>
        <div class="readonly-item">
          <label>Last Updated:</label>
          <span>{new Date(hoa.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <small class="readonly-note">
        These fields cannot be modified. Contact system administrator if changes are needed.
      </small>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" on:click={handleCancel}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </form>
</div>

<style>
  .edit-hoa-page {
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

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-left h1 {
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

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-bottom: 0;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .readonly-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .readonly-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .readonly-item label {
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0;
  }

  .readonly-item span {
    color: var(--text-primary);
  }

  .code {
    font-family: monospace;
    background: var(--surface-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .readonly-note {
    color: var(--text-secondary);
    font-style: italic;
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
    .edit-hoa-page {
      padding: 1rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .readonly-grid {
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

    .header-left {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
