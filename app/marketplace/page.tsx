"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type PostType = {
  id: string;
  title?: string;
  desc?: string;
  description?: string;
  price?: string;
  location?: string;
  city?: string;
  userId?: string;
  userName?: string;
  type?: string;
  category?: string;
  mainCategory?: string;
  subCategory?: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
  createdAt?: number;
  views?: number;
  favoriteCount?: number;
  isFeatured?: boolean;
  isBoosted?: boolean;
  boostedAt?: number | null;
  boostExpiresAt?: number | null;
  isHidden?: boolean;
  seller?: any;
  sellerRating?: number;
  sellerReviews?: number;
};

type FavoriteType = {
  id: string;
  postId: string;
};

const categories: Record<string, string[]> = {
  إلكترونيات: ["موبايلات", "لابتوبات", "شاشات", "كاميرات", "ألعاب إلكترونية"],
  "كهربائيات منزلية": ["مكيفات", "ثلاجات", "غسالات", "أفران", "سخانات"],
  سيارات: ["سيارات للبيع", "سيارات للإيجار", "قطع غيار", "إكسسوارات سيارات"],
  عقارات: ["شقق", "منازل", "أراضي", "محلات", "مكاتب"],
  "أجهزة طبية": ["أجهزة فحص", "معدات عيادات", "أجهزة مختبرات", "مستلزمات طبية"],
  خدمات: ["تصليح", "نقل", "تنظيف", "تصميم", "برمجة"],
  أخرى: ["متفرقات"],
};

