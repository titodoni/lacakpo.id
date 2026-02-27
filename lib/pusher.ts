import Pusher from 'pusher';

// Server-side Pusher client configuration
const pusherAppId = process.env.PUSHER_APP_ID;
const pusherKey = process.env.PUSHER_KEY;
const pusherSecret = process.env.PUSHER_SECRET;
const pusherCluster = process.env.PUSHER_CLUSTER || 'ap1';

// Check if we have valid credentials (not placeholders)
const hasValidCredentials = 
  pusherAppId && 
  pusherAppId !== 'your-pusher-app-id' &&
  pusherAppId !== 'demo' &&
  pusherKey && 
  pusherKey !== 'your-pusher-key' &&
  pusherSecret &&
  pusherSecret !== 'your-pusher-secret' &&
  pusherSecret !== 'demo-secret';

// Initialize Pusher server client only if we have valid credentials
export const pusherServer = hasValidCredentials 
  ? new Pusher({
      appId: pusherAppId!,
      key: pusherKey!,
      secret: pusherSecret!,
      cluster: pusherCluster,
      useTLS: true,
    })
  : null;

// Safe trigger function that handles missing credentials gracefully
export async function triggerPusherEvent(
  channel: string, 
  event: string, 
  data: unknown
): Promise<void> {
  if (!pusherServer) {
    console.log('📡 [Pusher] Skipping event (no valid credentials):', { channel, event, data });
    return;
  }
  
  try {
    await pusherServer.trigger(channel, event, data);
    console.log('📡 [Pusher] Event triggered:', { channel, event });
  } catch (error) {
    console.error('📡 [Pusher] Failed to trigger event:', error);
    throw error;
  }
}

// Event types for type safety

// Track progress update
export interface TrackUpdateEvent {
  actorName: string;
  itemName: string;
  department: string;
  oldProgress: number;
  newProgress: number;
  poNumber: string;
}

// New PO created
export interface POEvent {
  poNumber: string;
  clientName: string;
  createdBy: string;
}

// Issue reported
export interface IssueEvent {
  title: string;
  itemName: string;
  department: string;
  reportedBy: string;
  priority: string;
}

// Delivery updated
export interface DeliveryEvent {
  actorName: string;
  itemName: string;
  poNumber: string;
  oldQuantity: number;
  newQuantity: number;
  totalQuantity: number;
  unit: string;
  isFullyDelivered: boolean;
}

// Finance updated
export interface FinanceEvent {
  actorName: string;
  poNumber: string;
  action: 'invoiced' | 'uninvoiced' | 'paid' | 'unpaid' | 'updated';
  invoiceNumber?: string;
  isPaid: boolean;
  isInvoiced: boolean;
}

// Issue resolved
export interface IssueResolvedEvent {
  resolverName: string;
  issueTitle: string;
  itemName: string;
  priority: string;
}
