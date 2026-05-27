"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PublicProfilePage() {
  const { userId } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (!userData) {
        alert("المستخدم غير موجود");
        router.push("/marketplace");
        return;
      }

      setProfile(userData);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("targetUserId", userId)
        .order("createdAt", { ascending: false });

      setReviews(reviewData || []);

      const { data: postData } = await supabase
        .from("posts")
        .select("*")
        .eq("userId", userId)
        .eq("isHidden", false)
        .order("createdAt", { ascending: false });

      setPosts(postData || []);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل البروفايل");
    } finally {
      setLoading(false);
    }
  };

  const ratingStats = useMemo(() => {
    if (reviews.length === 0) return { average: 0, count: 0 };

    const total = reviews.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );

    return {
      average: total / reviews.length,
      count: reviews.length,
    };
  }, [reviews]);

  const renderStars = (value: number) => {
    const rounded = Math.round(value);

    return Array.from({ length: 5 }).map((_, index) => (
      <span key={index}>{index < rounded ? "⭐" : "☆"}</span>
    ));
  };

  const getMainImage = (post: any) => {
    if (post.imageUrls?.length) return post.imageUrls[0];
    if (post.images?.length) return post.images[0];
    if (post.imageUrl) return post.imageUrl;
    return "";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل البروفايل...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black">
                {profile?.firstName || "مستخدم"} {profile?.lastName || ""}
              </h1>

              <p className="mt-2 text-slate-300">
                {profile?.email || ""}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {profile?.isVerified && (
                  <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-bold text-white">
                    ✔ حساب موثق
                  </span>
                )}

                {profile?.isAdmin && (
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
                    ⚡ مدير النظام
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 text-center">
              <div className="text-3xl font-black">
                {ratingStats.average.toFixed(1)}
              </div>

              <div className="mt-1 text-lg">
                {renderStars(ratingStats.average)}
              </div>

              <div className="mt-1 text-sm text-slate-300">
                {ratingStats.count} تقييم
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-green-600">
              {ratingStats.average.toFixed(1)}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              متوسط التقييم
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-blue-600">
              {ratingStats.count}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              عدد التقييمات
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-slate-900">
              {posts.length}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              الإعلانات النشطة
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-5 text-2xl font-black">⭐ التقييمات</h2>

          {reviews.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              لا توجد تقييمات بعد.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg">
                      {renderStars(review.rating)}
                    </div>

                    <span className="text-xs text-slate-400">
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString("ar-IQ")
                        : ""}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="mt-3 leading-7 text-slate-700">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-5 text-2xl font-black">📦 إعلانات المستخدم</h2>

          {posts.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              لا توجد إعلانات نشطة.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {posts.map((post) => {
                const image = getMainImage(post);

                return (
                  <button
                    key={post.id}
                    onClick={() => router.push(`/post/${post.id}`)}
                    className="overflow-hidden rounded-2xl bg-slate-50 text-right shadow-sm transition hover:-translate-y-1 hover:shadow"
                  >
                    <div className="h-40 bg-slate-200">
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
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-1 font-black text-slate-900">
                        {post.title || "بدون عنوان"}
                      </h3>

                      <p className="mt-2 font-bold text-green-600">
                        {post.price ? `$${post.price}` : "حسب الاتفاق"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        📍 {post.location || "غير محدد"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}