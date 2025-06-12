<script lang="ts">
  import { enhance } from '$app/forms';
  
  export let form;
</script>

<div class="auth-container">
  <h1>Register</h1>
  
  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}
  
  <form method="POST" use:enhance>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required />
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required />
    </div>
    
    <div class="form-group">
      <label for="fullName">Full Name</label>
      <input type="text" id="fullName" name="fullName" required />
    </div>
    
    <div class="form-group">
      <label for="householdId">Household ID</label>
      <input type="text" id="householdId" name="householdId" required />
      <small>This is your HOA household identifier</small>
    </div>
    
    <button type="submit">Register</button>
  </form>
  
  <div class="auth-links">
    <a href="/auth/login">Already have an account? Login</a>
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
  
  small {
    display: block;
    color: #666;
    margin-top: 0.25rem;
  }
  
  .auth-links {
    margin-top: 1rem;
  }
</style>