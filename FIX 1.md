FIX 1.1 — Pusher Real-Time Sync (Already Discussed)
Problem: Manager opens app → sees stale data → goes to WhatsApp instead
Impact: Directly solves the #1 stated problem
What to build:
When ANY user updates a track progress → all other users' screens refresh automatically
with a toast: "Andi updated Production · Bracket SKF 6205 · 50% → 80%"
Implementation:
typescript// lib/pusher.ts
import Pusher from 'pusher';
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!, // ap1 for Indonesia
  useTLS: true,
});

// hooks/use-realtime-sync.ts
export function useRealtimeSync() {
  const router = useRouter();
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe('po-channel');

    channel.bind('track-updated', (data: TrackUpdateEvent) => {
      toast.info(`${data.actorName} · ${data.itemName}`, {
        description: `${data.department} ${data.oldProgress}% → ${data.newProgress}%`,
        duration: 4000,
      });
      router.refresh();
    });

    channel.bind('po-created', (data: POEvent) => {
      toast.success(`PO Baru: ${data.poNumber}`, { duration: 4000 });
      router.refresh();
    });

    channel.bind('issue-reported', (data: IssueEvent) => {
      toast.warning(`Issue: ${data.title} · ${data.itemName}`, { duration: 6000 });
      router.refresh();
    });

    return () => { channel.unbind_all(); pusher.disconnect(); };
  }, [router]);
}
Trigger in track update API:
typescript// After saving to DB:
await pusherServer.trigger('po-channel', 'track-updated', {
  actorName: session.user.name,
  itemName: item.item_name,
  department: track.department,
  oldProgress: track.progress,
  newProgress: body.newProgress,
  poNumber: po.po_number,
});
Files to modify: lib/pusher.ts (new), hooks/use-realtime-sync.ts (new),
components/realtime-provider.tsx (new), app/layout.tsx, all track update routes