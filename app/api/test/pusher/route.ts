import { NextRequest, NextResponse } from 'next/server';
import { triggerPusherEvent } from '@/lib/pusher';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/pusher - Test Pusher event publishing
 * 
 * This endpoint is for testing real-time sync functionality.
 * In production, events are triggered automatically when data changes.
 */
export async function POST(req: NextRequest) {
  try {
    // Check if user is logged in
    const session = await requireAuth();
    
    const body = await req.json();
    const { channel = 'po-channel', event = 'test-event', data } = body;

    // Trigger the event
    await triggerPusherEvent(channel, event, data || {
      message: 'Hello from server!',
      timestamp: new Date().toISOString(),
      triggeredBy: session.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Event published',
      channel,
      event,
      data,
    });
  } catch (error) {
    console.error('POST /api/test/pusher error:', error);
    return NextResponse.json(
      { error: 'Failed to publish event', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/pusher - Check Pusher configuration status
 */
export async function GET() {
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const hasCredentials = 
    process.env.PUSHER_APP_ID && 
    process.env.PUSHER_APP_ID !== 'your-pusher-app-id' &&
    process.env.PUSHER_KEY && 
    process.env.PUSHER_KEY !== 'your-pusher-key';

  return NextResponse.json({
    configured: hasCredentials,
    key: pusherKey ? `${pusherKey.substring(0, 8)}...` : null,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    message: hasCredentials 
      ? 'Pusher is configured correctly'
      : 'Pusher credentials not set. Add them to .env.local',
  });
}
