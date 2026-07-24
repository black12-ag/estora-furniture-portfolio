import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session-store";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const session = useSession();
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    if (!session) { setRows([]); return; }
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, body, link, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setRows((data ?? []) as NotificationRow[]);
  }
  useEffect(() => { void load(); }, [session?.id]);

  // Realtime updates
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`notifs-${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${session.id}` },
        () => { void load(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [session?.id]);

  const unread = useMemo(() => rows.filter((r) => !r.is_read).length, [rows]);

  async function markAllRead() {
    if (unread === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    load();
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    load();
  }
  async function dismiss(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    load();
  }

  if (!session) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-accent"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="px-0">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-96 overflow-y-auto">
          {rows.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          )}
          {rows.map((r) => (
            <div key={r.id} className={`group flex items-start gap-2 border-b border-border p-3 last:border-0 ${r.is_read ? "" : "bg-accent/30"}`}>
              <div className="min-w-0 flex-1">
                {r.link ? (
                  <Link to={r.link} onClick={() => { markOne(r.id); setOpen(false); }} className="block">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </Link>
                ) : (
                  <>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                {!r.is_read && (
                  <button onClick={() => markOne(r.id)} title="Mark read" className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface">
                    <Check className="h-3 w-3" />
                  </button>
                )}
                <button onClick={() => dismiss(r.id)} title="Dismiss" className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
