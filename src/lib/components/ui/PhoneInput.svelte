<script lang="ts">
  import { formatPhoneInput, getPhoneValidationError, isValidPhoneNumber } from '$lib/utils/phone';
  
  export let value: string = '';
  export let placeholder: string = '(555) 123-4567';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string | null = null;
  export let label: string = 'Phone Number';
  export let id: string = 'phone';
  export let name: string = 'phone';
  
  let inputElement: HTMLInputElement;
  let touched = false;
  
  // Format value as user types
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const formatted = formatPhoneInput(target.value);
    value = formatted;
    target.value = formatted;
  }
  
  // Validate on blur
  function handleBlur() {
    touched = true;
    if (!error && touched) {
      error = getPhoneValidationError(value);
    }
  }
  
  // Clear error when user starts typing
  function handleFocus() {
    if (error && touched) {
      error = null;
    }
  }
  
  // Validate when value changes externally
  $: if (touched && value) {
    const validationError = getPhoneValidationError(value);
    if (validationError !== error) {
      error = validationError;
    }
  }
  
  // Check if field is valid
  $: isValid = !error && isValidPhoneNumber(value);
  $: showError = touched && error;
</script>

<div class="phone-input-container">
  <label for={id} class="phone-label">
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>
  
  <div class="input-wrapper" class:error={showError} class:valid={isValid && touched}>
    <input
      bind:this={inputElement}
      {id}
      {name}
      type="tel"
      {value}
      {placeholder}
      {required}
      {disabled}
      autocomplete="tel"
      class="phone-input"
      on:input={handleInput}
      on:blur={handleBlur}
      on:focus={handleFocus}
    />
    
    <div class="input-icon">
      {#if isValid && touched}
        <svg class="icon-valid" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      {:else if showError}
        <svg class="icon-error" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      {/if}
    </div>
  </div>
  
  {#if showError}
    <div class="error-message">{error}</div>
  {/if}
  
  <div class="help-text">
    Enter your phone number for booking notifications
  </div>
</div>

<style>
  .phone-input-container {
    margin-bottom: 1rem;
  }
  
  .phone-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .required {
    color: #ef4444;
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .phone-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 0.75rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s ease;
    background-color: white;
  }
  
  .phone-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .phone-input:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  .input-wrapper.error .phone-input {
    border-color: #ef4444;
  }
  
  .input-wrapper.error .phone-input:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
  
  .input-wrapper.valid .phone-input {
    border-color: #10b981;
  }
  
  .input-wrapper.valid .phone-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .input-icon {
    position: absolute;
    right: 0.75rem;
    width: 1.25rem;
    height: 1.25rem;
    pointer-events: none;
  }
  
  .icon-valid {
    color: #10b981;
  }
  
  .icon-error {
    color: #ef4444;
  }
  
  .error-message {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #ef4444;
  }
  
  .help-text {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .phone-input {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }
</style>
