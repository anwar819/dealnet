"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PublicProfilePage() {
  const { userId } = useParams();
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState("");

  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, [userId]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`profile-status-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const init = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || "");

      await loadProfile();
    } catch (error) {
      console.error(error);
    }
  };

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
        .order("createdAt", {
          ascending: false,
        });

      setReviews(reviewData || []);

      const { data: postData } = await supabase
        .from("posts")
        .select("*")
        .eq("userId", userId)
        .eq("isHidden", false)
        .order("createdAt", {
          ascending: false,
        });

      setPosts(postData || []);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل البروفايل");
    } finally {
      setLoading(false);
    }
  };

  const startChat = async () => {
    if (!currentUserId) {
      router.push(`/login?redirect=/profile/${profile.id}`);
      return;
    }

    if (currentUserId === profile.id) {
      alert("هذا حسابك");
      return;
    }

    try {
      const sellerId = profile.id;
      const buyerId = currentUserId;

      const chatId =
        buyerId < sellerId
          ? `${buyerId}_${sellerId}`
          : `${sellerId}_${buyerId}`;

      const { data: currentProfile } = await supabase
        .from("users")
        .select("firstName,lastName")
        .eq("id", currentUserId)
        .single();

      const buyerName =
        `${currentProfile?.firstName || ""} ${
          currentProfile?.lastName || ""
        }`.trim() || "مستخدم";

      const sellerName =
        `${profile?.firstName || ""} ${
          profile?.lastName || ""
        }`.trim() || "مستخدم";

      await supabase.from("chats").upsert({
        chatId,
        users: [buyerId, sellerId],
        sellerId,
        buyerId,
        sellerName,
        buyerName,
        postTitle: "محادثة مباشرة",
        updatedAt: Date.now(),
      });

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error(error);
      alert("فشل إنشاء المحادثة");
    }
  };

  const ratingStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        count: 0,
      };
    }

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
      <span key={index}>
        {index < rounded ? "⭐" : "☆"}
      </span>
    ));
  };

  const getMainImage = (post: any) => {
    if (post.imageUrls?.length) return post.imageUrls[0];
    if (post.images?.length) return post.images[0];
    if (post.imageUrl) return post.imageUrl;
    return "";
  };

  const formatLastSeen = (value?: number) => {
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black">
                  {profile?.firstName || "مستخدم"}{" "}
                  {profile?.lastName || ""}
                </h1>

                {profile?.isOnline ? (
                  <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black text-white">
                    🟢 متصل الآن
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-black text-white">
                    ⚫ غير متصل
                  </span>
                )}
              </div>

              {!profile?.isOnline && profile?.lastSeen > 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  آخر ظهور: {formatLastSeen(profile?.lastSeen)}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                  📦 {posts.length} إعلان
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                  ⭐ {ratingStats.average.toFixed(1)} تقييم
                </span>

                {posts.length >= 5 &&
                  ratingStats.average >= 4 && (
                    <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-bold text-white">
                      ✔ بائع موثوق
                    </span>
                  )}

                {posts.length > 0 &&
                  posts.length < 5 && (
                    <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-bold text-white">
                      🆕 بائع جديد
                    </span>
                  )}
              </div>

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

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/marketplace")}
                className="rounded-xl bg-white/10 px-5 py-3 font-bold text-white hover:bg-white/20"
              >
                ← الرجوع للسوق
              </button>

              <button
                onClick={() =>
                  router.push(`/review/${profile.id}`)
                }
                className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
              >
                ⭐ تقييم المستخدم
              </button>

              <button
                onClick={startChat}
                className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white hover:bg-green-600"
              >
                💬 مراسلة المستخدم
              </button>
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
          <h2 className="mb-5 text-2xl font-black">
            ⭐ التقييمات
          </h2>

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
                        ? new Date(
                            review.createdAt
                          ).toLocaleDateString("ar-IQ")
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
          <h2 className="mb-5 text-2xl font-black">
            📦 إعلانات المستخدم
          </h2>

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
                    onClick={() =>
                      router.push(`/post/${post.id}`)
                    }
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
                        {post.price
                          ? `$${post.price}`
                          : "حسب الاتفاق"}
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