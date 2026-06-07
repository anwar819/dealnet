"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function MyPostsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndLoadPosts();
  }, []);

  const checkUserAndLoadPosts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/my-posts");
      return;
    }

    await loadPosts(user.id);
  };

  const loadPosts = async (uid: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("userId", uid)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error(error);
      setPosts([]);
      setLoading(false);
      return;
    }

    setPosts(data || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const total = posts.length;
    const hidden = posts.filter((p) => p.isHidden).length;
    const boosted = posts.filter(
      (p) => p.isBoosted && p.boostExpiresAt && p.boostExpiresAt > Date.now()
    ).length;
    const active = total - hidden;

    return { total, active, hidden, boosted };
  }, [posts]);

  const getMainImage = (post: any) => {
    if (post.imageUrls?.length) return post.imageUrls[0];
    if (post.images?.length) return post.images[0];
    if (post.imageUrl) return post.imageUrl;
    return "";
  };

  const isBoosted = (post: any) => {
    return post.isBoosted && post.boostExpiresAt && post.boostExpiresAt > Date.now();
  };

  const formatPrice = (price?: string) => {
    if (!price) return "حسب الاتفاق";

    const num = Number(String(price).replace(/[^\d.]/g, ""));
    if (!num) return "حسب الاتفاق";

    return `${num.toLocaleString("en-US")} د.ع`;
  };

  const formatDate = (value?: number) => {
    if (!value) return "غير معروف";

    const diff = Date.now() - value;
    const day = 24 * 60 * 60 * 1000;

    if (diff < day) return "اليوم";
    if (diff < day * 2) return "أمس";
    if (diff < day * 7) return `منذ ${Math.floor(diff / day)} أيام`;

    return new Date(value).toLocaleDateString("ar-IQ");
  };

  const deletePost = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الإعلان؟")) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل حذف الإعلان");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleHidden = async (post: any) => {
    const nextValue = !post.isHidden;

    const { error } = await supabase
      .from("posts")
      .update({
        isHidden: nextValue,
        updatedAt: Date.now(),
      })
      .eq("id", post.id);

    if (error) {
      console.error(error);
      alert("فشل تحديث حالة الإعلان");
      return;
    }

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isHidden: nextValue } : p))
    );

    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل إعلاناتك...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-black text-green-400">
                DealNet Seller Center
              </p>

              <h1 className="text-4xl font-black">📦 إعلاناتي</h1>

              <p className="mt-3 text-slate-300">
                إدارة إعلاناتك بدون إزعاج، مع عرض واضح للإعلان أولاً.
              </p>
            </div>

            <button
              onClick={() => router.push("/create-post")}
              className="rounded-2xl bg-green-500 px-6 py-4 font-black text-white hover:bg-green-600"
            >
              + نشر إعلان جديد
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">كل الإعلانات</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-green-600">{stats.active}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">نشطة</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-orange-500">{stats.boosted}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">مروّجة</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-red-500">{stats.hidden}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">مخفية</p>
          </div>
        </section>

        {posts.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-12 text-center shadow">
            <p className="text-2xl font-black text-slate-900">
              لا توجد إعلانات بعد
            </p>

            <p className="mt-2 text-slate-500">
              ابدأ بنشر أول إعلان لك على DealNet.
            </p>

            <button
              onClick={() => router.push("/create-post")}
              className="mt-6 rounded-2xl bg-green-500 px-8 py-4 font-black text-white hover:bg-green-600"
            >
              + نشر إعلان
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const image = getMainImage(post);
              const boosted = isBoosted(post);
              const menuOpen = openMenuId === post.id;

              return (
                <article
                  key={post.id}
                  className={`relative overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    post.isHidden
                      ? "border-red-200 opacity-80"
                      : boosted
                      ? "border-orange-400 ring-2 ring-orange-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="relative h-60 bg-slate-200">
                    {image ? (
                      <img
                        src={image}
                        alt={post.title || "إعلان"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        لا توجد صورة
                      </div>
                    )}

                    <div className="absolute right-3 top-3 flex flex-wrap gap-2">
                      {post.isHidden ? (
                        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                          مخفي
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black text-white">
                          نشط
                        </span>
                      )}

                      {boosted && (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                          🔥 مروّج
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setOpenMenuId(menuOpen ? null : post.id)}
                      className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-slate-900 shadow hover:bg-slate-100"
                    >
                      ⋮
                    </button>

                    {menuOpen && (
                      <div className="absolute left-3 top-16 z-20 w-44 overflow-hidden rounded-2xl bg-white text-sm font-bold shadow-xl">
                        <button
                          onClick={() => router.push(`/edit/${post.id}`)}
                          className="block w-full px-4 py-3 text-right hover:bg-slate-100"
                        >
                          ✏ تعديل
                        </button>

                        <button
                          onClick={() => router.push(`/boost/${post.id}`)}
                          className="block w-full px-4 py-3 text-right hover:bg-slate-100"
                        >
                          🔥 ترويج
                        </button>

                        <button
                          onClick={() => toggleHidden(post)}
                          className="block w-full px-4 py-3 text-right hover:bg-slate-100"
                        >
                          {post.isHidden ? "👁 إظهار" : "🙈 إخفاء"}
                        </button>

                        <button
                          onClick={() => deletePost(post.id)}
                          className="block w-full px-4 py-3 text-right text-red-600 hover:bg-red-50"
                        >
                          🗑 حذف
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {post.mainCategory || post.category || "عام"}
                      </span>

                      {post.subCategory && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {post.subCategory}
                        </span>
                      )}
                    </div>

                    <h2 className="line-clamp-1 text-xl font-black text-slate-900">
                      {post.title || "بدون عنوان"}
                    </h2>

                    <p className="mt-2 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-500">
                      {post.description || post.desc || "لا يوجد وصف"}
                    </p>

                    <div className="mt-4">
                      <p className="text-3xl font-black text-green-600">
                        {formatPrice(post.price)}
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-400">
                        📍 {post.location || post.city || "غير محدد"}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-center text-xs font-bold text-slate-500">
                      <span>👁 {post.views || 0}</span>
                      <span>❤️ {post.favoriteCount || 0}</span>
                      <span>📅 {formatDate(post.createdAt)}</span>
                    </div>

                    <button
                      onClick={() => router.push(`/post/${post.id}`)}
                      className="mt-5 w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white hover:bg-green-600"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}