import { createClient } from "@/lib/supabase/server";
import { getUnreadNotifications } from "@/utils/query/notifications";

/**
 * SSE endpoint that polls unread notifications every 4 seconds.
 * Compatible with Vercel serverless (no persistent WebSocket needed).
 * Client reconnects automatically via EventSource.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      // Send initial payload immediately
      const initial = await getUnreadNotifications(supabase);
      send({ notifications: initial });

      // Poll every 4 seconds
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }
        try {
          const notifications = await getUnreadNotifications(supabase);
          send({ notifications });
        } catch {
          clearInterval(interval);
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }, 4000);

      // Vercel times out functions after ~25s for streaming; client will reconnect
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
