import { db } from '$lib/server/db';
import type { User, Profile } from '$lib/types';
import { error } from '@sveltejs/kit';

export async function createUser(email: string, password: string, fullName: string, householdId: string) {
  try {
    // Create user in auth system
    const user = await db.createUser(email, password);
    
    // Create profile with initial hour allocation
    const profile = await db.createProfile({
      user_id: user.id,
      full_name: fullName,
      household_id: householdId,
      prime_hours: 4, // Default allocation
      standard_hours: 8, // Default allocation
      is_admin: false,
      last_reset: new Date().toISOString()
    });
    
    return { user, profile };
  } catch (err) {
    console.error('Error creating user:', err);
    throw error(500, 'Failed to create user');
  }
}

export async function getUserFromSession(sessionId: string | undefined): Promise<User | null> {
  if (!sessionId) return null;
  
  try {
    return await db.getUserBySessionId(sessionId);
  } catch (err) {
    console.error('Error getting user from session:', err);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    return await db.getProfileByUserId(userId);
  } catch (err) {
    console.error('Error getting user profile:', err);
    return null;
  }
}

export async function resetAllUserHours() {
  try {
    // Reset all users' hour allocations
    await db.resetAllUserHours({
      prime_hours: 4, // Default allocation
      standard_hours: 8, // Default allocation
      last_reset: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error resetting user hours:', err);
    throw error(500, 'Failed to reset user hours');
  }
}