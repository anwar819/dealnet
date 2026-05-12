"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { createNotification } from "../../../lib/notifications";
export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const chatId = id as string;

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (userSnap.exists() && userSnap.data().isBlocked) {
        setIsBlocked(true);
        alert("🚫 تم حظر حسابك");
        router.push("/");
        return;
      }

      setCheckingUser(false);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!chatId || !userId || isBlocked) return;

    const chatRef = doc(db, "chats", chatId);

    const chatUnsub = onSnapshot(chatRef, (snap) => {
      if (!snap.exists()) {
        setChat(null);
        return;
      }

      const data = snap.data();

      if (!data.users?.includes(userId)) {
        alert("غير مصرح لك بدخول هذه المحادثة");
        router.push("/messages");
        return;
      }

      setChat(data);
    });

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const msgUnsub = onSnapshot(q, (snapshot) => {
      const data: any[] = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setMessages(data);
    });

    return () => {
      chatUnsub();
      msgUnsub();
    };
  }, [chatId, userId, isBlocked, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (isBlocked) {
      alert("🚫 لا يمكنك إرسال رسالة، حسابك محظور");
      return;
    }

    if (!userId) {
      alert("يجب تسجيل الدخول أولاً");
      router.push("/login");
      return;
    }

    if (!text.trim()) return;

    try {
      setSending(true);

      const messageText = text.trim();
      const createdAt = Date.now();

      await addDoc(collection(db, "messages"), {
        chatId,
        postId: chat?.postId || "",
        text: messageText,
        senderId: userId,
        createdAt,
      });

      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: messageText,
          updatedAt: createdAt,
        },
        { merge: true }
      );
    const targetUser =
  userId === chat?.sellerId ? chat?.buyerId : chat?.sellerId;

if (targetUser) {
  await createNotification({
    userId: targetUser,
    title: "💬 رسالة جديدة",
    message: `لديك رسالة جديدة بخصوص: ${chat?.postTitle || "إعلان"}`,
    link: `/chat/${chatId}`,
    type: "chat",
  });
}
      setText("");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value?: number) => {
    if (!value) return "";
    return new Date(value).toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري التحقق...
      </main>
    );
  }

  if (isBlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-red-600">🚫 حسابك محظور</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-120px)] max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-slate-950 p-4 text-white">
          <div>
            <h1 className="text-xl font-black">💬 المحادثة</h1>
            <p className="mt-1 text-sm text-slate-300">
              {chat?.postTitle || "إعلان"}
            </p>
          </div>

          <div className="flex gap-2">
            {chat?.postId && (
              <button
                onClick={() => router.push(`/post/${chat.postId}`)}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
              >
                الإعلان
              </button>
            )}

            <button
              onClick={() => router.push("/messages")}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
            >
              الرسائل
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-100 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-3xl bg-white p-6 text-center shadow">
                <p className="text-lg font-black text-slate-800">
                  لا توجد رسائل بعد
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  ابدأ المحادثة الآن.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderId === userId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
                      mine
                        ? "rounded-br-sm bg-green-500 text-white"
                        : "rounded-bl-sm bg-white text-slate-800"
                    }`}
                  >
                    <p>{msg.text}</p>

                    <div
                      className={`mt-1 text-[11px] ${
                        mine ? "text-green-50" : "text-slate-400"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="اكتب رسالة..."
              className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-green-500"
            />

            <button
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              className="rounded-2xl bg-green-500 px-7 font-bold text-white hover:bg-green-600 disabled:opacity-50"
            >
              {sending ? "..." : "إرسال"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}