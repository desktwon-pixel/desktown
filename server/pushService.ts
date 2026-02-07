import webpush from 'web-push';
import { storage } from './storage.ts';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@cloudoffice.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    [key: string]: unknown;
  };
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  try {
    const subscriptions = await storage.getPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const payloadString = JSON.stringify(payload);
    const failedSubscriptions: Array<{ endpoint: string; userId: string }> = [];

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payloadString,
            {
              TTL: 86400,
              urgency: 'high',
            }
          );
          console.log(`Push notification sent to ${subscription.endpoint.substring(0, 50)}...`);
        } catch (error: any) {
          console.error('Failed to send push notification:', error.message);
          if (error.statusCode === 404 || error.statusCode === 410) {
            failedSubscriptions.push({ endpoint: subscription.endpoint, userId: subscription.userId });
          }
        }
      })
    );

    for (const { endpoint, userId: subUserId } of failedSubscriptions) {
      await storage.deletePushSubscription(endpoint, subUserId);
      console.log(`Removed invalid subscription: ${endpoint.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

export async function sendPushToAllUsers(payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  try {
    const allSubscriptions = await storage.getAllPushSubscriptions();

    if (allSubscriptions.length === 0) {
      console.log('No push subscriptions found');
      return;
    }

    const payloadString = JSON.stringify(payload);
    const failedSubscriptions: Array<{ endpoint: string; userId: string }> = [];

    await Promise.all(
      allSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payloadString,
            {
              TTL: 86400,
              urgency: 'normal',
            }
          );
        } catch (error: any) {
          console.error('Failed to send push notification:', error.message);
          if (error.statusCode === 404 || error.statusCode === 410) {
            failedSubscriptions.push({ endpoint: subscription.endpoint, userId: subscription.userId });
          }
        }
      })
    );

    for (const { endpoint, userId } of failedSubscriptions) {
      await storage.deletePushSubscription(endpoint, userId);
    }
  } catch (error) {
    console.error('Error broadcasting push notifications:', error);
  }
}
