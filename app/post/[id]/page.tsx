"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PostDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState("");
  const [post, setPost] = useState<any>(null);
  const [sellerData, setSellerData] = useState<any>(null);

  const [images, setImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);

  const [sellerRating, setSellerRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [sellerPostsCount, setSellerPostsCount] = useState(0);

  const [favoriteId, setFavoriteId] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showLoginBox, setShowLoginBox] = useState(false);
  const [autoChatDone, setAutoChatDone] = useState(false);

  useEffect(() => {
    checkUser();
    loadPost();
  }, []);

  useEffect(() => {
    if (!post || !userId || autoChatDone) return;

    if (searchParams.get("action") === "chat") {
      startChat();
      setAutoChatDone(true);
    }
  }, [post, userId, autoChatDone, searchParams]);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id || "";
    setUserId(uid);

    if (uid && id) {
      const { data: fav } = await supabase
        .from("favorites")
        .select("*")
        .eq("userId", uid)
        .eq("postId", id)
        .maybeSingle();

      if (fav) {
        setFavoriteId(fav.id);
        setIsFavorite(true);
      }
    }
  };

  const getSellerFullName = () => {
    const name = `${sellerData?.firstName || ""} ${
      sellerData?.lastName || ""
    }`.trim();

    return name || post?.userName || "مستخدم";
  };

  const loadPost = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("الإعلان غير موجود");
        router.push("/marketplace");
        return;
      }

      setPost(data);

      const imgs =
        data.imageUrls || data.images || (data.imageUrl ? [data.imageUrl] : []);

      setImages(imgs || []);

      if (data.userId) {
        const { data: sellerInfo } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.userId)
          .maybeSingle();

        setSellerData(sellerInfo || null);

        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("rating")
          .eq("targetUserId", data.userId);

        if (reviewsData && reviewsData.length > 0) {
          const total = reviewsData.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0
          );

          setSellerRating(total / reviewsData.length);
          setReviewsCount(reviewsData.length);
        } else {
          setSellerRating(0);
          setReviewsCount(0);
        }

        const { count } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("userId", data.userId)
          .eq("isHidden", false);

        setSellerPostsCount(count || 0);
      }

      const { data: authData } = await supabase.auth.getUser();
      const currentUid = authData.user?.id || "";

      if (currentUid !== data.userId) {
        await supabase
          .from("posts")
          .update({
            views: (data.views || 0) + 1,
          })
          .eq("id", id);
      }
    } catch (error) {
      console.error(error);
      alert("فشل تحميل الإعلان");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!userId) {
      setShowLoginBox(true);
      return;
    }

    if (!post?.id) return;

    if (isFavorite && favoriteId) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) {
        console.error(error);
        alert("فشل حذف الإعلان من المفضلة");
        return;
      }

      setIsFavorite(false);
      setFavoriteId("");
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .insert([
        {
          userId,
          postId: post.id,
          createdAt: Date.now(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error(error);
      alert("فشل إضافة الإعلان للمفضلة");
      return;
    }

    setFavoriteId(data.id);
    setIsFavorite(true);
  };

  const openWhatsApp = () => {
    if (!userId) {
      setShowLoginBox(true);
      return;
    }

    if (!post?.phone) {
      alert("لا يوجد رقم هاتف لصاحب الإعلان");
      return;
    }

    let cleanPhone = String(post.phone).replace(/\D/g, "");

    if (cleanPhone.startsWith("0")) {
      cleanPhone = "964" + cleanPhone.slice(1);
    }

    if (!cleanPhone.startsWith("964")) {
      cleanPhone = "964" + cleanPhone;
    }

    const message = encodeURIComponent(
      `مرحبا، أنا مهتم بالإعلان: ${post.title || "إعلان"}`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const startChat = async () => {
    if (!userId) {
      setShowLoginBox(true);
      return;
    }

    if (!post?.userId) {
      alert("لا يمكن بدء المحادثة");
      return;
    }

    if (userId === post.userId) {
      alert("لا يمكنك مراسلة نفسك");
      return;
    }

    const sellerId = post.userId;
    const chatId =
      userId < sellerId ? `${userId}_${sellerId}` : `${sellerId}_${userId}`;

    const { data: currentProfile } = await supabase
      .from("users")
      .select("firstName,lastName")
      .eq("id", userId)
      .maybeSingle();

    const buyerName =
      `${currentProfile?.firstName || ""} ${
        currentProfile?.lastName || ""
      }`.trim() || "مستخدم";

    const sellerName = getSellerFullName();

    const { error } = await supabase.from("chats").upsert({
      chatId,
      users: [userId, sellerId],
      postId: post.id,
      postTitle: post.title || "إعلان",
      sellerId,
      buyerId: userId,
      sellerName,
      buyerName,
      lastMessage: "",
      updatedAt: Date.now(),
    });

    if (error) {
      console.error(error);
      alert("فشل إنشاء المحادثة");
      return;
    }

    router.push(`/chat/${chatId}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ رابط الإعلان");
    } catch {
      alert("تعذر نسخ الرابط");
    }
  };

  const getTypeLabel = (type?: string) => {
    if (type === "sell") return "بيع";
    if (type === "buy") return "طلب شراء";
    if (type === "service") return "خدمة";
    if (type === "request") return "طلب خدمة";
    if (type === "partnership") return "شراكة";
    return "إعلان";
  };

  const formatDate = (value?: number) => {
    if (!value) return "غير معروف";
    return new Date(value).toLocaleDateString("ar-IQ");
  };

  const isBoosted =
    post?.isBoosted && post?.boostExpiresAt && post.boostExpiresAt > Date.now();

  const mainImage = images[activeImage];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري التحميل...
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        لا يوجد إعلان
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
       <section className="rounded-[2rem] bg-slate-950 p-4 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-black text-green-400">
                تفاصيل الإعلان
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                {post.title || "بدون عنوان"}
              </h1>

              <p className="mt-3 text-slate-300">
                {getTypeLabel(post.type)} — {post.location || "غير محدد"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {isBoosted && (
                  <span className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white">
                    🔥 إعلان مروّج
                  </span>
                )}

                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
                  👁 {post.views || 0} مشاهدة
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
                  📅 {formatDate(post.createdAt)}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/marketplace")}
              className="rounded-2xl bg-white/10 px-5 py-3 font-bold text-white hover:bg-white/20"
            >
              الرجوع للسوق
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-[2rem] bg-white p-4 shadow">
              <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-3xl bg-slate-200">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={post.title || "صورة الإعلان"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="text-slate-400">لا توجد صورة</p>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`h-24 w-28 shrink-0 overflow-hidden rounded-2xl border ${
                        activeImage === index
                          ? "border-green-500 ring-2 ring-green-200"
                          : "border-slate-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`صورة ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] bg-white p-6 shadow">
              <p className="text-5xl font-black text-green-600">
  {post.price
    ? `${Number(post.price).toLocaleString("en-US")} د.ع`
    : "حسب الاتفاق"}
</p>

              {post.phone && (
                <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-center font-bold text-slate-700">
                  📞 {post.phone}
                </div>
              )}

              <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                <button
                  onClick={() => router.push(`/profile/${post.userId}`)}
                  className="flex w-full items-center gap-3 text-right"
                >
                  {sellerData?.avatar ? (
                    <img
                      src={sellerData.avatar}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-black text-white">
                      {getSellerFullName().charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-black text-slate-900 hover:text-green-600">
                        {getSellerFullName()}
                      </p>

                      {sellerData?.isVerified && (
                        <span className="rounded-full bg-blue-500 px-2 py-1 text-xs font-black text-white">
                          ✔ موثق
                        </span>
                      )}

                      {sellerData?.isOnline && (
                        <span className="rounded-full bg-green-500 px-2 py-1 text-xs font-black text-white">
                          🟢 متصل
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs font-bold text-slate-400">
                      عرض الملف الشخصي
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-black text-yellow-500">
                        ⭐ {sellerRating ? sellerRating.toFixed(1) : "0.0"}
                      </span>

                      <span className="text-sm text-slate-500">
                        ({reviewsCount} تقييم)
                      </span>

                      <span className="text-sm text-slate-500">
                        📦 {sellerPostsCount} إعلان
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  onClick={openWhatsApp}
                  className="w-full rounded-2xl bg-green-500 py-4 font-bold text-white hover:bg-green-600"
                >
                  تواصل واتساب
                </button>

                <button
                  onClick={startChat}
                  className="w-full rounded-2xl bg-blue-500 py-4 font-bold text-white hover:bg-blue-600"
                >
                  مراسلة داخل الموقع
                </button>

                <button
                  onClick={toggleFavorite}
                  className={`w-full rounded-2xl py-4 font-bold text-white ${
                    isFavorite
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {isFavorite ? "❤️ محفوظ في المفضلة" : "♡ إضافة للمفضلة"}
                </button>

              
              </div>
            </div>
<div className="rounded-[2rem] bg-white p-6 shadow">
  <div className="grid gap-3">
    <button
      onClick={copyLink}
      className="w-full rounded-2xl bg-slate-700 py-4 font-bold text-white"
    >
      🔗 نسخ رابط الإعلان
    </button>

    <button
      onClick={() => router.push(`/report/${post.id}`)}
      className="w-full rounded-2xl bg-red-500 py-4 font-bold text-white"
    >
      🚨 إبلاغ عن الإعلان
    </button>
  </div>
</div>
{userId === post.userId && (
  <div className="rounded-[2rem] bg-white p-5 shadow">
    <h3 className="mb-4 text-lg font-black text-slate-900">
      إدارة إعلانك
    </h3>

    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => router.push(`/edit/${post.id}`)}
        className="rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800"
      >
        ✏️ تعديل
      </button>

      <button
        onClick={() => router.push(`/boost/${post.id}`)}
        className="rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600"
      >
        🔥 ترويج
      </button>
    </div>
  </div>
)}
          </aside>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-black">الوصف</h2>

          <p className="whitespace-pre-line leading-8 text-slate-700">
            {post.description || post.desc || "لا يوجد وصف"}
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-black">معلومات الإعلان</h2>

          <div className="grid gap-3 text-slate-700 md:grid-cols-2">
            <p>
              <b>النوع:</b> {getTypeLabel(post.type)}
            </p>

            <p>
              <b>القسم:</b> {post.mainCategory || post.category || "غير محدد"}
            </p>

            <p>
              <b>القسم الفرعي:</b> {post.subCategory || "غير محدد"}
            </p>

            <p>
              <b>الموقع:</b> {post.location || "غير محدد"}
            </p>

            <p>
              <b>تاريخ النشر:</b> {formatDate(post.createdAt)}
            </p>

            <p>
              <b>آخر تحديث:</b> {formatDate(post.updatedAt)}
            </p>
          </div>
        </section>
      </div>

      {showLoginBox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900">
              تسجيل الدخول مطلوب
            </h2>

            <p className="mt-3 text-slate-600">
              للتواصل مع صاحب الإعلان يجب تسجيل الدخول أو إنشاء حساب جديد.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                onClick={() =>
                  router.push(`/login?redirect=/post/${post.id}&action=chat`)
                }
                className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600"
              >
                تسجيل الدخول
              </button>

              <button
                onClick={() =>
                  router.push(`/register?redirect=/post/${post.id}&action=chat`)
                }
                className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800"
              >
                إنشاء حساب
              </button>

              <button
                onClick={() => setShowLoginBox(false)}
                className="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}