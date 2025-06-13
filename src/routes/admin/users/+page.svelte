<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PermissionGuard from '$lib/components/PermissionGuard.svelte';
  import { hasPermission, getRoleDisplayName, canAssignRole } from '$lib/utils/permissions';
  import type { PageData } from './$types';
  import type { Profile, UserRole } from '$lib/types';

  export let data: PageData;
  
  $: auth = data.auth;
  $: profile = auth.profile;
  $: hoa = auth.hoa;

  // State
  let users: Profile[] = [];
  let loading = true;
  let error = '';
  let selectedUsers: string[] = [];
  let showCreateModal = false;
  let showBulkActions = false;

  // Filters
  let searchTerm = '';
  let roleFilter: UserRole | 'all' = 'all';
  let statusFilter: 'active' | 'inactive' | 'all' = 'all';
  let currentPage = 1;
  let totalPages = 1;
  let totalUsers = 0;

  // Bulk actions
  let bulkAction: 'activate' | 'deactivate' | 'update_role' | 'reset_hours' = 'activate';
  let bulkRole: UserRole = 'member';

  // New user form
  let newUser = {
    email: '',
    full_name: '',
    phone_number: '',
    household_id: '',
    role: 'member' as UserRole,
    hoa_id: hoa?.id || ''
  };

  onMount(() => {
    loadUsers();
  });

  async function loadUsers() {
    try {
      loading = true;
      error = '';

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        role: roleFilter === 'all' ? '' : roleFilter,
        status: statusFilter === 'all' ? '' : statusFilter
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      users = data.users;
      totalPages = data.pagination.totalPages;
      totalUsers = data.pagination.total;

    } catch (err) {
      console.error('Error loading users:', err);
      error = 'Failed to load users. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function createUser() {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      // Reset form and reload users
      newUser = {
        email: '',
        full_name: '',
        phone_number: '',
        household_id: '',
        role: 'member',
        hoa_id: hoa?.id || ''
      };
      showCreateModal = false;
      await loadUsers();

    } catch (err) {
      console.error('Error creating user:', err);
      error = err.message || 'Failed to create user';
    }
  }

  async function performBulkAction() {
    if (selectedUsers.length === 0) return;

    try {
      const requestData: any = {
        action: bulkAction,
        user_ids: selectedUsers
      };

      if (bulkAction === 'update_role') {
        requestData.role = bulkRole;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Bulk action failed');
      }

      selectedUsers = [];
      showBulkActions = false;
      await loadUsers();

    } catch (err) {
      console.error('Error performing bulk action:', err);
      error = 'Bulk action failed. Please try again.';
    }
  }

  async function toggleUserStatus(user: Profile) {
    try {
      const action = user.is_active ? 'deactivate' : 'reactivate';
      const url = user.is_active 
        ? `/api/admin/users/${user.user_id}` 
        : `/api/admin/users/${user.user_id}/reactivate`;
      
      const method = user.is_active ? 'DELETE' : 'PUT';

      const response = await fetch(url, { method });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      await loadUsers();

    } catch (err) {
      console.error('Error toggling user status:', err);
      error = `Failed to update user status`;
    }
  }

  function handleSelectAll(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedUsers = users.map(u => u.user_id);
    } else {
      selectedUsers = [];
    }
  }

  function handleUserSelect(userId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedUsers = [...selectedUsers, userId];
    } else {
      selectedUsers = selectedUsers.filter(id => id !== userId);
    }
  }

  // Reactive statements
  $: filteredUsersCount = users.length;
  $: canCreateUsers = hasPermission(profile, 'invite_members');
  $: canManageUsers = hasPermission(profile, 'manage_hoa_users');
  $: assignableRoles = profile ? ['member', 'hoa_admin'].concat(profile.role === 'super_admin' ? ['super_admin'] : []) : [];

  // Watch for filter changes (debounced)
  let filterTimeout: NodeJS.Timeout;
  $: {
    if (filterTimeout) clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      if (searchTerm !== undefined || roleFilter !== undefined || statusFilter !== undefined) {
        currentPage = 1;
        loadUsers();
      }
    }, 300);
  }
</script>

