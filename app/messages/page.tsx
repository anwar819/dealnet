"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function MessagesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const [chats, setChats] = useState<any[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!userId || isBlocked) return;

    loadChats();

    const channel = supabase
      .channel("messages-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isBlocked]);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.isBlocked) {
        setIsBlocked(true);
        setLoading(false);

        alert("🚫 تم حظر حسابك");

        router.push("/");
        return;
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء التحقق من الحساب");
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .contains("users", [userId])
        .order("updatedAt", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setChats(data || []);

      const unreadCounts: Record<string, number> = {};

      for (const chat of data || []) {
        const { count } = await supabase
          .from("messages")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("chatId", chat.chatId)
          .eq("receiverId", userId)
          .eq("isRead", false);

        unreadCounts[chat.chatId] = count || 0;
      }

      setUnreadMap(unreadCounts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: number) => {
    if (!value) return "";

    return new Date(value).toLocaleString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل الرسائل...
      </main>
    );
  }

  if (isBlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-red-600">
            🚫 حسابك محظور
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">📩 الرسائل</h1>

              <p className="mt-2 text-slate-300">
                جميع محادثاتك مع البائعين والمشترين في مكان واحد.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-3 text-center">
              <div className="text-2xl font-black">
                {chats.length}
              </div>

              <div className="text-xs text-slate-300">
                محادثة
              </div>
            </div>
          </div>
        </section>

        {chats.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <p className="text-xl font-black text-slate-800">
              لا توجد محادثات بعد
            </p>

            <p className="mt-2 text-slate-500">
              عندما تبدأ محادثة مع بائع ستظهر هنا.
            </p>

            <button
              onClick={() => router.push("/marketplace")}
              className="mt-6 rounded-xl bg-green-500 px-6 py-3 font-bold text-white hover:bg-green-600"
            >
              تصفح السوق
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow">
            {chats.map((chat, index) => {
              const isSeller = chat.sellerId === userId;

              const otherName = isSeller
                ? chat.buyerName || "مستخدم"
                : chat.sellerName || "مستخدم";

              const roleLabel = isSeller
                ? "مشتري"
                : "بائع";

              const unreadCount =
                unreadMap[chat.chatId] || 0;

              return (
                <button
                  key={chat.id}
                  onClick={() =>
                    router.push(`/chat/${chat.chatId || chat.id}`)
                  }
                  className={`flex w-full items-center gap-4 p-5 text-right transition hover:bg-slate-50 ${
                    index !== chats.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-2xl font-black text-white shadow">
                      {otherName?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    {unreadCount > 0 && (
                      <div className="absolute -left-1 -top-1 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-black text-white shadow-lg">
                        {unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-black text-slate-900">
                          {otherName}
                        </h2>

                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                          {roleLabel}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs font-bold text-slate-400">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm font-bold text-green-700">
                      📦 {chat.postTitle || "إعلان"}
                    </p>

                    <p
                      className={`mt-2 truncate text-sm ${
                        unreadCount > 0
                          ? "font-bold text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {chat.lastMessage || "لا توجد رسائل بعد"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}