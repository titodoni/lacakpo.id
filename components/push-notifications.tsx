'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';

// Extend Window interface for PusherPushNotifications
declare global {
  interface Window {
    PusherPushNotifications: {
      Client: new (config: { instanceId: string }) => {
        start: () => Promise<void>;
        addDeviceInterest: (interest: string) => Promise<void>;
        removeDeviceInterest: (interest: string) => Promise<void>;
        setUserId: (userId: string, tokenProvider: { fetchToken: () => Promise<string> }) => Promise<void>;
        stop: () => Promise<void>;
      };
    };
  }
}

// Pusher Beams Instance ID
// Replace with your actual Instance ID from Pusher dashboard
const BEAMS_INSTANCE_ID = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || '9ac06678-b903-45a1-aa80-144199276dd4';

export function PushNotifications() {
  const { user, loading } = useUser();
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // Only register if user is logged in
    if (!user || loading) return;

    // Check if PusherPushNotifications is available
    if (!window.PusherPushNotifications) {
      console.warn('Pusher Push Notifications SDK not loaded');
      return;
    }

    const registerPushNotifications = async () => {
      try {
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: BEAMS_INSTANCE_ID,
        });

        // Start the Beams client
        await beamsClient.start();
        
        // Subscribe to general channel
        await beamsClient.addDeviceInterest('po-updates');
        
        // Subscribe to user-specific channel for personal notifications
        await beamsClient.addDeviceInterest(`user-${user.userId}`);
        
        // Subscribe to department-specific channel
        await beamsClient.addDeviceInterest(`dept-${user.department}`);

        console.log('Successfully registered for push notifications!');
        console.log('Subscribed to interests:', ['po-updates', `user-${user.userId}`, `dept-${user.department}`]);
        setIsRegistered(true);
      } catch (error) {
        console.error('Failed to register push notifications:', error);
      }
    };

    registerPushNotifications();

    // Cleanup on unmount
    return () => {
      // Note: We don't stop the client on unmount as we want notifications
      // to persist while the user is navigating the app
    };
  }, [user, loading]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Load the Pusher Beams SDK script
 * Include this in your layout.tsx head section
 */
export function PusherBeamsScript() {
  return (
    <script
      src="https://js.pusher.com/beams/1.0/push-notifications-cdn.js"
      async
    />
  );
}