<div class="users-page">
  <div class="page-header">
    <div class="header-content">
      <h1>User Management</h1>
      <p class="subtitle">
        {#if profile?.role === 'super_admin'}
          System-wide user management
        {:else}
          Managing users for {hoa?.name}
        {/if}
      </p>
    </div>

    <div class="header-actions">
      <PermissionGuard {profile} permission="invite_members">
        <button class="btn btn-primary" on:click={() => showCreateModal = true}>
          <span class="icon">👤</span>
          Invite User
        </button>
      </PermissionGuard>

      {#if selectedUsers.length > 0}
        <button class="btn btn-secondary" on:click={() => showBulkActions = true}>
          <span class="icon">⚡</span>
          Bulk Actions ({selectedUsers.length})
        </button>
      {/if}
    </div>
  </div>

  <!-- Filters -->
  <div class="filters">
    <div class="filter-group">
      <input
        type="text"
        placeholder="Search users..."
        bind:value={searchTerm}
        class="search-input"
      />
    </div>

    <div class="filter-group">
      <select bind:value={roleFilter} class="filter-select">
        <option value="all">All Roles</option>
        <option value="member">Members</option>
        <option value="hoa_admin">HOA Admins</option>
        <option value="super_admin">Super Admins</option>
      </select>
    </div>

    <div class="filter-group">
      <select bind:value={statusFilter} class="filter-select">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  </div>

  <!-- Error message -->
  {#if error}
    <div class="error-message">
      {error}
      <button on:click={() => error = ''} class="close-btn">×</button>
    </div>
  {/if}

  <!-- Users table -->
  {#if loading}
    <div class="loading">Loading users...</div>
  {:else if users.length === 0}
    <div class="empty-state">
      <h3>No users found</h3>
      <p>No users match your current filters.</p>
    </div>
  {:else}
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                on:change={handleSelectAll}
                checked={selectedUsers.length === users.length && users.length > 0}
                indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Household</th>
            <th>Hours</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr class:inactive={!user.is_active}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.user_id)}
                  on:change={(e) => handleUserSelect(user.user_id, e)}
                />
              </td>
              <td>
                <div class="user-info">
                  <span class="name">{user.full_name}</span>
                  <span class="phone">{user.phone_number}</span>
                </div>
              </td>
              <td>{user.user_id}</td>
              <td>
                <span class="role-badge role-{user.role}">
                  {getRoleDisplayName(user.role)}
                </span>
              </td>
              <td>
                <span class="status-badge" class:active={user.is_active} class:inactive={!user.is_active}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{user.household_id}</td>
              <td>
                <div class="hours-info">
                  <span>Prime: {user.prime_hours}</span>
                  <span>Standard: {user.standard_hours}</span>
                </div>
              </td>
              <td>
                <div class="actions">
                  <PermissionGuard {profile} permission="manage_hoa_users">
                    <button
                      class="btn btn-sm"
                      class:btn-danger={user.is_active}
                      class:btn-success={!user.is_active}
                      on:click={() => toggleUserStatus(user)}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </PermissionGuard>
                  
                  <a href="/admin/users/{user.user_id}" class="btn btn-sm btn-secondary">
                    Edit
                  </a>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="pagination">
        <button
          class="btn btn-sm"
          disabled={currentPage === 1}
          on:click={() => { currentPage--; loadUsers(); }}
        >
          Previous
        </button>
        
        <span class="page-info">
          Page {currentPage} of {totalPages} ({totalUsers} total)
        </span>
        
        <button
          class="btn btn-sm"
          disabled={currentPage === totalPages}
          on:click={() => { currentPage++; loadUsers(); }}
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div>

<!-- Create User Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={() => showCreateModal = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Invite New User</h2>
        <button class="close-btn" on:click={() => showCreateModal = false}>×</button>
      </div>
      
      <form on:submit|preventDefault={createUser} class="modal-body">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            bind:value={newUser.email}
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="full_name">Full Name</label>
          <input
            id="full_name"
            type="text"
            bind:value={newUser.full_name}
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="phone_number">Phone Number</label>
          <input
            id="phone_number"
            type="tel"
            bind:value={newUser.phone_number}
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="household_id">Household ID</label>
          <input
            id="household_id"
            type="text"
            bind:value={newUser.household_id}
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" bind:value={newUser.role} class="form-select">
            {#each assignableRoles as role}
              <option value={role}>{getRoleDisplayName(role)}</option>
            {/each}
          </select>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => showCreateModal = false}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            Create User
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Bulk Actions Modal -->
{#if showBulkActions}
  <div class="modal-overlay" on:click={() => showBulkActions = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Bulk Actions</h2>
        <button class="close-btn" on:click={() => showBulkActions = false}>×</button>
      </div>
      
      <div class="modal-body">
        <p>Selected {selectedUsers.length} users</p>
        
        <div class="form-group">
          <label for="bulk_action">Action</label>
          <select id="bulk_action" bind:value={bulkAction} class="form-select">
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="update_role">Update Role</option>
            <option value="reset_hours">Reset Hours</option>
          </select>
        </div>

        {#if bulkAction === 'update_role'}
          <div class="form-group">
            <label for="bulk_role">New Role</label>
            <select id="bulk_role" bind:value={bulkRole} class="form-select">
              {#each assignableRoles as role}
                <option value={role}>{getRoleDisplayName(role)}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => showBulkActions = false}>
            Cancel
          </button>
          <button type="button" class="btn btn-primary" on:click={performBulkAction}>
            Apply Action
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .users-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .header-content h1 {
    margin: 0;
    color: #1e293b;
  }

  .subtitle {
    margin: 0.5rem 0 0;
    color: #64748b;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    flex-shrink: 0;
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .filter-group {
    flex: 1;
    min-width: 200px;
  }

  .search-input,
  .filter-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .users-table-container {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
  }

  .users-table th,
  .users-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  .users-table th {
    background: #f8fafc;
    font-weight: 600;
    color: #374151;
  }

  .users-table tr.inactive {
    opacity: 0.6;
  }

  .user-info .name {
    display: block;
    font-weight: 600;
    color: #1e293b;
  }

  .user-info .phone {
    display: block;
    font-size: 0.875rem;
    color: #64748b;
  }

  .role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .role-badge.role-super_admin {
    background: #fef3c7;
    color: #92400e;
  }

  .role-badge.role-hoa_admin {
    background: #dbeafe;
    color: #1e40af;
  }

  .role-badge.role-member {
    background: #f3f4f6;
    color: #374151;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-badge.active {
    background: #dcfce7;
    color: #166534;
  }

  .status-badge.inactive {
    background: #fee2e2;
    color: #991b1b;
  }

  .hours-info span {
    display: block;
    font-size: 0.875rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .page-info {
    color: #64748b;
    font-size: 0.875rem;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 0.75rem;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    color: #1e293b;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-success {
    background: #10b981;
    color: white;
  }

  .btn-success:hover {
    background: #059669;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading,
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #64748b;
  }

  .error-message {
    background: #fee2e2;
    color: #991b1b;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      justify-content: stretch;
    }

    .filters {
      flex-direction: column;
    }

    .users-table-container {
      overflow-x: auto;
    }

    .users-table {
      min-width: 800px;
    }
  }
</style>
