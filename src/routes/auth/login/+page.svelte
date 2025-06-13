<script lang="ts">
  import { enhance } from '$app/forms';
  import PasswordInput from '$lib/components/ui/PasswordInput.svelte';

  export let form;

  let password = '';
</script>

<div class="auth-container">
  <h1>Login</h1>
  
  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}
  
  <form method="POST" use:enhance>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required />
    </div>
    
    <div class="form-group">
      <PasswordInput
        bind:value={password}
        id="password"
        name="password"
        label="Password"
        required={true}
        error={form?.error && form.error.toLowerCase().includes('password') ? form.error : null}
      />
      <!-- Hidden input to ensure form submission works -->
      <input type="hidden" name="password" value={password} />
    </div>
    
    <button type="submit">Login</button>
  </form>
  
  <div class="auth-links">
    <a href="/auth/register">Need an account? Register</a>
    <a href="/auth/reset-password">Forgot password?</a>
  </div>
</div>

<style>
  .auth-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .error {
    color: red;
    margin-bottom: 1rem;
  }
  
  .auth-links {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>