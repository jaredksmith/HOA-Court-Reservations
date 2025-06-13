<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  $: hoa = data.hoa;
  $: members = data.members;

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
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
    goto(`/admin/hoas/${hoa.id}`);
  }

  // Group members by role
  $: membersByRole = members.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {} as Record<string, typeof members>);

  // Sort roles for display
  $: sortedRoles = Object.keys(membersByRole).sort((a, b) => {
    const roleOrder = { 'super_admin': 0, 'hoa_admin': 1, 'member': 2 };
    return (roleOrder[a as keyof typeof roleOrder] || 3) - (roleOrder[b as keyof typeof roleOrder] || 3);
  });
</script>

<div class="members-page">
  <div class="page-header">
    <div class="header-left">
      <button type="button" class="btn btn-secondary" on:click={handleBack}>
        ← Back to HOA Details
      </button>
      <h1>{hoa.name} Members</h1>
    </div>
    <div class="header-stats">
      <span class="stat">
        <strong>{members.length}</strong> Total Members
      </span>
      <span class="stat">
        <strong>{members.filter(m => m.is_active).length}</strong> Active
      </span>
    </div>
  </div>

  {#if members.length === 0}
    <div class="empty-state">
      <div class="empty-icon">👥</div>
      <h2>No Members Found</h2>
      <p>This HOA doesn't have any members yet.</p>
    </div>
  {:else}
    <div class="members-content">
      {#each sortedRoles as role}
        {@const roleMembers = membersByRole[role]}
        <div class="role-section">
          <div class="role-header">
            <h2>
              <span class="role-badge {getRoleBadgeClass(role)}">
                {role.replace('_', ' ')}
              </span>
              <span class="role-count">({roleMembers.length})</span>
            </h2>
          </div>

          <div class="members-grid">
            {#each roleMembers as member}
              <div class="member-card" class:inactive={!member.is_active}>
                <div class="member-header">
                  <div class="member-info">
                    <h3 class="member-name">{member.full_name}</h3>
                    <p class="member-household">Household: {member.household_id}</p>
                  </div>
                  <div class="member-status">
                    <span class="status-badge {member.is_active ? 'active' : 'inactive'}">
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div class="member-details">
                  <div class="detail-row">
                    <span class="label">Phone:</span>
                    <span class="value">{member.phone_number}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Prime Hours:</span>
                    <span class="value">{member.prime_hours}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Standard Hours:</span>
                    <span class="value">{member.standard_hours}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Joined:</span>
                    <span class="value">{formatDate(member.created_at)}</span>
                  </div>
                  {#if member.last_reset}
                    <div class="detail-row">
                      <span class="label">Last Reset:</span>
                      <span class="value">{formatDate(member.last_reset)}</span>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .members-page {
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

  .header-stats {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .stat {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .stat strong {
    color: var(--primary);
    font-size: 1.25rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--surface);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .empty-state p {
    margin: 0;
    color: var(--text-secondary);
  }

  .members-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .role-section {
    background: var(--surface);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .role-header {
    margin-bottom: 1.5rem;
  }

  .role-header h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .role-count {
    color: var(--text-secondary);
    font-weight: normal;
    font-size: 1rem;
  }

  .role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
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

  .members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .member-card {
    background: var(--surface-secondary);
    border-radius: 6px;
    padding: 1rem;
    border: 1px solid var(--border);
    transition: all 0.2s;
  }

  .member-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .member-card.inactive {
    opacity: 0.7;
    border-color: var(--error-border);
  }

  .member-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    margin: 0 0 0.25rem 0;
    color: var(--text-primary);
    font-size: 1.125rem;
  }

  .member-household {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .member-status {
    flex-shrink: 0;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.active {
    background: var(--success-bg);
    color: var(--success-text);
  }

  .status-badge.inactive {
    background: var(--error-bg);
    color: var(--error-text);
  }

  .member-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
  }

  .detail-row .label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .detail-row .value {
    color: var(--text-primary);
    font-size: 0.875rem;
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

  .btn-secondary {
    background: var(--surface-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: var(--surface-hover);
  }

  @media (max-width: 768px) {
    .members-page {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-left {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-stats {
      justify-content: space-between;
    }

    .members-grid {
      grid-template-columns: 1fr;
    }

    .member-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .member-status {
      align-self: flex-end;
    }
  }
</style>
