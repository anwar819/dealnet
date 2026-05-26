"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AccountPage() {
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);

  const [postsCount, setPostsCount] = useState(0);
  const [chatsCount, setChatsCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data) {
      router.push("/login");
      return;
    }

    setUserData(data);

    await loadStats(user.id);

    setLoading(false);
  };

  const loadStats = async (uid: string) => {
    const { count: posts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("userId", uid);

    setPostsCount(posts || 0);

    const { count: chats } = await supabase
      .from("chats")
      .select("*", { count: "exact", head: true });

    setChatsCount(chats || 0);

    const { data: ratings } = await supabase
      .from("ratings")
      .select("rating")
      .eq("sellerId", uid);

    const ratingsArray =
      ratings?.map((item: any) => Number(item.rating || 0)) || [];

    setRatingsCount(ratingsArray.length);

    const avg =
      ratingsArray.length > 0
        ? ratingsArray.reduce((sum, value) => sum + value, 0) /
          ratingsArray.length
        : 0;

    setAvgRating(avg);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل الحساب...
      </main>
    );
  }

  if (!userData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        لم يتم العثور على بيانات الحساب
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-3xl font-black">
                {(userData.firstName || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-3xl font-black">
                  {userData.firstName || "مستخدم"} {userData.lastName || ""}
                </h1>

                <p className="mt-1 text-slate-300">{userData.email}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {userData.isVerified ? (
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                      ⭐ بائع موثوق
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                      غير موثق
                    </span>
                  )}

                  {userData.isAdmin && (
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                      ⚡ مدير النظام
                    </span>
                  )}

                  {userData.isBlocked && (
                    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      🚫 محظور
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/create-post")}
                className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white hover:bg-green-600"
              >
                + نشر إعلان
              </button>

              <button
                onClick={logout}
                className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}