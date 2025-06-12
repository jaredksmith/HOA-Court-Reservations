import { db } from '$lib/server/db';
import type { User, Profile, HOA, UserRole } from '$lib/types';
import { error } from '@sveltejs/kit';

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string,
  householdId: string,
  hoaId: string,
  role: UserRole = 'member'
) {
  try {
    // Verify HOA exists and is active
    const hoa = await db.getHOAById(hoaId);
    if (!hoa || !hoa.is_active) {
      throw new Error('Invalid or inactive HOA');
    }

    // Create user in auth system
    const user = await db.createUser(email, password);

    // Create profile with HOA association
    const profile = await db.createProfile({
      user_id: user.id,
      hoa_id: hoaId,
      full_name: fullName,
      phone_number: phoneNumber,
      household_id: householdId,
      role,
      prime_hours: hoa.default_prime_hours,
      standard_hours: hoa.default_standard_hours,
      last_reset: new Date().toISOString(),
      is_active: true
    });

    return { user, profile, hoa };
  } catch (err) {
    console.error('Error creating user:', err);
    throw error(500, 'Failed to create user');
  }
}

export async function createUserWithInvitationCode(
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string,
  householdId: string,
  invitationCode: string
) {
  try {
    // Find HOA by invitation code
    const hoa = await db.getHOAByInvitationCode(invitationCode);
    if (!hoa) {
      throw new Error('Invalid invitation code');
    }

    return await createUser(email, password, fullName, phoneNumber, householdId, hoa.id);
  } catch (err) {
    console.error('Error creating user with invitation code:', err);
    throw error(500, 'Failed to create user');
  }
}

export async function getUserWithHOA(userId: string): Promise<{ user: User; profile: Profile; hoa: HOA } | null> {
  try {
    const profile = await db.getProfileByUserId(userId);
    if (!profile) return null;

    const hoa = await db.getHOAById(profile.hoa_id);
    if (!hoa) return null;

    // Get user from auth
    const user = await db.getUserBySessionId(userId);
    if (!user) return null;

    return { user, profile, hoa };
  } catch (err) {
    console.error('Error getting user with HOA:', err);
    return null;
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