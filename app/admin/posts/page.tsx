"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminPosts() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      const userDoc = await getDocs(collection(db, "users"));
      const currentUser = userDoc.docs.find((d) => d.id === user.uid);

      if (!currentUser?.data()?.isAdmin) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);
      loadPosts();
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const loadPosts = async () => {
    const snap = await getDocs(collection(db, "posts"));
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setPosts(data);
  };

  const toggleHide = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "posts", id), {
      isHidden: !current,
    });
    loadPosts();
  };

  const toggleBoost = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "posts", id), {
      isBoosted: !current,
    });
    loadPosts();
  };

  const deletePostHandler = async (id: string) => {
    if (!confirm("حذف الإعلان؟")) return;
    await deleteDoc(doc(db, "posts", id));
    loadPosts();
  };

  if (loading) return <div>Loading...</div>;

  if (!allowed) return <div>غير مصرح</div>;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">📦 إدارة الإعلانات</h1>

      <div className="space-y-4">
        {posts.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-bold">{p.title}</h2>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => toggleHide(p.id, p.isHidden)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                {p.isHidden ? "إظهار" : "إخفاء"}
              </button>

              <button
                onClick={() => toggleBoost(p.id, p.isBoosted)}
                className="bg-purple-500 text-white px-3 py-1 rounded"
              >
                {p.isBoosted ? "إلغاء الترويج" : "ترويج"}
              </button>

              <button
                onClick={() => deletePostHandler(p.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                حذف
              </button>

              <button
                onClick={() => router.push(`/post/${p.id}`)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                عرض
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}