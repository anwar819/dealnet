"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AddPostPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("sell");

  const router = useRouter();

  const handleSubmit = async () => {
    try {
      if (!auth.currentUser) {
        alert("يجب تسجيل الدخول أولاً");
        return;
      }

      const user = auth.currentUser;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      let userName = "مستخدم";

      if (userDoc.exists()) {
        const data = userDoc.data();
        userName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
        if (!userName) userName = "مستخدم";
      }

      await addDoc(collection(db, "posts"), {
        title,
        price,
        description,
        location,
        type,
        userId: user.uid,
        userName,
        createdAt: Date.now(),
      });

      alert("تم إضافة الإعلان");
      router.push("/marketplace");
    } catch (error: any) {
      console.error(error);
      alert(error.message);
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
          className="w-full rounded bg-green-600 p-3 text-white hover:bg-green-700"
        >
          نشر الإعلان
        </button>
      </div>
    </main>
  );
}