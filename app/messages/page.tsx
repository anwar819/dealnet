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

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
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

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .contains("users", [user.id])
      .order("updatedAt", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setChats(data || []);
    setLoading(false);
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
      <div className="mx-auto max-w-4xl">
        <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">📩 الرسائل</h1>

          <p className="mt-2 text-slate-300">
            جميع محادثاتك مع البائعين والمشترين في مكان واحد.
          </p>
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
            {chats.map((chat) => {
              const isSeller = chat.sellerId === userId;

              const roleLabel = isSeller
                ? "مشتري محتمل"
                : "بائع";

              const otherName = isSeller
                ? chat.buyerName || "مستخدم"
                : chat.sellerName || "مستخدم";

              return (
                <button
                  key={chat.id}
                  onClick={() =>
                    router.push(`/chat/${chat.chatId || chat.id}`)
                  }
                  className="flex w-full items-center gap-4 border-b border-slate-100 p-4 text-right transition hover:bg-slate-50"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-500 text-xl font-black text-white">
                    {otherName?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate text-lg font-black text-slate-900">
                        {otherName}
                      </h2>

                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm font-bold text-slate-600">
                      {chat.postTitle || "إعلان"}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {chat.lastMessage || "لا توجد رسائل بعد"}
                    </p>

                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      {roleLabel}
                    </span>
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