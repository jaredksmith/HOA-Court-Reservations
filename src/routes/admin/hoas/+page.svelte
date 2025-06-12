<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/utils/permissions';
  import type { HOA } from '$lib/types';
  
  export let data: PageData;
  
  $: auth = data.auth;
  $: profile = auth.profile;
  
  let hoas: HOA[] = [];
  let loading = true;
  let error = '';
  
  // Check if user can manage HOAs
  $: canManageHOAs = hasPermission(profile, 'manage_hoas');
  
  onMount(async () => {
    if (!canManageHOAs) {
      goto('/admin');
      return;
    }
    
    await loadHOAs();
  });
  
  async function loadHOAs() {
    try {
      loading = true;
      const response = await fetch('/api/admin/hoas');
      if (response.ok) {
        hoas = await response.json();
      } else {
        error = 'Failed to load HOAs';
      }
    } catch (err) {
      error = 'Failed to load HOAs';
      console.error('Error loading HOAs:', err);
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
  
  function getStatusBadgeClass(isActive: boolean) {
    return isActive ? 'status-active' : 'status-inactive';
  }
</script>

<div class="hoas-page">
  <div class="page-header">
    <h1>HOA Management</h1>
    <a href="/admin/hoas/create" class="btn btn-primary">
      + Create New HOA
    </a>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading HOAs...</div>
  {:else if hoas.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🏘️</div>
      <h2>No HOAs Found</h2>
      <p>Create your first HOA to get started.</p>
      <a href="/admin/hoas/create" class="btn btn-primary">
        Create HOA
      </a>
    </div>
  {:else}
    <div class="hoas-grid">
      {#each hoas as hoa}
        <div class="hoa-card">
          <div class="hoa-header">
            <h3>{hoa.name}</h3>
            <span class="status-badge {getStatusBadgeClass(hoa.is_active)}">
              {hoa.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div class="hoa-details">
            <div class="detail-item">
              <span class="label">Slug:</span>
              <span class="value">{hoa.slug}</span>
            </div>
            <div class="detail-item">
              <span class="label">Courts:</span>
              <span class="value">{hoa.total_courts}</span>
            </div>
            <div class="detail-item">
              <span class="label">Invitation Code:</span>
              <span class="value code">{hoa.invitation_code}</span>
            </div>
            <div class="detail-item">
              <span class="label">Created:</span>
              <span class="value">{formatDate(hoa.created_at)}</span>
            </div>
          </div>
          
          {#if hoa.description}
            <p class="hoa-description">{hoa.description}</p>
          {/if}
          
          <div class="hoa-actions">
            <a href="/admin/hoas/{hoa.id}" class="btn btn-secondary">
              View Details
            </a>
            <a href="/admin/hoas/{hoa.id}/edit" class="btn btn-outline">
              Edit
            </a>
            <a href="/admin/hoas/{hoa.id}/members" class="btn btn-outline">
              Members
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .hoas-page {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .page-header h1 {
    margin: 0;
    color: #1e293b;
  }
  
  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    text-align: center;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }
  
  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #2563eb;
  }
  
  .btn-secondary {
    background-color: #64748b;
    color: white;
  }
  
  .btn-secondary:hover {
    background-color: #475569;
  }
  
  .btn-outline {
    background-color: transparent;
    color: #64748b;
    border: 1px solid #d1d5db;
  }
  
  .btn-outline:hover {
    background-color: #f8fafc;
    border-color: #64748b;
  }
  
  .error-message {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .loading {
    text-align: center;
    padding: 3rem;
    color: #64748b;
    font-size: 1.1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }
  
  .empty-state h2 {
    margin: 0 0 1rem;
    color: #1e293b;
  }
  
  .empty-state p {
    margin: 0 0 2rem;
    color: #64748b;
  }
  
  .hoas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }
  
  .hoa-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }
  
  .hoa-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .hoa-header h3 {
    margin: 0;
    color: #1e293b;
    flex: 1;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .status-active {
    background-color: #dcfce7;
    color: #166534;
  }
  
  .status-inactive {
    background-color: #fef2f2;
    color: #dc2626;
  }
  
  .hoa-details {
    margin-bottom: 1rem;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .detail-item:last-child {
    border-bottom: none;
  }
  
  .label {
    font-weight: 500;
    color: #64748b;
  }
  
  .value {
    color: #1e293b;
  }
  
  .value.code {
    font-family: monospace;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
  
  .hoa-description {
    margin: 1rem 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  .hoa-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .hoa-actions .btn {
    flex: 1;
    min-width: 0;
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
  
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .hoas-grid {
      grid-template-columns: 1fr;
    }
    
    .hoa-actions {
      flex-direction: column;
    }
    
    .hoa-actions .btn {
      flex: none;
    }
  }
</style>
