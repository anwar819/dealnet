"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const categories: Record<string, string[]> = {
  إلكترونيات: ["موبايلات", "لابتوبات", "شاشات", "كاميرات", "ألعاب إلكترونية"],
  "كهربائيات منزلية": ["مكيفات", "ثلاجات", "غسالات", "أفران", "سخانات"],
  سيارات: ["سيارات للبيع", "سيارات للإيجار", "قطع غيار", "إكسسوارات سيارات"],
  عقارات: ["شقق", "منازل", "أراضي", "محلات", "مكاتب"],
  "أجهزة طبية": ["أجهزة فحص", "معدات عيادات", "أجهزة مختبرات", "مستلزمات طبية"],
  خدمات: ["تصليح", "نقل", "تنظيف", "تصميم", "برمجة"],
  أخرى: ["متفرقات"],
};

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();

  const [post, setPost] = useState<any>(null);

  const [type, setType] = useState("sell");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");

  const [oldImages, setOldImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkUserAndLoadPost();
  }, [id]);

  const checkUserAndLoadPost = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/edit/${id}`);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.isBlocked) {
        alert("🚫 تم حظر حسابك");
        router.push("/");
        return;
      }

      await loadPost(user.id);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء التحقق من الحساب");
      setLoading(false);
    }
  };

  const loadPost = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("الإعلان غير موجود");
        router.push("/my-posts");
        return;
      }

      if (data.userId !== uid) {
        alert("لا يمكنك تعديل إعلان لا تملكه");
        router.push("/marketplace");
        return;
      }

      setPost(data);

      setType(data.type || "sell");
      setMainCategory(data.mainCategory || data.category || "");
      setSubCategory(data.subCategory || "");
      setTitle(data.title || "");
      setDesc(data.description || data.desc || "");
      setPrice(data.price || "");
      setLocation(data.location || "");
      setIsHidden(data.isHidden === true);

      const imgs =
        data.imageUrls ||
        data.images ||
        (data.imageUrl ? [data.imageUrl] : []);

      setOldImages(imgs || []);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل الإعلان");
    } finally {
      setLoading(false);
    }
  };

  const handleNewImages = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setNewImages(Array.from(files));
  };

  const removeOldImage = (index: number) => {
    setOldImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const urls: string[] = [];

    for (const image of newImages) {
      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch("http://samedical.online/upload.php", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      urls.push(data.url);
    }

    return urls;
  };

  const saveChanges = async () => {
    if (!post) return;

    if (!mainCategory) return alert("يرجى اختيار القسم الرئيسي");
    if (!subCategory) return alert("يرجى اختيار القسم الفرعي");
    if (title.trim().length < 5)
      return alert("العنوان يجب أن يكون 5 أحرف على الأقل");
    if (desc.trim().length < 20)
      return alert("الوصف يجب أن يكون 20 حرفًا على الأقل");
    if (!location.trim()) return alert("يرجى إدخال الموقع");
    if (price && isNaN(Number(price))) return alert("السعر يجب أن يكون رقمًا فقط");

    try {
      setSaving(true);

      const uploadedUrls = await uploadImages();
      const finalImages = [...oldImages, ...uploadedUrls];

      if (finalImages.length === 0) {
        alert("يجب أن يحتوي الإعلان على صورة واحدة على الأقل");
        return;
      }

      const { error } = await supabase
        .from("posts")
        .update({
          type,
          mainCategory,
          subCategory,
          category: mainCategory,
          title: title.trim(),
          desc: desc.trim(),
          description: desc.trim(),
          price,
          location: location.trim(),
          city: location.trim(),
          imageUrls: finalImages,
          images: finalImages,
          imageUrl: finalImages[0],
          isHidden,
          updatedAt: Date.now(),
        })
        .eq("id", post.id);

      if (error) {
        console.error(error);
        alert("فشل حفظ التعديلات");
        return;
      }

      alert("تم حفظ التعديلات بنجاح");
      router.push(`/post/${post.id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل الإعلان...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">✏️ تعديل الإعلان</h1>
          <p className="mt-2 text-slate-300">
            عدّل بيانات الإعلان واحفظ التغييرات.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-black">بيانات الإعلان</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                نوع الإعلان
              </label>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-green-500"
              >
                <option value="sell">بيع</option>
                <option value="buy">طلب شراء</option>
                <option value="service">خدمة</option>
                <option value="request">طلب خدمة</option>
                <option value="partnership">شراكة</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                القسم الرئيسي
              </label>

              <select
                value={mainCategory}
                onChange={(e) => {
                  setMainCategory(e.target.value);
                  setSubCategory("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-green-500"
              >
                <option value="">اختر القسم الرئيسي</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                القسم الفرعي
              </label>

              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                disabled={!mainCategory}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-green-500 disabled:bg-slate-100"
              >
                <option value="">اختر القسم الفرعي</option>
                {mainCategory &&
                  categories[mainCategory]?.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                السعر
              </label>

              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="مثال: 500"
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              عنوان الإعلان
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الإعلان"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              الوصف
            </label>

            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={6}
              placeholder="وصف الإعلان"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              الموقع
            </label>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: بغداد"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500"
            />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <label className="flex items-center gap-3 font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="h-5 w-5"
              />
              إخفاء الإعلان مؤقتًا من السوق
            </label>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-black">صور الإعلان</h2>

          {oldImages.length > 0 && (
            <>
              <p className="mb-3 text-sm font-bold text-slate-600">
                الصور الحالية
              </p>

              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                {oldImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-xl border bg-slate-100"
                  >
                    <img
                      src={img}
                      alt="صورة الإعلان"
                      className="h-32 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeOldImage(index)}
                      className="absolute left-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-green-500 hover:bg-green-50">
            <span className="text-4xl">📸</span>
            <span className="mt-3 font-bold text-slate-800">
              إضافة صور جديدة
            </span>
            <span className="mt-1 text-sm text-slate-500">
              يمكنك اختيار أكثر من صورة
            </span>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleNewImages}
              className="hidden"
            />
          </label>

          {newImages.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {newImages.map((image, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-xl border bg-slate-100"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt="صورة جديدة"
                    className="h-32 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute left-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 md:flex-row">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex-1 rounded-2xl bg-green-500 py-4 text-lg font-black text-white hover:bg-green-600 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>

          <button
            onClick={() => router.push(`/post/${id}`)}
            className="rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white hover:bg-slate-800"
          >
            إلغاء
          </button>
        </section>
      </div>
    </main>
  );
}