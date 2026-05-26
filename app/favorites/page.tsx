"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type PostType = {
  id: string;
  title?: string;
  desc?: string;
  description?: string;
  price?: string;
  location?: string;
  userName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
};

export default function FavoritesPage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    try {
      const { data: favorites, error: favError } = await supabase
        .from("favorites")
        .select("*")
        .eq("userId", user.id);

      if (favError) {
        console.error(favError);
        setLoading(false);
        return;
      }

      const postIds = favorites?.map((f) => f.postId) || [];

      if (postIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .in("id", postIds);

      if (postsError) {
        console.error(postsError);
        setLoading(false);
        return;
      }

      setPosts(postsData || []);
    } catch (error) {
      console.error("Favorites error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMainImage = (post: PostType) => {
    if (post.imageUrls?.length) return post.imageUrls[0];
    if (post.images?.length) return post.images[0];
    if (post.imageUrl) return post.imageUrl;
    return "";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل المفضلة...
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        يجب تسجيل الدخول لعرض المفضلة
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <p className="mb-3 text-sm text-green-400">DealNet</p>

          <h1 className="text-4xl font-black">المفضلة</h1>

          <p className="mt-3 text-slate-300">
            الإعلانات التي قمت بحفظها للرجوع إليها لاحقًا.
          </p>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = "/marketplace")}
            className="rounded-xl bg-white px-4 py-2 font-bold shadow hover:bg-slate-100"
          >
            ← الرجوع إلى السوق
          </button>

          <a
            href="/create-post"
            className="rounded-xl bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600"
          >
            + نشر إعلان
          </a>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow">
            لا توجد إعلانات محفوظة في المفضلة.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((post) => {
              const image = getMainImage(post);

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={post.title || "صورة الإعلان"}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400">
                      لا توجد صورة
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="line-clamp-1 text-lg font-bold">
                      {post.title || "بدون عنوان"}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {post.desc || post.description || "لا يوجد وصف"}
                    </p>

                    <p className="mt-3 font-bold text-green-600">
                      {post.price ? `$${post.price}` : "حسب الاتفاق"}
                    </p>

                    <a
                      href={`/post/${post.id}`}
                      className="mt-4 block rounded-xl bg-black py-3 text-center text-white hover:bg-green-600"
                    >
                      عرض التفاصيل
                    </a>
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