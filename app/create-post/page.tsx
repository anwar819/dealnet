"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { createNotification } from "../../lib/notifications";

const categories: Record<string, string[]> = {
  إلكترونيات: ["موبايلات", "لابتوبات", "شاشات", "كاميرات", "ألعاب إلكترونية"],
  "كهربائيات منزلية": ["مكيفات", "ثلاجات", "غسالات", "أفران", "سخانات"],
  سيارات: ["سيارات للبيع", "سيارات للإيجار", "قطع غيار", "إكسسوارات سيارات"],
  عقارات: ["شقق", "منازل", "أراضي", "محلات", "مكاتب"],
  "أجهزة طبية": ["أجهزة فحص", "معدات عيادات", "أجهزة مختبرات", "مستلزمات طبية"],
  خدمات: ["تصليح", "نقل", "تنظيف", "تصميم", "برمجة"],
  أخرى: ["متفرقات"],
};

export default function CreatePostPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [type, setType] = useState("sell");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [country, setCountry] = useState("IQ");
const [currency, setCurrency] = useState("IQD");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const [aiInput, setAiInput] = useState("");
  const [aiStep, setAiStep] = useState<"start" | "generated" | "analyzed" | "checked">("start");

  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingFraud, setLoadingFraud] = useState(false);
  const [loading, setLoading] = useState(false);

  const [analysis, setAnalysis] = useState<any>(null);
  const [fraudCheck, setFraudCheck] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const progress = useMemo(() => {
    let value = 0;
    if (mainCategory) value += 15;
    if (subCategory) value += 15;
    if (title.trim().length >= 5) value += 15;
    if (desc.trim().length >= 20) value += 20;
    if (location.trim()) value += 10;
    if (images.length > 0) value += 15;
    if (analysis) value += 5;
    if (fraudCheck) value += 5;
    return Math.min(value, 100);
  }, [mainCategory, subCategory, title, desc, location, images, analysis, fraudCheck]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/create-post");
      return;
    }

    setCurrentUser(user);

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data?.isBlocked) {
      alert("🚫 تم حظر حسابك");
      router.push("/");
      return;
    }

    setProfile(data);
  };

  const resetChecks = () => {
    setAnalysis(null);
    setFraudCheck(null);
    setAiStep(title || desc ? "generated" : "start");
  };

  const handleImages = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImages(Array.from(files).slice(0, 8));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const generateWithAI = async () => {
    if (aiInput.trim().length < 3) return alert("اكتب فكرة الإعلان أولاً");

    try {
      setLoadingAI(true);

      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInput }),
      });

      const data = await res.json();

      setTitle(data.title || "");
      setDesc(data.description || "");
      setPrice(data.priceSuggestion || "");

      if (data.mainCategory && categories[data.mainCategory]) {
        setMainCategory(data.mainCategory);
        setSubCategory(
          categories[data.mainCategory].includes(data.subCategory)
            ? data.subCategory
            : ""
        );
      }

      setAnalysis(null);
      setFraudCheck(null);
      setAiStep("generated");
    } catch (error) {
      console.error(error);
      alert("فشل توليد الإعلان");
    } finally {
      setLoadingAI(false);
    }
  };

  const analyzePost = async () => {
    if (!title || !desc) return alert("اكتب العنوان والوصف أولاً");

    try {
      setLoadingAnalysis(true);

      const res = await fetch("/api/ai/analyze-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, desc, price, location, mainCategory, subCategory }),
      });

      const data = await res.json();
      setAnalysis(data);
      setAiStep("analyzed");
    } catch (error) {
      console.error(error);
      alert("فشل تحليل الإعلان");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const improvePost = async () => {
    if (!title || !desc) return alert("اكتب العنوان والوصف أولاً");

    try {
      setLoadingAI(true);

      const res = await fetch("/api/ai/improve-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, desc }),
      });

      const data = await res.json();

      setTitle(data.title || title);
      setDesc(data.description || desc);
      setAnalysis(null);
      setFraudCheck(null);
      setAiStep("generated");

      alert("تم تحسين الإعلان");
    } catch (error) {
      console.error(error);
      alert("فشل تحسين الإعلان");
    } finally {
      setLoadingAI(false);
    }
  };

  const checkFraud = async () => {
    if (!title || !desc) return alert("اكتب العنوان والوصف أولاً");

    try {
      setLoadingFraud(true);

      const res = await fetch("/api/ai/fraud-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, desc, price }),
      });

      const data = await res.json();
      setFraudCheck(data);
      setAiStep("checked");
    } catch (error) {
      console.error(error);
      alert("فشل فحص الأمان");
    } finally {
      setLoadingFraud(false);
    }
  };

  const uploadImages = async () => {
    const urls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error } = await supabase.storage
        .from("post-images")
        .upload(filePath, image);

      if (error) throw new Error(error.message);

      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const notifyAdmins = async (postTitle: string) => {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("isAdmin", true);

    for (const admin of admins || []) {
      await createNotification({
        userId: admin.id,
        title: "📦 إعلان جديد",
        message: `تم نشر إعلان جديد: ${postTitle}`,
        link: "/admin/posts",
        type: "post",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!currentUser) {
        router.push("/login?redirect=/create-post");
        return;
      }

      if (!mainCategory) return alert("يرجى اختيار القسم الرئيسي");
      if (!subCategory) return alert("يرجى اختيار القسم الفرعي");
      if (title.trim().length < 5) return alert("العنوان يجب أن يكون 5 أحرف على الأقل");
      if (desc.trim().length < 20) return alert("الوصف يجب أن يكون 20 حرفًا على الأقل");
      if (!location.trim()) return alert("يرجى إدخال الموقع");
      if (images.length === 0) return alert("يرجى إضافة صورة واحدة على الأقل");
      if (price && isNaN(Number(price))) return alert("السعر يجب أن يكون رقمًا فقط");

      if (analysis && analysis.score < 50) return alert("الإعلان ضعيف. يرجى تحسينه قبل النشر.");
      if (fraudCheck?.status === "danger") return alert("لا يمكن نشر إعلان مصنف كمشبوه.");

      if (!analysis && !confirm("لم تقم بتحليل الإعلان بعد. هل تريد النشر بدون تحليل؟")) return;
      if (!fraudCheck && !confirm("لم تقم بفحص الأمان بعد. هل تريد النشر بدون فحص؟")) return;

      setLoading(true);

      const imageUrls = await uploadImages();

      const name = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
      const userName = name || currentUser.email || "مستخدم";

      const { error } = await supabase.from("posts").insert({
        type,
        mainCategory,
        subCategory,
        country,
        currency,
        category: mainCategory,
        title: title.trim(),
        desc: desc.trim(),
        description: desc.trim(),
        price: price.trim(),
        location: location.trim(),
        city: location.trim(),
        imageUrls,
        images: imageUrls,
        imageUrl: imageUrls[0] || "",
        userId: currentUser.id,
        userName,
        phone: profile?.phone || "",
        isFeatured: false,
        isBoosted: false,
        isHidden: false,
        boostedAt: null,
        boostExpiresAt: null,
        views: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (error) throw new Error(error.message);

      await notifyAdmins(title.trim());

      alert("تم نشر الإعلان بنجاح");
      router.push("/marketplace");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "حدث خطأ أثناء نشر الإعلان");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = title.trim().length >= 5 && desc.trim().length >= 20;
  const canCheck = !!analysis;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-sm font-black text-green-400">DealNet AI Publisher</p>
              <h1 className="text-4xl font-black md:text-5xl">نشر إعلان جديد</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                أنشئ إعلانًا احترافيًا مع صور واضحة، تصنيف دقيق، ومراجعة ذكية قبل النشر.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-300">اكتمال الإعلان</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-3 w-44 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="font-black">{progress}%</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">✨ المساعد الذكي</h2>
                  <p className="mt-1 text-sm text-slate-500">اكتب فكرة بسيطة، وسيقترح النظام عنوانًا ووصفًا وسعرًا.</p>
                </div>
                <span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700">
                  AI Ready
                </span>
              </div>

              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="مثال: عندي آيفون 13 مستعمل نظيف للبيع في بغداد"
                rows={3}
                className="mb-4 w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-purple-500"
              />

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  onClick={generateWithAI}
                  disabled={loadingAI}
                  className="rounded-2xl bg-purple-600 py-4 font-bold text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {loadingAI ? "جاري التوليد..." : "✨ توليد"}
                </button>

                <button
                  onClick={analyzePost}
                  disabled={!canAnalyze || loadingAnalysis}
                  className="rounded-2xl bg-slate-950 py-4 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {loadingAnalysis ? "جاري التحليل..." : "🧠 تحليل"}
                </button>

                <button
                  onClick={checkFraud}
                  disabled={!canCheck || loadingFraud}
                  className="rounded-2xl bg-red-600 py-4 font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingFraud ? "جاري الفحص..." : "🛡️ فحص"}
                </button>
              </div>

              {analysis && (
                <div className="mt-5 rounded-2xl bg-slate-100 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-black">تقييم الإعلان: {analysis.score}/100</p>
                    <p className="text-sm font-bold text-slate-600">{analysis.status}</p>
                  </div>

                  {analysis.warning && (
                    <p className="mb-3 rounded-xl bg-yellow-100 p-3 text-sm text-yellow-800">
                      ⚠️ {analysis.warning}
                    </p>
                  )}

                  <button
                    onClick={improvePost}
                    disabled={loadingAI}
                    className="mt-3 w-full rounded-2xl bg-purple-600 py-3 font-bold text-white hover:bg-purple-700 disabled:opacity-60"
                  >
                    {loadingAI ? "جاري التحسين..." : "✨ حسّن الإعلان تلقائيًا"}
                  </button>
                </div>
              )}

              {fraudCheck && (
                <div className="mt-5 rounded-2xl bg-yellow-50 p-5">
                  <p className="mb-2 font-black">حالة الأمان: {fraudCheck.status}</p>
                  <p className="text-sm text-slate-700">{fraudCheck.message}</p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="mb-6 text-2xl font-black">بيانات الإعلان</h2>
               
              <div className="grid gap-5 md:grid-cols-2">
                <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500">
                  <option value="sell">بيع</option>
                  <option value="buy">طلب شراء</option>
                  <option value="service">خدمة</option>
                  <option value="request">طلب خدمة</option>
                  <option value="partnership">شراكة</option>
                </select>

                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="السعر بالدينار العراقي" className="rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500" />
                  <select
  value={currency}
  onChange={(e) => setCurrency(e.target.value)}
  className="rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500"
>
  <option value="IQD">🇮🇶 دينار عراقي (IQD)</option>
  <option value="SAR">🇸🇦 ريال سعودي (SAR)</option>
  <option value="AED">🇦🇪 درهم إماراتي (AED)</option>
  <option value="KWD">🇰🇼 دينار كويتي (KWD)</option>
  <option value="QAR">🇶🇦 ريال قطري (QAR)</option>
  <option value="BHD">🇧🇭 دينار بحريني (BHD)</option>
  <option value="OMR">🇴🇲 ريال عماني (OMR)</option>
</select>
                <select
                  value={mainCategory}
                  onChange={(e) => {
                    setMainCategory(e.target.value);
                    setSubCategory("");
                    resetChecks();
                  }}
                  className="rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500"
                >
                  <option value="">اختر القسم الرئيسي</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={subCategory}
                  onChange={(e) => {
                    setSubCategory(e.target.value);
                    resetChecks();
                  }}
                  disabled={!mainCategory}
                  className="rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500 disabled:opacity-50"
                >
                  <option value="">اختر القسم الفرعي</option>
                  {mainCategory &&
                    categories[mainCategory].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
              </div>

              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  resetChecks();
                }}
                placeholder="عنوان الإعلان"
                className="mt-5 w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500"
              />

              <textarea
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  resetChecks();
                }}
                placeholder="اكتب وصفًا واضحًا ومفصلًا..."
                rows={7}
                className="mt-5 w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500"
              />

              <input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  resetChecks();
                }}
                placeholder="المدينة / الموقع"
                className="mt-5 w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500"
              />
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="mb-2 text-2xl font-black">صور الإعلان</h2>
              <p className="mb-4 text-sm text-slate-500">أضف صور واضحة. الحد المقترح 8 صور.</p>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-green-500 hover:bg-green-50">
                <span className="text-5xl">📸</span>
                <span className="mt-3 text-lg font-black text-slate-800">اختر صور الإعلان</span>
                <span className="mt-1 text-sm text-slate-500">PNG / JPG / WEBP</span>

                <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
              </label>

              {images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative overflow-hidden rounded-2xl border bg-slate-100 shadow-sm">
                      <img src={URL.createObjectURL(image)} alt="preview" className="h-36 w-full object-cover" />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute left-2 top-2 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="sticky top-24 rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black">معاينة الإعلان</h2>

              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <div className="flex h-48 items-center justify-center bg-slate-200">
                  {images[0] ? (
                    <img src={URL.createObjectURL(images[0])} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-slate-400">لا توجد صورة</span>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-xs font-bold text-blue-600">
                    {mainCategory || "القسم"} {subCategory ? `— ${subCategory}` : ""}
                  </p>

                  <h3 className="mt-2 line-clamp-1 text-lg font-black text-slate-900">
                    {title || "عنوان الإعلان"}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {desc || "وصف الإعلان سيظهر هنا..."}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xl font-black text-green-600">
{price
  ? `${Number(price).toLocaleString("en-US")} ${currency}`
  : "حسب الاتفاق"}                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      📍 {location || "الموقع"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">حالة الإعلان</p>
                <p className="mt-2 text-2xl font-black text-green-600">{progress}%</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-5 w-full rounded-2xl bg-green-500 py-5 text-lg font-black text-white shadow-xl hover:bg-green-600 disabled:opacity-60"
              >
                {loading ? "جاري نشر الإعلان..." : "نشر الإعلان"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}