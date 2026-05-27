"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/notifications");
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error(error);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  };

  const openNotification = async (item: any) => {
    await supabase
      .from("notifications")
      .update({ isRead: true })
      .eq("id", item.id);

    if (item.link) {
      router.push(item.link);
    } else {
      await loadNotifications();
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل الإشعارات...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">🔔 الإشعارات</h1>
          <p className="mt-2 text-slate-300">
            جميع تنبيهات حسابك في مكان واحد.
          </p>
        </section>

        {notifications.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <p className="text-xl font-black text-slate-800">
              لا توجد إشعارات
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <button
                key={item.id}
                onClick={() => openNotification(item)}
                className={`block w-full rounded-3xl p-5 text-right shadow transition hover:-translate-y-1 ${
                  item.isRead
                    ? "bg-white"
                    : "bg-green-50 ring-2 ring-green-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {item.title}
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {item.message}
                    </p>
                  </div>

                  {!item.isRead && (
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                      جديد
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("ar-IQ")
                    : ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}