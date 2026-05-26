"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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
    setImages(Array.from(files));
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
        setSubCategory(categories[data.mainCategory].includes(data.subCategory) ? data.subCategory : "");
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
      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch("http://samedical.online/upload.php", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      urls.push(data.url);
    }

    return urls;
  };

  const handleSubmit = async () => {
    try {
      if (!currentUser) {
        alert("يجب تسجيل الدخول أولاً");
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
      const phone = profile?.phone || "";

      const { error } = await supabase.from("posts").insert({
        type,
        mainCategory,
        subCategory,
        category: mainCategory,
        title,
        desc,
        description: desc,
        price,
        location,
        city: location,
        imageUrls,
        images: imageUrls,
        imageUrl: imageUrls[0] || "",
        userId: currentUser.id,
        userName,
        phone,
        isFeatured: false,
        isBoosted: false,
        isHidden: false,
        boostedAt: null,
        boostExpiresAt: null,
        views: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (error) {
        console.error(error);
        throw new Error(error.message);
      }

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
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <p className="mb-3 text-sm font-bold text-green-400">DealNet AI</p>
          <h1 className="text-4xl font-black">نشر إعلان جديد</h1>
          <p className="mt-3 text-slate-300">
            المساعد الذكي يعمل بخطوات مرتبة: توليد، تحليل، فحص أمان، ثم نشر.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">✨ المساعد الذكي</h2>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              خطوة ذكية واحدة في كل مرة
            </span>
          </div>

          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="مثال: عندي آيفون 13 مستعمل نظيف للبيع في بغداد"
            rows={3}
            className="mb-4 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-purple-500"
          />

          {aiStep === "start" && (
            <button
              onClick={generateWithAI}
              disabled={loadingAI}
              className="w-full rounded-2xl bg-purple-600 py-4 font-bold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {loadingAI ? "جاري توليد الإعلان..." : "✨ ابدأ المساعد الذكي"}
            </button>
          )}

          {aiStep === "generated" && (
            <button
              onClick={analyzePost}
              disabled={!canAnalyze || loadingAnalysis}
              className="w-full rounded-2xl bg-slate-950 py-4 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loadingAnalysis ? "جاري تحليل الإعلان..." : "🧠 تحليل الإعلان الآن"}
            </button>
          )}

          {aiStep === "analyzed" && (
            <button
              onClick={checkFraud}
              disabled={!canCheck || loadingFraud}
              className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loadingFraud ? "جاري فحص الأمان..." : "🛡️ فحص الأمان والاحتيال"}
            </button>
          )}

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
                className="mt-5 w-full rounded-2xl bg-purple-600 py-3 font-bold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {loadingAI ? "جاري التحسين..." : "✨ حسّن الإعلان تلقائيًا"}
              </button>
            </div>
          )}

          {fraudCheck && (
            <div className="mt-5 rounded-2xl bg-yellow-50 p-5">
              <p className="mb-2 font-black">حالة الأمان: {fraudCheck.status}</p>
              <p className="mb-3 text-sm text-slate-700">{fraudCheck.message}</p>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-black">بيانات الإعلان</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border p-3">
              <option value="sell">بيع</option>
              <option value="buy">طلب شراء</option>
              <option value="service">خدمة</option>
              <option value="request">طلب خدمة</option>
              <option value="partnership">شراكة</option>
            </select>

            <select
              value={mainCategory}
              onChange={(e) => {
                setMainCategory(e.target.value);
                setSubCategory("");
                resetChecks();
              }}
              className="w-full rounded-xl border p-3"
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
              className="w-full rounded-xl border p-3"
            >
              <option value="">اختر القسم الفرعي</option>
              {mainCategory &&
                categories[mainCategory].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
            </select>

            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="السعر" className="w-full rounded-xl border p-3" />
          </div>

          <input value={title} onChange={(e) => { setTitle(e.target.value); resetChecks(); }} placeholder="عنوان الإعلان" className="mt-5 w-full rounded-xl border p-3" />

          <textarea value={desc} onChange={(e) => { setDesc(e.target.value); resetChecks(); }} placeholder="الوصف" rows={6} className="mt-5 w-full rounded-xl border p-3" />

          <input value={location} onChange={(e) => { setLocation(e.target.value); resetChecks(); }} placeholder="الموقع" className="mt-5 w-full rounded-xl border p-3" />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-black">صور الإعلان</h2>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <span className="text-4xl">📸</span>
            <span className="mt-3 font-bold text-slate-800">اختر صور الإعلان</span>

            <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
          </label>

          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {images.map((image, index) => (
                <div key={index} className="relative overflow-hidden rounded-xl border bg-slate-100">
                  <img src={URL.createObjectURL(image)} alt="preview" className="h-32 w-full object-cover" />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute left-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-green-500 py-5 text-lg font-black text-white shadow-xl hover:bg-green-600 disabled:opacity-60"
        >
          {loading ? "جاري نشر الإعلان..." : "نشر الإعلان"}
        </button>
      </div>
    </main>
  );
}