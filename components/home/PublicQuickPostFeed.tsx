"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, type ComponentProps } from "react";
import { getQuickPostsByType, type AgendaCategory } from "@/lib/actions/quick-post";
import { QuickPostFeed, type QuickPostColumns } from "./QuickPostFeed";

type Options = { limitPerType?: number; upcomingAgendaOnly?: boolean };
type Props = Omit<ComponentProps<typeof QuickPostFeed>, "isAdmin"> & {
  adminOptions?: Options;
  agendaCategory?: AgendaCategory;
};

// Only coalesce simultaneous admin requests (e.g. the two home columns).
// No long-lived private data cache, and every action verifies the session.
const pending = new Map<string, Promise<QuickPostColumns>>();
function loadAdminPosts(key: string, options: Options) {
  const existing = pending.get(key);
  if (existing) return existing;
  const request = getQuickPostsByType({ ...options, includeDrafts: true });
  pending.set(key, request);
  void request.finally(() => { if (pending.get(key) === request) pending.delete(key); }).catch(() => {});
  return request;
}

export function PublicQuickPostFeed({ quickPosts, adminOptions, agendaCategory, ...props }: Props) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const limitPerType = adminOptions?.limitPerType ?? 60;
  const upcomingAgendaOnly = adminOptions?.upcomingAgendaOnly ?? false;
  const [privatePosts, setPrivatePosts] = useState<{ source: QuickPostColumns; owner: string; posts: QuickPostColumns } | null>(null);
  const owner = session?.user?.email || session?.user?.name || "";
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const key = JSON.stringify([owner, limitPerType, upcomingAgendaOnly, quickPosts]);
    void loadAdminPosts(key, { limitPerType, upcomingAgendaOnly }).then((posts) => {
      if (active) setPrivatePosts({ source: quickPosts, owner, posts });
    }).catch(() => {});
    return () => { active = false; };
  }, [isAdmin, owner, limitPerType, upcomingAgendaOnly, quickPosts]);
  const columns = isAdmin && privatePosts?.source === quickPosts && privatePosts.owner === owner ? privatePosts.posts : quickPosts;
  const filtered = agendaCategory ? { ...columns, AGENDA: columns.AGENDA.filter((post) => post.agendaCategory === agendaCategory) } : columns;
  return <QuickPostFeed {...props} quickPosts={filtered} isAdmin={isAdmin} />;
}
