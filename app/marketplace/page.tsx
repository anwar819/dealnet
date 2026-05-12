"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

type PostType = {
  id: string;
  title?: string;
  desc?: string;
  description?: string;
  price?: string;
  location?: string;
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
    async function loadPosts() {
      try {
        const snap = await getDocs(collection(db, "posts"));
        const now = Date.now();

for (const docSnap of snap.docs) {
  const data = docSnap.data();

  if (
    data.isBoosted &&
    data.boostExpiresAt &&
    data.boostExpiresAt < now
  ) {
    // ⛔ انتهى الترويج
    await updateDoc(doc(db, "posts", docSnap.id), {
      isBoosted: false,
      boostExpiresAt: null,
    });
  }
}
        const data: PostType[] = snap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as any),
        }));
        
        const favSnap = await getDocs(collection(db, "favorites"));
        const favoriteCounts: Record<string, number> = {};

        favSnap.docs.forEach((fav) => {
          const postId = fav.data().postId;
          favoriteCounts[postId] = (favoriteCounts[postId] || 0) + 1;
        });

        const postsWithCounts = data.map((post) => ({
          ...post,
          favoriteCount: favoriteCounts[post.id] || 0,
        }));

        setPosts(postsWithCounts);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserId("");
        setFavorites([]);
        return;
      }

      setUserId(user.uid);

      const q = query(
        collection(db, "favorites"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const favs: FavoriteType[] = snap.docs.map((item) => ({
        id: item.id,
        postId: item.data().postId,
      }));

      setFavorites(favs);
    });

    return () => unsub();
  }, []);

  const isActiveBoost = (post: PostType) => {
    return !!post.isBoosted && !!post.boostExpiresAt && post.boostExpiresAt > Date.now();
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
      window.location.href = "/login";
      return;
    }

    const existing = favorites.find((fav) => fav.postId === postId);

    if (existing) {
      await deleteDoc(doc(db, "favorites", existing.id));

      setFavorites((prev) => prev.filter((fav) => fav.id !== existing.id));

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, favoriteCount: Math.max((post.favoriteCount || 0) - 1, 0) }
            : post
        )
      );
    } else {
      const created = await addDoc(collection(db, "favorites"), {
        userId,
        postId,
        createdAt: Date.now(),
      });

      setFavorites((prev) => [...prev, { id: created.id, postId }]);

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
      const priceNum = getPriceNumber(post.price);

      const text = `${post.title || ""} ${post.desc || ""} ${
        post.description || ""
      } ${post.location || ""} ${postMain} ${postSub}`.toLowerCase();

      const matchesSearch = text.includes(search.trim().toLowerCase());
      const matchesMain =
        selectedMainCategory === "الكل" || postMain === selectedMainCategory;
      const matchesSub =
        selectedSubCategory === "الكل" || postSub === selectedSubCategory;
      const matchesCity =
        !city.trim() ||
        (post.location || "").toLowerCase().includes(city.trim().toLowerCase());
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
  const now = Date.now();

  const aBoosted =
    a.isBoosted === true &&
    a.boostExpiresAt &&
    a.boostExpiresAt > now;

  const bBoosted =
    b.isBoosted === true &&
    b.boostExpiresAt &&
    b.boostExpiresAt > now;

  // 🔥 الإعلانات المروّجة أولاً
  if (aBoosted && !bBoosted) return -1;
  if (!aBoosted && bBoosted) return 1;

  // ✨ الإعلانات المميزة بعدها
  if (a.isFeatured && !b.isFeatured) return -1;
  if (!a.isFeatured && b.isFeatured) return 1;

  // باقي الترتيب
  if (sortBy === "low") {
    return getPriceNumber(a.price) - getPriceNumber(b.price);
  }

  if (sortBy === "high") {
    return getPriceNumber(b.price) - getPriceNumber(a.price);
  }

  if (sortBy === "views") {
    return (b.views || 0) - (a.views || 0);
  }

  if (sortBy === "favorites") {
    return (b.favoriteCount || 0) - (a.favoriteCount || 0);
  }

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
    <main className="min-h-screen bg-slate-100 px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 p-7 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold text-green-400">
                DealNet Marketplace
              </p>
              <h1 className="text-4xl font-black">السوق</h1>
              <p className="mt-3 text-slate-300">
                الإعلانات المروّجة تظهر أولًا لزيادة فرص البيع.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/messages" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20">
                📩 الرسائل
              </a>

              <a href="/favorites" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20">
                ❤️ المفضلة
              </a>

              <a href="/create-post" className="rounded-xl bg-green-500 px-4 py-3 text-sm font-bold hover:bg-green-600">
                + نشر إعلان
              </a>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow">
          <div className="grid gap-3 md:grid-cols-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج، خدمة، مدينة..."
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
          <div className="rounded-3xl bg-white p-12 text-center text-slate-500 shadow">
            جاري تحميل الإعلانات...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow">
            <p className="text-lg font-bold text-slate-800">
              لا توجد نتائج مطابقة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPosts.map((post) => {
              const mainImage = getMainImage(post);
              const fav = isFavorite(post.id);
              const postMain = post.mainCategory || post.category || "عام";
              const postSub = post.subCategory || "";
              const boosted = isActiveBoost(post);

              return (
                <article
                  key={post.id}
                  className={`group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    boosted
                      ? "border-orange-400 ring-2 ring-orange-200"
                      : post.isFeatured
                      ? "border-yellow-400 ring-2 ring-yellow-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="relative h-52 overflow-hidden bg-slate-200">
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

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {post.desc || post.description || "لا يوجد وصف"}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xl font-black text-green-600">
                        {post.price ? `$${post.price}` : "حسب الاتفاق"}
                      </p>

                      <p className="text-xs font-bold text-slate-400">
                        📍 {post.location || "غير محدد"}
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