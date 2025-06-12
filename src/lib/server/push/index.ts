import webpush from 'web-push';
import { env } from '$env/dynamic/private';
import { db, supabase } from '$lib/server/db';
import type { PushSubscription, Profile } from '$lib/types';

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send push notification to a single user
 */
export async function sendPushNotification(
  userId: string,
  notification: PushNotificationData
): Promise<void> {
  try {
    // Get user's push subscriptions from database
    const subscriptions = await getUserPushSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }
    
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-72x72.png',
      data: notification.data || {},
      actions: notification.actions || []
    });
    
    // Send to all user's subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          payload
        );
      } catch (error) {
        console.error(`Failed to send push notification to subscription ${subscription.id}:`, error);
        // TODO: Remove invalid subscriptions from database
      }
    });
    
    await Promise.allSettled(promises);
    
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notifications to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  notification: PushNotificationData
): Promise<void> {
  const promises = userIds.map(userId => 
    sendPushNotification(userId, notification)
  );
  
  await Promise.allSettled(promises);
}

/**
 * Get all push subscriptions for a user
 */
async function getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return [];
    }

    return data as PushSubscription[];
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return [];
  }
}

/**
 * Save a push subscription for a user
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionJSON
): Promise<void> {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error('Invalid push subscription');
  }
  
  await db.savePushSubscription({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth
  });
}

/**
 * Send booking invitation notifications
 */
export async function sendBookingInvitation(
  userIds: string[],
  bookingDetails: {
    id: string;
    organizer: string;
    startTime: string;
    courts: number[];
  }
): Promise<void> {
  const notification: PushNotificationData = {
    title: 'Court Booking Invitation',
    body: `${bookingDetails.organizer} invited you to play on court ${bookingDetails.courts.join(', ')}`,
    data: {
      bookingId: bookingDetails.id,
      type: 'booking_invitation'
    },
    actions: [
      {
        action: 'accept',
        title: 'Accept'
      },
      {
        action: 'decline',
        title: 'Decline'
      }
    ]
  };
  
  await sendPushNotificationToUsers(userIds, notification);
}

/**
 * Send booking confirmation notifications
 */
export async function sendBookingConfirmation(
  userIds: string[],
  bookingDetails: {
    id: string;
    startTime: string;
    courts: number[];
  }
): Promise<void> {
  const notification: PushNotificationData = {
    title: 'Booking Confirmed',
    body: `Your court booking for ${bookingDetails.courts.join(', ')} has been confirmed`,
    data: {
      bookingId: bookingDetails.id,
      type: 'booking_confirmed'
    }
  };
  
  await sendPushNotificationToUsers(userIds, notification);
}

/**
 * Send booking reminder notifications
 */
export async function sendBookingReminder(
  userIds: string[],
  bookingDetails: {
    id: string;
    startTime: string;
    courts: number[];
  },
  reminderType: '48h' | '24h' | '2h'
): Promise<void> {
  const timeLabels = {
    '48h': '48 hours',
    '24h': '24 hours',
    '2h': '2 hours'
  };

  const notification: PushNotificationData = {
    title: 'Booking Reminder',
    body: `Your court booking starts in ${timeLabels[reminderType]}`,
    data: {
      bookingId: bookingDetails.id,
      type: 'booking_reminder',
      reminderType
    }
  };

  await sendPushNotificationToUsers(userIds, notification);
}

/**
 * Send push notifications to users by phone numbers
 * Useful for targeting users when you have their phone numbers
 */
export async function sendPushNotificationByPhones(
  phoneNumbers: string[],
  notification: PushNotificationData
): Promise<void> {
  try {
    // Get user IDs from phone numbers
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, phone_number, full_name')
      .in('phone_number', phoneNumbers);

    if (profileError) {
      console.error('Error fetching profiles by phone numbers:', profileError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users found for phone numbers:', phoneNumbers);
      return;
    }

    const userIds = profiles.map(profile => profile.user_id);
    console.log(`Sending notifications to ${profiles.length} users found by phone numbers`);

    // Use existing function to send notifications
    await sendPushNotificationToUsers(userIds, notification);
  } catch (error) {
    console.error('Error sending push notifications by phone numbers:', error);
  }
}

/**
 * Get user profile by phone number
 * Useful for user lookup and verification
 */
export async function getUserByPhoneNumber(phoneNumber: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error fetching user by phone number:', error);
    return null;
  }
}

/**
 * Send booking invitation by phone numbers
 */
export async function sendBookingInvitationByPhones(
  phoneNumbers: string[],
  bookingDetails: {
    id: string;
    organizer: string;
    startTime: string;
    courts: number[];
  }
): Promise<void> {
  const notification: PushNotificationData = {
    title: 'Court Booking Invitation',
    body: `${bookingDetails.organizer} invited you to play on court ${bookingDetails.courts.join(', ')}`,
    data: {
      bookingId: bookingDetails.id,
      type: 'booking_invitation'
    },
    actions: [
      {
        action: 'accept',
        title: 'Accept'
      },
      {
        action: 'decline',
        title: 'Decline'
      }
    ]
  };

  await sendPushNotificationByPhones(phoneNumbers, notification);
}
