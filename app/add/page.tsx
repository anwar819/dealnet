"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddPostPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("sell");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async () => {
    try {
      if (!title.trim()) return alert("اكتب عنوان الإعلان");
      if (!description.trim()) return alert("اكتب وصف الإعلان");
      if (!location.trim()) return alert("اكتب الموقع");

      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("يجب تسجيل الدخول أولاً");
        router.push("/login?redirect=/add");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.isBlocked) {
        alert("🚫 تم حظر حسابك");
        return;
      }

      let userName = "مستخدم";

      if (profile) {
        userName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
        if (!userName) userName = "مستخدم";
      }

      const { error } = await supabase.from("posts").insert({
        title: title.trim(),
        price: price.trim(),
        description: description.trim(),
        desc: description.trim(),
        location: location.trim(),
        city: location.trim(),
        type,
        userId: user.id,
        userName,
        views: 0,
        isFeatured: false,
        isBoosted: false,
        isHidden: false,
        boostedAt: null,
        boostExpiresAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (error) {
        console.error(error);
        alert("فشل إضافة الإعلان");
        return;
      }

      alert("تم إضافة الإعلان");
      router.push("/marketplace");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "حدث خطأ أثناء إضافة الإعلان");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">إضافة إعلان</h1>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mb-4 w-full rounded border p-3"
        >
          <option value="sell">بيع</option>
          <option value="buy">طلب شراء</option>
          <option value="service">خدمة</option>
          <option value="request">طلب خدمة</option>
          <option value="partnership">شراكة</option>
        </select>

        <input
          type="text"
          placeholder="عنوان الإعلان"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-4 w-full rounded border p-3"
        />

        <input
          type="text"
          placeholder="السعر"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mb-4 w-full rounded border p-3"
        />

        <input
          type="text"
          placeholder="الموقع"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mb-4 w-full rounded border p-3"
        />

        <textarea
          placeholder="الوصف"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mb-4 w-full rounded border p-3"
          rows={4}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded bg-green-600 p-3 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "جاري النشر..." : "نشر الإعلان"}
        </button>
      </div>
    </main>
  );
}