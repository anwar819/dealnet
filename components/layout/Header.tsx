"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);

  const clearUser = () => {
    setUser(null);
    setFirstName("");
    setUnreadCount(0);
    setReady(true);
  };

  const loadUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      clearUser();
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from("users")
      .select("firstName")
      .eq("id", session.user.id)
      .maybeSingle();

    setFirstName(profile?.firstName || "مستخدم");
    await loadUnreadNotifications(session.user.id);
    setReady(true);
  };

  const loadUnreadNotifications = async (userId: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .eq("isRead", false);

    setUnreadCount(count || 0);
  };

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        clearUser();
        return;
      }

      await loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`header-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `userId=eq.${user.id}`,
        },
        () => {
          loadUnreadNotifications(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900 bg-black text-white shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/marketplace" className="text-3xl font-black tracking-tight">
          <span className="text-green-400">Deal</span>
          <span className="text-white">Net</span>
        </Link>

        {!ready ? null : user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xl transition hover:bg-slate-800"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -left-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-black text-white shadow">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold transition hover:bg-slate-800"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                {firstName ? firstName.charAt(0).toUpperCase() : "U"}
              </span>
              <span>{firstName}</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold transition hover:bg-green-600"
            >
              تسجيل الدخول
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-slate-200"
            >
              إنشاء حساب
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}