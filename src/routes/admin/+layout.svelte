<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { AuthContext } from '$lib/types';
  import { hasPermission } from '$lib/utils/permissions';
  
  export let data: { auth: AuthContext };
  
  $: auth = data.auth;
  $: profile = auth.profile;
  $: hoa = auth.hoa;
  
  // Check if user has admin permissions
  $: isAdmin = profile && (profile.role === 'super_admin' || profile.role === 'hoa_admin');
  
  onMount(() => {
    // Redirect non-admin users
    if (!auth.loading && (!profile || !isAdmin)) {
      goto('/dashboard');
    }
  });
  
  // Navigation items based on permissions
  $: navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: '📊',
      show: true
    },
    {
      href: '/admin/members',
      label: 'Members',
      icon: '👥',
      show: hasPermission(profile, 'manage_hoa_users')
    },
    {
      href: '/admin/bookings',
      label: 'Bookings',
      icon: '📅',
      show: hasPermission(profile, 'manage_all_bookings')
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: '⚙️',
      show: hasPermission(profile, 'manage_hoa_settings')
    },
    {
      href: '/admin/hoas',
      label: 'HOAs',
      icon: '🏘️',
      show: hasPermission(profile, 'manage_hoas')
    }
  ].filter(item => item.show);
</script>

{#if auth.loading}
  <div class="loading">Loading...</div>
{:else if !isAdmin}
  <div class="error">Access denied. Admin privileges required.</div>
{:else}
  <div class="admin-layout">
    <nav class="admin-nav">
      <div class="nav-header">
        <h2>Admin Panel</h2>
        {#if hoa && profile?.role !== 'super_admin'}
          <div class="hoa-context">
            <span class="hoa-name">{hoa.name}</span>
            <span class="role-badge">{profile.role === 'hoa_admin' ? 'HOA Admin' : 'Admin'}</span>
          </div>
        {/if}
      </div>
      
      <ul class="nav-items">
        {#each navItems as item}
          <li>
            <a 
              href={item.href} 
              class:active={$page.url.pathname === item.href}
            >
              <span class="icon">{item.icon}</span>
              <span class="label">{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
      
      <div class="nav-footer">
        <a href="/dashboard" class="back-link">
          ← Back to Dashboard
        </a>
      </div>
    </nav>
    
    <main class="admin-content">
      <slot />
    </main>
  </div>
{/if}

<style>
  .loading, .error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.2rem;
  }
  
  .error {
    color: #d32f2f;
  }
  
  .admin-layout {
    display: flex;
    min-height: 100vh;
  }
  
  .admin-nav {
    width: 250px;
    background-color: #1e293b;
    color: white;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }
  
  .nav-header h2 {
    margin: 0 0 1rem;
    color: #f1f5f9;
  }
  
  .hoa-context {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background-color: #334155;
    border-radius: 0.5rem;
  }
  
  .hoa-name {
    display: block;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .role-badge {
    display: inline-block;
    background-color: #3b82f6;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .nav-items {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
  }
  
  .nav-items li {
    margin-bottom: 0.5rem;
  }
  
  .nav-items a {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    color: #cbd5e1;
    text-decoration: none;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }
  
  .nav-items a:hover {
    background-color: #334155;
    color: white;
  }
  
  .nav-items a.active {
    background-color: #3b82f6;
    color: white;
  }
  
  .nav-items .icon {
    margin-right: 0.75rem;
    font-size: 1.2rem;
  }
  
  .nav-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid #334155;
  }
  
  .back-link {
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.9rem;
  }
  
  .back-link:hover {
    color: white;
  }
  
  .admin-content {
    flex: 1;
    padding: 2rem;
    background-color: #f8fafc;
    overflow-y: auto;
  }
  
  @media (max-width: 768px) {
    .admin-layout {
      flex-direction: column;
    }
    
    .admin-nav {
      width: 100%;
      padding: 1rem;
    }
    
    .nav-items {
      display: flex;
      overflow-x: auto;
      gap: 0.5rem;
    }
    
    .nav-items li {
      margin-bottom: 0;
      flex-shrink: 0;
    }
    
    .admin-content {
      padding: 1rem;
    }
  }
</style>
