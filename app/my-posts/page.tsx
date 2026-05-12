"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function MyPostsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);
      await loadPosts(user.uid);
    });

    return () => unsub();
  }, []);

  const loadPosts = async (uid: string) => {
    const q = query(collection(db, "posts"), where("userId", "==", uid));
    const snap = await getDocs(q);

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPosts(data);
    setLoading(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الإعلان؟")) return;

    await deleteDoc(doc(db, "posts", id));
    setPosts(posts.filter((p) => p.id !== id));
  };

  const boostPost = async (post: any) => {
    const now = Date.now();
    const expiresAt = now + 3 * 24 * 60 * 60 * 1000;

    await updateDoc(doc(db, "posts", post.id), {
      isBoosted: true,
      boostedAt: now,
      boostExpiresAt: expiresAt,
    });

    alert("🔥 تم ترويج الإعلان 3 أيام");

    setPosts(
      posts.map((p) =>
        p.id === post.id
          ? { ...p, isBoosted: true, boostedAt: now }
          : p
      )
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        جاري التحميل...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow">
          <h1 className="text-3xl font-black">📦 إعلاناتي</h1>
          <p className="mt-2 text-slate-300">
            إدارة جميع إعلاناتك في مكان واحد
          </p>
        </section>

        {posts.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <p className="text-xl font-black">لا يوجد إعلانات</p>

            <button
              onClick={() => router.push("/create-post")}
              className="mt-5 rounded-xl bg-green-500 px-6 py-3 font-bold text-white"
            >
              + نشر إعلان
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-3xl bg-white p-4 shadow"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-black text-lg truncate">
                    {post.title}
                  </h2>

                  {post.isBoosted && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      🔥 مروّج
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-sm line-clamp-2">
                  {post.description}
                </p>

                <p className="mt-2 font-bold text-green-600">
                  ${post.price}
                </p>

                <div className="mt-4 grid gap-2">
                  <button
                    onClick={() => router.push(`/post/${post.id}`)}
                    className="rounded-xl bg-slate-900 py-2 text-white"
                  >
                    عرض
                  </button>

                  <button
                    onClick={() => router.push(`/edit/${post.id}`)}
                    className="rounded-xl bg-blue-500 py-2 text-white"
                  >
                    تعديل
                  </button>

                  <button
  onClick={() => router.push(`/boost/${post.id}`)}
  className="rounded-xl bg-orange-500 py-2 text-white"
>
  🔥 ترويج
</button>

                  <button
                    onClick={() => deletePost(post.id)}
                    className="rounded-xl bg-red-500 py-2 text-white"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}