export default function MarketplacePage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [favorites, setFavorites] = useState<FavoriteType[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] = useState("الكل");
  const [selectedSubCategory, setSelectedSubCategory] = useState("الكل");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("smart");

  useEffect(() => {
    loadPosts();
    loadCurrentUserAndFavorites();
  }, []);

  const getSellerFullName = (post: PostType) => {
    if (post.seller) {
      const fullName = `${post.seller.firstName || ""} ${
        post.seller.lastName || ""
      }`.trim();

      if (fullName) return fullName;
    }

    return post.userName || "مستخدم";
  };

  const loadPosts = async () => {
    try {
      setLoading(true);

      const now = Date.now();

      await supabase
        .from("posts")
        .update({
          isBoosted: false,
          boostExpiresAt: null,
        })
        .eq("isBoosted", true)
        .lt("boostExpiresAt", now);

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("isHidden", false)
        .order("createdAt", { ascending: false });

      if (postsError) {
        console.error("Error loading posts:", postsError);
        setPosts([]);
        return;
      }

      const { data: favData, error: favError } = await supabase
        .from("favorites")
        .select("postId");

      const favoriteCounts: Record<string, number> = {};

      if (!favError && favData) {
        favData.forEach((fav: any) => {
          favoriteCounts[fav.postId] = (favoriteCounts[fav.postId] || 0) + 1;
        });
      }

      const userIds = [
        ...new Set((postsData || []).map((p: any) => p.userId).filter(Boolean)),
      ];

      const { data: usersData } =
        userIds.length > 0
          ? await supabase.from("users").select("*").in("id", userIds)
          : { data: [] as any[] };

      const { data: reviewsData } = await supabase.from("reviews").select("*");

      const postsWithCounts = (postsData || []).map((post: any) => {
        const seller = usersData?.find((u: any) => u.id === post.userId);

        const sellerReviews = (reviewsData || []).filter(
          (r: any) => r.targetUserId === post.userId
        );

        const avgRating =
          sellerReviews.length > 0
            ? sellerReviews.reduce(
                (sum: number, r: any) => sum + Number(r.rating || 0),
                0
              ) / sellerReviews.length
            : 0;

        return {
          ...post,
          seller,
          sellerRating: avgRating,
          sellerReviews: sellerReviews.length,
          favoriteCount: favoriteCounts[post.id] || 0,
        };
      });

      setPosts(postsWithCounts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserAndFavorites = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId("");
      setFavorites([]);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("userId", user.id);

    if (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
      return;
    }

    setFavorites(data || []);
  };

  const isActiveBoost = (post: PostType) => {
    return (
      !!post.isBoosted &&
      !!post.boostExpiresAt &&
      post.boostExpiresAt > Date.now()
    );
  };

  const getMainImage = (post: PostType) => {
    if (post.imageUrls?.length) return post.imageUrls[0];
    if (post.images?.length) return post.images[0];
    if (post.imageUrl) return post.imageUrl;
    return "";
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case "sell":
        return "بيع";
      case "buy":
        return "طلب شراء";
      case "service":
        return "خدمة";
      case "request":
        return "طلب خدمة";
      case "partnership":
        return "شراكة";
      default:
        return "إعلان";
    }
  };

  const getPriceNumber = (price?: string) => {
    if (!price) return 0;
    const clean = price.replace(/[^\d.]/g, "");
    return Number(clean) || 0;
  };

  const isFavorite = (postId: string) => {
    return favorites.some((fav) => fav.postId === postId);
  };

  const toggleFavorite = async (postId: string) => {
    if (!userId) {
      alert("يجب تسجيل الدخول أولاً لحفظ الإعلان");
      window.location.href = "/login?redirect=/marketplace";
      return;
    }

    const existing = favorites.find((fav) => fav.postId === postId);

    if (existing) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error(error);
        alert("فشل حذف الإعلان من المفضلة");
        return;
      }

      setFavorites((prev) => prev.filter((fav) => fav.id !== existing.id));

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                favoriteCount: Math.max((post.favoriteCount || 0) - 1, 0),
              }
            : post
        )
      );
    } else {
      const { data, error } = await supabase
        .from("favorites")
        .insert([
          {
            userId,
            postId,
            createdAt: Date.now(),
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error(error);
        alert("فشل إضافة الإعلان إلى المفضلة");
        return;
      }

      setFavorites((prev) => [...prev, { id: data.id, postId }]);

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, favoriteCount: (post.favoriteCount || 0) + 1 }
            : post
        )
      );
    }
  };

  const selectMainCategory = (cat: string) => {
    setSelectedMainCategory(cat);
    setSelectedSubCategory("الكل");

    if (cat === "الكل") {
      setOpenCategory(null);
      return;
    }

    setOpenCategory(openCategory === cat ? null : cat);
  };

  const selectSubCategory = (main: string, sub: string) => {
    setSelectedMainCategory(main);
    setSelectedSubCategory(sub);
    setOpenCategory(main);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedMainCategory("الكل");
    setSelectedSubCategory("الكل");
    setOpenCategory(null);
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("smart");
  };

  const filteredPosts = useMemo(() => {
    let result = posts.filter((post) => {
      if (post.isHidden) return false;

      const postMain = post.mainCategory || post.category || "";
      const postSub = post.subCategory || "";
      const postCity = post.location || post.city || "";
      const priceNum = getPriceNumber(post.price);

      const sellerName = getSellerFullName(post);

      const text = `${post.title || ""} ${post.desc || ""} ${
        post.description || ""
      } ${postCity} ${postMain} ${postSub} ${sellerName}`.toLowerCase();

      const matchesSearch = text.includes(search.trim().toLowerCase());
      const matchesMain =
        selectedMainCategory === "الكل" || postMain === selectedMainCategory;
      const matchesSub =
        selectedSubCategory === "الكل" || postSub === selectedSubCategory;
      const matchesCity =
        !city.trim() ||
        postCity.toLowerCase().includes(city.trim().toLowerCase());
      const matchesMin = !minPrice || priceNum >= Number(minPrice);
      const matchesMax = !maxPrice || priceNum <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesMain &&
        matchesSub &&
        matchesCity &&
        matchesMin &&
        matchesMax
      );
    });

    result = [...result].sort((a, b) => {
      const aBoosted = isActiveBoost(a);
      const bBoosted = isActiveBoost(b);

      if (aBoosted && !bBoosted) return -1;
      if (!aBoosted && bBoosted) return 1;

      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      if (a.seller?.isVerified && !b.seller?.isVerified) return -1;
      if (!a.seller?.isVerified && b.seller?.isVerified) return 1;

      if ((b.sellerRating || 0) !== (a.sellerRating || 0)) {
        return (b.sellerRating || 0) - (a.sellerRating || 0);
      }

      if (sortBy === "low")
        return getPriceNumber(a.price) - getPriceNumber(b.price);
      if (sortBy === "high")
        return getPriceNumber(b.price) - getPriceNumber(a.price);
      if (sortBy === "views") return (b.views || 0) - (a.views || 0);
      if (sortBy === "favorites")
        return (b.favoriteCount || 0) - (a.favoriteCount || 0);

      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return result;
  }, [
    posts,
    search,
    selectedMainCategory,
    selectedSubCategory,
    city,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 p-7 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-black text-green-400">
                DealNet Marketplace
              </p>

              <h1 className="text-4xl font-black">
                السوق
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                الإعلانات المروّجة والموثقة تظهر أولًا لزيادة الثقة وفرص البيع.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/messages"
                className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20"
              >
                📩 الرسائل
              </a>

              <a
                href="/favorites"
                className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20"
              >
                ❤️ المفضلة
              </a>

              <a
                href="/create-post"
                className="rounded-xl bg-green-500 px-4 py-3 text-sm font-bold hover:bg-green-600"
              >
                + نشر إعلان
              </a>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] bg-white p-5 shadow">
          <div className="grid gap-3 md:grid-cols-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج، خدمة، مدينة، بائع..."
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500 md:col-span-2"
            />

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="المدينة"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500"
            />

            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="السعر من"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500"
            />

            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="السعر إلى"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500"
            >
              <option value="smart">الأفضل أولًا</option>
              <option value="newest">الأحدث</option>
              <option value="low">الأرخص</option>
              <option value="high">الأغلى</option>
              <option value="views">الأكثر مشاهدة</option>
              <option value="favorites">الأكثر حفظًا</option>
            </select>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => selectMainCategory("الكل")}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  selectedMainCategory === "الكل"
                    ? "bg-green-500 text-white"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                }`}
              >
                الكل
              </button>

              {Object.keys(categories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => selectMainCategory(cat)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${
                    selectedMainCategory === cat
                      ? "bg-green-500 text-white"
                      : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                  }`}
                >
                  {cat} {openCategory === cat ? "▲" : "▼"}
                </button>
              ))}
            </div>

            {openCategory && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-black text-slate-900">
                    فروع {openCategory}
                  </p>

                  <button
                    onClick={() => setOpenCategory(null)}
                    className="text-sm font-bold text-slate-500 hover:text-slate-900"
                  >
                    إغلاق
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => selectSubCategory(openCategory, "الكل")}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      selectedSubCategory === "الكل" &&
                      selectedMainCategory === openCategory
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    كل {openCategory}
                  </button>

                  {categories[openCategory].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => selectSubCategory(openCategory, sub)}
                      className={`rounded-full px-4 py-2 text-sm font-bold ${
                        selectedSubCategory === sub &&
                        selectedMainCategory === openCategory
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              الإعلانات المتاحة
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              العدد: {filteredPosts.length}
            </p>
          </div>

          <button
            onClick={resetFilters}
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow hover:bg-slate-50"
          >
            تصفير الفلاتر
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[430px] animate-pulse rounded-[2rem] bg-white shadow"
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-12 text-center shadow">
            <p className="text-lg font-bold text-slate-800">
              لا توجد نتائج مطابقة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredPosts.map((post) => {
              const mainImage = getMainImage(post);
              const fav = isFavorite(post.id);
              const postMain = post.mainCategory || post.category || "عام";
              const postSub = post.subCategory || "";
              const boosted = isActiveBoost(post);
              const sellerFullName = getSellerFullName(post);

              return (
                <article
                  key={post.id}
                  className={`group overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    boosted
                      ? "border-orange-400 ring-2 ring-orange-200"
                      : post.isFeatured
                      ? "border-yellow-400 ring-2 ring-yellow-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="relative h-56 overflow-hidden bg-slate-200">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={post.title || "صورة الإعلان"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        لا توجد صورة
                      </div>
                    )}

                    <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                      {getTypeLabel(post.type)}
                    </span>

                    {boosted && (
                      <span className="absolute bottom-3 left-3 z-10 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        🔥 مروّج
                      </span>
                    )}

                    {!boosted && post.isFeatured && (
                      <span className="absolute bottom-3 left-3 z-10 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black shadow-lg">
                        ✨ مميز
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(post.id);
                      }}
                      className={`absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow ${
                        fav
                          ? "bg-red-500 text-white"
                          : "bg-white text-slate-700 hover:bg-red-50"
                      }`}
                    >
                      ♥
                    </button>
                  </div>

                  <div className="p-5">
                    <button
                      onClick={() => {
                        if (post.userId) {
                          window.location.href = `/profile/${post.userId}`;
                        }
                      }}
                      className="mb-4 flex min-w-0 items-center gap-2 text-right"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                        {sellerFullName.charAt(0)}
                      </div>

                      <div className="min-w-0 text-right">
                        <div className="flex items-center gap-1">
                          <p className="truncate text-sm font-black text-slate-900">
                            {sellerFullName}
                          </p>

                          {post?.seller?.isVerified && (
                            <span className="rounded-full bg-blue-500 px-2 py-[2px] text-[10px] font-black text-white">
                              ✔
                            </span>
                          )}

                          {post?.seller?.isOnline && (
                            <span className="text-green-500">🟢</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span>
                            ⭐ {Number(post?.sellerRating || 0).toFixed(1)}
                          </span>

                          <span>
                            ({post?.sellerReviews || 0})
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {postMain}
                      </span>

                      {postSub && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {postSub}
                        </span>
                      )}
                    </div>

                    <h3 className="line-clamp-1 text-lg font-black text-slate-900">
                      {post.title || "بدون عنوان"}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-500">
                      {post.desc || post.description || "لا يوجد وصف"}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="truncate text-xl font-black text-green-600">
{post.price
  ? `${Number(String(post.price).replace(/[^\d.]/g, "")).toLocaleString("en-US")} د.ع`
  : "حسب الاتفاق"}                      </p>

                      <p className="truncate text-xs font-bold text-slate-400">
                        📍 {post.location || post.city || "غير محدد"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                      <span>❤️ {post.favoriteCount || 0}</span>
                      <span>👁 {post.views || 0}</span>
                    </div>

                    <a
                      href={`/post/${post.id}`}
                      className={`mt-5 block rounded-xl py-3 text-center text-sm font-bold text-white transition ${
                        boosted
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-slate-950 hover:bg-green-600"
                      }`}
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