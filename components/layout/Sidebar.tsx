"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function Sidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setFirstName("");
        setIsAdmin(false);
        setIsVerified(false);
        setNotificationsCount(0);
        return;
      }

      setUser(u);

      const snap = await getDoc(doc(db, "users", u.uid));

      if (snap.exists()) {
        const data = snap.data();
        setFirstName(data.firstName || "مستخدم");
        setIsAdmin(data.isAdmin === true);
        setIsVerified(data.isVerified === true);
      }

      const q = query(
        collection(db, "notifications"),
        where("userId", "==", u.uid),
        where("isRead", "==", false)
      );

      const unsubNotifications = onSnapshot(q, (snapshot) => {
        setNotificationsCount(snapshot.size);
      });

      return () => unsubNotifications();
    });

    return () => unsubAuth();
  }, []);

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/admin")) return "لوحة الإدارة";
    if (pathname.startsWith("/marketplace")) return "السوق";
    if (pathname.startsWith("/create-post")) return "نشر إعلان";
    if (pathname.startsWith("/messages")) return "الرسائل";
    if (pathname.startsWith("/chat")) return "المحادثة";
    if (pathname.startsWith("/favorites")) return "المفضلة";
    if (pathname.startsWith("/account")) return "الحساب";
    if (pathname.startsWith("/notifications")) return "الإشعارات";
    if (pathname.startsWith("/my-posts")) return "إعلاناتي";
    if (pathname.startsWith("/post")) return "تفاصيل الإعلان";
    return "DealNet";
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const linkClass = (href: string, color = "green") =>
    `block rounded-xl px-4 py-3 font-bold transition ${
      isActive(href)
        ? color === "red"
          ? "bg-red-500 text-white"
          : color === "blue"
          ? "bg-blue-500 text-white"
          : color === "yellow"
          ? "bg-yellow-500 text-black"
          : "bg-green-500 text-white"
        : "hover:bg-slate-900 hover:text-green-400"
    }`;

  if (!user) return null;

  const NotificationsLink = () => (
    <Link
      href="/notifications"
      className={`${linkClass("/notifications", "blue")} relative`}
    >
      🔔 الإشعارات

      {notificationsCount > 0 && (
        <span className="absolute left-3 top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
          {notificationsCount}
        </span>
      )}
    </Link>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-20 z-[70] flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-white shadow-lg hover:bg-slate-800"
      >
        {open ? "×" : "☰"}
      </button>

      <aside
        className={`fixed right-0 top-16 z-[60] h-[calc(100%-4rem)] w-72 bg-black/95 text-white shadow-2xl backdrop-blur-lg transition-all duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-5">
          <div>
            <div className="mb-5 rounded-2xl bg-slate-900 p-4 text-center">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-lg font-black">
                  {firstName ? firstName.charAt(0).toUpperCase() : "U"}
                </div>
              </div>

              <div className="font-bold">{firstName}</div>

              <div className="mt-1 text-xs text-slate-400">
                {isAdmin ? "⚡ مدير النظام" : isVerified ? "⭐ بائع موثوق" : "مستخدم"}
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-green-400">
              {pageTitle}
            </div>

            <nav className="space-y-2 text-sm">
              {pathname.startsWith("/admin") ? (
                <>
                  <Link href="/admin/posts" className={linkClass("/admin/posts", "yellow")}>
                    📦 إدارة الإعلانات
                  </Link>

                  <Link href="/admin/users" className={linkClass("/admin/users", "blue")}>
                    👥 المستخدمين
                  </Link>

                  <Link href="/admin/reports" className={linkClass("/admin/reports", "red")}>
                    🚨 البلاغات
                  </Link>

                  <Link href="/admin/boosts" className={linkClass("/admin/boosts", "yellow")}>
                    🔥 طلبات الترويج
                  </Link>

                  <Link href="/admin/finance" className={linkClass("/admin/finance", "yellow")}>
                    💰 الأرباح
                  </Link>

                  <hr className="my-4 border-slate-800" />

                  <Link href="/marketplace" className={linkClass("/marketplace")}>
                    🏪 العودة للسوق
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/marketplace" className={linkClass("/marketplace")}>
                    🏪 السوق
                  </Link>

                  <Link href="/create-post" className={linkClass("/create-post")}>
                    ➕ نشر إعلان
                  </Link>

                  <Link href="/my-posts" className={linkClass("/my-posts")}>
                    📦 إعلاناتي
                  </Link>

                  <Link href="/favorites" className={linkClass("/favorites", "red")}>
                    ❤️ المفضلة
                  </Link>

                  <Link href="/messages" className={linkClass("/messages", "blue")}>
                    📩 الرسائل
                  </Link>

                  <NotificationsLink />

                  <Link href="/account" className={linkClass("/account")}>
                    👤 حسابي
                  </Link>
                </>
              )}

              {isAdmin && !pathname.startsWith("/admin") && (
                <>
                  <hr className="my-4 border-slate-800" />

                  <Link href="/admin/posts" className={linkClass("/admin/posts", "yellow")}>
                    ⚡ لوحة الإدارة
                  </Link>
                </>
              )}
            </nav>
          </div>

          <button
            onClick={logout}
            className="mt-6 w-full rounded-xl bg-red-500 py-3 text-sm font-bold hover:bg-red-600"
          >
            تسجيل خروج
          </button>
        </div>
      </aside>
    </>
  );
}