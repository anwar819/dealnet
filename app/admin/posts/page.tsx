"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminPosts() {
  const router = useRouter();

  const [posts, setPosts] = useState<any[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/admin/posts");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("isAdmin")
      .eq("id", user.id)
      .single();

    if (!profile?.isAdmin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    await loadPosts();
    setLoading(false);
  };

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error(error);
      setPosts([]);
      return;
    }

    setPosts(data || []);
  };

  const toggleHide = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("posts")
      .update({ isHidden: !current })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل تعديل حالة الإعلان");
      return;
    }

    await loadPosts();
  };

  const toggleBoost = async (id: string, current: boolean) => {
    const now = Date.now();
    const expiresAt = now + 3 * 24 * 60 * 60 * 1000;

    const updateData = current
      ? {
          isBoosted: false,
          boostedAt: null,
          boostExpiresAt: null,
        }
      : {
          isBoosted: true,
          boostedAt: now,
          boostExpiresAt: expiresAt,
        };

    const { error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل تعديل الترويج");
      return;
    }

    await loadPosts();
  };

  const deletePostHandler = async (id: string) => {
    if (!confirm("هل تريد حذف الإعلان؟")) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل حذف الإعلان");
      return;
    }

    await loadPosts();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل إدارة الإعلانات...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-red-600">غير مصرح</h1>
          <p className="mt-2 text-slate-500">هذه الصفحة مخصصة لمدير النظام فقط.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">📦 إدارة الإعلانات</h1>
          <p className="mt-2 text-slate-300">
            تحكم بالإعلانات، الإخفاء، الترويج، والحذف.
          </p>
        </section>

        {posts.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            لا توجد إعلانات حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="rounded-3xl bg-white p-5 shadow">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {p.title || "بدون عنوان"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {p.description || p.desc || "لا يوجد وصف"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      {p.isHidden && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                          مخفي
                        </span>
                      )}

                      {p.isBoosted && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                          🔥 مروّج
                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        السعر: {p.price || "غير محدد"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleHide(p.id, p.isHidden)}
                      className="rounded-xl bg-yellow-500 px-4 py-2 font-bold text-white"
                    >
                      {p.isHidden ? "إظهار" : "إخفاء"}
                    </button>

                    <button
                      onClick={() => toggleBoost(p.id, p.isBoosted)}
                      className="rounded-xl bg-purple-500 px-4 py-2 font-bold text-white"
                    >
                      {p.isBoosted ? "إلغاء الترويج" : "ترويج"}
                    </button>

                    <button
                      onClick={() => router.push(`/post/${p.id}`)}
                      className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white"
                    >
                      عرض
                    </button>

                    <button
                      onClick={() => deletePostHandler(p.id)}
                      className="rounded-xl bg-red-500 px-4 py-2 font-bold text-white"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}