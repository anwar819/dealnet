"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AccountPage() {
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.push("/login?redirect=/account");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        const firstName =
          user.user_metadata?.firstName ||
          user.user_metadata?.first_name ||
          "مستخدم";

        const lastName =
          user.user_metadata?.lastName ||
          user.user_metadata?.last_name ||
          "";

        const phone = user.user_metadata?.phone || "";

        const { data: newProfile, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: user.id,
              firstName,
              lastName,
              phone,
              email: user.email,
              isAdmin: false,
              isBlocked: false,
              isVerified: false,
              rating: 0,
              totalSales: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ])
          .select("*")
          .single();

        if (insertError) {
          console.error(insertError);

          setUserData({
            id: user.id,
            firstName,
            lastName,
            phone,
            email: user.email,
            isAdmin: false,
            isBlocked: false,
            isVerified: false,
            createdAt: Date.now(),
          });

          await loadReviews(user.id);
        } else {
          setUserData(newProfile);
          await loadReviews(user.id);
        }
      } else {
        setUserData(profile);
        await loadReviews(user.id);
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل الحساب");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (targetUserId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("targetUserId", targetUserId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error(error);
      setReviews([]);
      return;
    }

    setReviews(data || []);
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
      <span key={index}>{index < rounded ? "⭐" : "☆"}</span>
    ));
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

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black">
                {userData?.firstName || "مستخدم"} {userData?.lastName || ""}
              </h1>

              <p className="mt-2 text-slate-300">{userData?.email}</p>

              <p className="mt-1 text-slate-300">
                الهاتف: {userData?.phone || "غير مضاف"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {userData?.isVerified && (
                  <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-bold text-white">
                    ⭐ حساب موثق
                  </span>
                )}

                {userData?.isAdmin && (
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

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/create-post")}
              className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white"
            >
              + نشر إعلان
            </button>

            <button
              onClick={() => router.push("/account/edit")}
              className="rounded-xl bg-white px-5 py-3 font-bold text-slate-900"
            >
              تعديل الحساب
            </button>

            <button
              onClick={logout}
              className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white"
            >
              تسجيل خروج
            </button>
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
              {userData?.totalSales || 0}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              عمليات البيع
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-5 text-2xl font-black">⭐ تقييمات الحساب</h2>

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
      </div>
    </main>
  );
}