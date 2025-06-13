<script lang="ts">
  export let value: string = '';
  export let placeholder: string = 'Enter your password';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string | null = null;
  export let label: string = 'Password';
  export let id: string = 'password';
  export let name: string = 'password';
  export let autocomplete: 'current-password' | 'new-password' | 'off' = 'current-password';
  
  let showPassword = false;
  let inputElement: HTMLInputElement;
  
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
  
  // Reset password visibility when component unmounts or value changes significantly
  $: if (value === '') {
    showPassword = false;
  }
</script>

<div class="password-input-container">
  <label for={id} class="label">{label}</label>
  
  <div class="input-wrapper" class:error class:disabled>
    {#if showPassword}
      <input
        bind:this={inputElement}
        bind:value
        {id}
        {name}
        type="text"
        {placeholder}
        {required}
        {disabled}
        {autocomplete}
        class="password-input"
      />
    {:else}
      <input
        bind:this={inputElement}
        bind:value
        {id}
        {name}
        type="password"
        {placeholder}
        {required}
        {disabled}
        {autocomplete}
        class="password-input"
      />
    {/if}
    
    <button
      type="button"
      class="toggle-button"
      on:click={togglePasswordVisibility}
      disabled={disabled}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabindex="0"
    >
      {#if showPassword}
        <!-- Eye Slash Icon (password visible) -->
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      {:else}
        <!-- Eye Icon (password hidden) -->
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      {/if}
    </button>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
</div>

<style>
  .password-input-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .label {
    display: block;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .password-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 0.75rem; /* Extra padding on right for button */
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background: white;
  }
  
  .password-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .password-input:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  .input-wrapper.error .password-input {
    border-color: #ef4444;
  }
  
  .input-wrapper.error .password-input:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
  
  .input-wrapper.disabled {
    opacity: 0.6;
  }
  
  .toggle-button {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: color 0.2s ease, background-color 0.2s ease;
  }
  
  .toggle-button:hover:not(:disabled) {
    color: #374151;
    background-color: #f3f4f6;
  }
  
  .toggle-button:focus {
    outline: none;
    color: #3b82f6;
    background-color: #eff6ff;
  }
  
  .toggle-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    .password-input {
      font-size: 16px; /* Prevents zoom on iOS */
      padding: 0.875rem 3.5rem 0.875rem 0.875rem;
    }
    
    .toggle-button {
      right: 1rem;
      padding: 0.5rem;
    }
    
    .icon {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
</style>
