<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/utils/permissions';
  
  export let data: PageData;
  
  $: auth = data.auth;
  $: profile = auth.profile;
  $: hoa = auth.hoa;
  
  let stats = {
    total_members: 0,
    active_members: 0,
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    cancelled_bookings: 0
  };
  
  let loading = true;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      loading = false;
    }
  });
  
  $: quickActions = [
    {
      title: 'Manage Members',
      description: 'View and manage HOA members',
      href: '/admin/members',
      icon: '👥',
      show: hasPermission(profile, 'manage_hoa_users')
    },
    {
      title: 'View Bookings',
      description: 'Manage court bookings',
      href: '/admin/bookings',
      icon: '📅',
      show: hasPermission(profile, 'manage_all_bookings')
    },
    {
      title: 'HOA Settings',
      description: 'Configure HOA settings',
      href: '/admin/settings',
      icon: '⚙️',
      show: hasPermission(profile, 'manage_hoa_settings')
    },
    {
      title: 'Manage HOAs',
      description: 'Create and manage HOAs',
      href: '/admin/hoas',
      icon: '🏘️',
      show: hasPermission(profile, 'manage_hoas')
    }
  ].filter(action => action.show);
</script>

<div class="admin-dashboard">
  <div class="dashboard-header">
    <h1>Admin Dashboard</h1>
    {#if hoa && profile?.role !== 'super_admin'}
      <p class="hoa-subtitle">Managing {hoa.name}</p>
    {:else if profile?.role === 'super_admin'}
      <p class="hoa-subtitle">System Administrator</p>
    {/if}
  </div>

  {#if loading}
    <div class="loading">Loading statistics...</div>
  {:else}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-number">{stats.total_members}</div>
          <div class="stat-label">Total Members</div>
          <div class="stat-detail">{stats.active_members} active</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <div class="stat-number">{stats.total_bookings}</div>
          <div class="stat-label">Total Bookings</div>
          <div class="stat-detail">{stats.confirmed_bookings} confirmed</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-number">{stats.pending_bookings}</div>
          <div class="stat-label">Pending Bookings</div>
          <div class="stat-detail">Awaiting confirmation</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-number">{stats.cancelled_bookings}</div>
          <div class="stat-label">Cancelled Bookings</div>
          <div class="stat-detail">This period</div>
        </div>
      </div>
    </div>
  {/if}

  <div class="quick-actions">
    <h2>Quick Actions</h2>
    <div class="actions-grid">
      {#each quickActions as action}
        <a href={action.href} class="action-card">
          <div class="action-icon">{action.icon}</div>
          <div class="action-content">
            <h3>{action.title}</h3>
            <p>{action.description}</p>
          </div>
        </a>
      {/each}
    </div>
  </div>

  {#if hoa}
    <div class="hoa-info">
      <h2>HOA Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Name:</label>
          <span>{hoa.name}</span>
        </div>
        <div class="info-item">
          <label>Total Courts:</label>
          <span>{hoa.total_courts}</span>
        </div>
        <div class="info-item">
          <label>Prime Time:</label>
          <span>{hoa.prime_time_start} - {hoa.prime_time_end}</span>
        </div>
        <div class="info-item">
          <label>Invitation Code:</label>
          <span class="invitation-code">{hoa.invitation_code}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .admin-dashboard {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .dashboard-header {
    margin-bottom: 2rem;
  }
  
  .dashboard-header h1 {
    margin: 0;
    color: #1e293b;
  }
  
  .hoa-subtitle {
    margin: 0.5rem 0 0;
    color: #64748b;
    font-size: 1.1rem;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #64748b;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .stat-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .stat-icon {
    font-size: 2.5rem;
    opacity: 0.8;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }
  
  .stat-label {
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.25rem;
  }
  
  .stat-detail {
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .quick-actions {
    margin-bottom: 3rem;
  }
  
  .quick-actions h2 {
    margin-bottom: 1.5rem;
    color: #1e293b;
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .action-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s;
  }
  
  .action-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .action-icon {
    font-size: 2rem;
    opacity: 0.8;
  }
  
  .action-content h3 {
    margin: 0 0 0.5rem;
    color: #1e293b;
  }
  
  .action-content p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }
  
  .hoa-info {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .hoa-info h2 {
    margin: 0 0 1.5rem;
    color: #1e293b;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
  
  .info-item label {
    font-weight: 600;
    color: #475569;
  }
  
  .invitation-code {
    font-family: monospace;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .actions-grid {
      grid-template-columns: 1fr;
    }
    
    .info-grid {
      grid-template-columns: 1fr;
    }
    
    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
