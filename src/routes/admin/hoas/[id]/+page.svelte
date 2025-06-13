<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  $: hoa = data.hoa;
  $: stats = data.stats;
  $: members = data.members;

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusBadgeClass(isActive: boolean) {
    return isActive ? 'status-active' : 'status-inactive';
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case 'super_admin': return 'role-super-admin';
      case 'hoa_admin': return 'role-hoa-admin';
      case 'member': return 'role-member';
      default: return 'role-member';
    }
  }

  function handleBack() {
    goto('/admin/hoas');
  }
</script>

<div class="hoa-details-page">
  <div class="page-header">
    <div class="header-left">
      <button type="button" class="btn btn-secondary" on:click={handleBack}>
        ← Back to HOAs
      </button>
      <h1>{hoa.name}</h1>
      <span class="status-badge {getStatusBadgeClass(hoa.is_active)}">
        {hoa.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>
    <div class="header-actions">
      <a href="/admin/hoas/{hoa.id}/edit" class="btn btn-primary">
        Edit HOA
      </a>
    </div>
  </div>

  <div class="content-grid">
    <!-- HOA Information -->
    <div class="info-card">
      <h2>HOA Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Name:</label>
          <span>{hoa.name}</span>
        </div>
        <div class="info-item">
          <label>Slug:</label>
          <span class="code">{hoa.slug}</span>
        </div>
        <div class="info-item">
          <label>Total Courts:</label>
          <span>{hoa.total_courts}</span>
        </div>
        <div class="info-item">
          <label>Invitation Code:</label>
          <span class="code">{hoa.invitation_code}</span>
        </div>
        <div class="info-item">
          <label>Prime Time:</label>
          <span>{hoa.prime_time_start} - {hoa.prime_time_end}</span>
        </div>
        <div class="info-item">
          <label>Created:</label>
          <span>{formatDate(hoa.created_at)}</span>
        </div>
      </div>

      {#if hoa.description}
        <div class="description">
          <label>Description:</label>
          <p>{hoa.description}</p>
        </div>
      {/if}

      {#if hoa.address}
        <div class="description">
          <label>Address:</label>
          <p>{hoa.address}</p>
        </div>
      {/if}

      <div class="contact-info">
        <h3>Contact Information</h3>
        <div class="info-grid">
          {#if hoa.contact_email}
            <div class="info-item">
              <label>Email:</label>
              <a href="mailto:{hoa.contact_email}">{hoa.contact_email}</a>
            </div>
          {/if}
          {#if hoa.contact_phone}
            <div class="info-item">
              <label>Phone:</label>
              <a href="tel:{hoa.contact_phone}">{hoa.contact_phone}</a>
            </div>
          {/if}
          {#if hoa.website_url}
            <div class="info-item">
              <label>Website:</label>
              <a href={hoa.website_url} target="_blank" rel="noopener noreferrer">
                {hoa.website_url}
              </a>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-card">
      <h2>Statistics</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{stats.total_members}</span>
          <span class="stat-label">Total Members</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{stats.active_members}</span>
          <span class="stat-label">Active Members</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{stats.total_bookings}</span>
          <span class="stat-label">Total Bookings</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{stats.pending_bookings}</span>
          <span class="stat-label">Pending Bookings</span>
        </div>
      </div>
    </div>

    <!-- Court Configuration -->
    <div class="courts-card">
      <h2>Court Configuration</h2>
      <div class="courts-grid">
        {#each hoa.court_names as courtName, index}
          <div class="court-item">
            <span class="court-number">{index + 1}</span>
            <span class="court-name">{courtName}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Recent Members -->
    <div class="members-card">
      <div class="card-header">
        <h2>Recent Members</h2>
        <a href="/admin/hoas/{hoa.id}/members" class="btn btn-outline">
          View All Members
        </a>
      </div>
      
      {#if members.length > 0}
        <div class="members-list">
          {#each members.slice(0, 5) as member}
            <div class="member-item">
              <div class="member-info">
                <span class="member-name">{member.full_name}</span>
                <span class="member-household">Household: {member.household_id}</span>
              </div>
              <div class="member-meta">
                <span class="role-badge {getRoleBadgeClass(member.role)}">
                  {member.role.replace('_', ' ')}
                </span>
                <span class="member-status {member.is_active ? 'active' : 'inactive'}">
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="no-members">No members found.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .hoa-details-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
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

  .header-actions {
    display: flex;
    gap: 1rem;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  .info-card,
  .stats-card,
  .courts-card,
  .members-card {
    background: var(--surface);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .info-card {
    grid-column: 1;
    grid-row: 1 / 3;
  }

  .stats-card {
    grid-column: 2;
    grid-row: 1;
  }

  .courts-card {
    grid-column: 2;
    grid-row: 2;
  }

  .members-card {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  .info-card h2,
  .stats-card h2,
  .courts-card h2,
  .members-card h2 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    border-bottom: 2px solid var(--primary);
    padding-bottom: 0.5rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-item label {
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .info-item span,
  .info-item a {
    color: var(--text-primary);
  }

  .info-item a {
    text-decoration: none;
  }

  .info-item a:hover {
    text-decoration: underline;
  }

  .code {
    font-family: monospace;
    background: var(--surface-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .description {
    margin-bottom: 1.5rem;
  }

  .description label {
    display: block;
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .description p {
    margin: 0;
    color: var(--text-primary);
    line-height: 1.5;
  }

  .contact-info h3 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .stat-item {
    text-align: center;
    padding: 1rem;
    background: var(--surface-secondary);
    border-radius: 6px;
  }

  .stat-value {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 0.25rem;
  }

  .stat-label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .courts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .court-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--surface-secondary);
    border-radius: 6px;
  }

  .court-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--primary);
    color: white;
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: bold;
  }

  .court-name {
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .card-header h2 {
    margin: 0;
    border: none;
    padding: 0;
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .member-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-secondary);
    border-radius: 6px;
  }

  .member-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .member-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .member-household {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .member-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .role-badge,
  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .role-super-admin {
    background: var(--error-bg);
    color: var(--error-text);
  }

  .role-hoa-admin {
    background: var(--warning-bg);
    color: var(--warning-text);
  }

  .role-member {
    background: var(--success-bg);
    color: var(--success-text);
  }

  .status-active {
    background: var(--success-bg);
    color: var(--success-text);
  }

  .status-inactive {
    background: var(--error-bg);
    color: var(--error-text);
  }

  .member-status {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .member-status.active {
    color: var(--success-text);
  }

  .member-status.inactive {
    color: var(--error-text);
  }

  .no-members {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    margin: 2rem 0;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover {
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

  .btn-outline {
    background: transparent;
    color: var(--primary);
    border: 1px solid var(--primary);
  }

  .btn-outline:hover {
    background: var(--primary);
    color: white;
  }

  @media (max-width: 768px) {
    .hoa-details-page {
      padding: 1rem;
    }

    .content-grid {
      grid-template-columns: 1fr;
    }

    .info-card,
    .stats-card,
    .courts-card,
    .members-card {
      grid-column: 1;
      grid-row: auto;
    }

    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-left {
      flex-direction: column;
      align-items: flex-start;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .member-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
