"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
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
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!chatId || !userId || isBlocked) return;

    loadChat();
    loadMessages();

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chatId=eq.${chatId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, isBlocked]);

  useEffect(() => {
    if (!otherUser?.id) return;

    const channel = supabase
      .channel(`user-status-${otherUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${otherUser.id}`,
        },
        (payload) => {
          setOtherUser(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUser?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.isBlocked) {
        setIsBlocked(true);
        alert("🚫 تم حظر حسابك");
        router.push("/");
        return;
      }

      setCheckingUser(false);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء التحقق من الحساب");
    }
  };

  const loadChat = async () => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("chatId", chatId)
        .single();

      if (error || !data) {
        setChat(null);
        return;
      }

      if (!data.users?.includes(userId)) {
        alert("غير مصرح لك بدخول هذه المحادثة");
        router.push("/messages");
        return;
      }

      setChat(data);

      const targetUserId =
        userId === data.sellerId ? data.buyerId : data.sellerId;

      const { data: otherProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .single();

      setOtherUser(otherProfile || null);
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chatId", chatId)
        .order("createdAt", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setMessages(data || []);

      await supabase
        .from("messages")
        .update({ isRead: true })
        .eq("chatId", chatId)
        .eq("receiverId", userId)
        .eq("isRead", false);
    } catch (error) {
      console.error(error);
    }
  };

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

      const targetUser =
        userId === chat?.sellerId ? chat?.buyerId : chat?.sellerId;

      const myName =
        chat?.buyerId === userId ? chat?.buyerName : chat?.sellerName;

      const { error: msgError } = await supabase.from("messages").insert({
        chatId,
        postId: chat?.postId || "",
        text: messageText,
        senderId: userId,
        senderName: myName || "مستخدم",
        receiverId: targetUser || "",
        isRead: false,
        createdAt,
      });

      if (msgError) {
        console.error(msgError);
        alert("فشل إرسال الرسالة");
        return;
      }

      await supabase
        .from("chats")
        .update({
          lastMessage: messageText,
          updatedAt: createdAt,
        })
        .eq("chatId", chatId);

      if (targetUser) {
        await createNotification({
          userId: targetUser,
          title: "💬 رسالة جديدة",
          message: `رسالة جديدة من ${myName || "مستخدم"} بخصوص: ${
            chat?.postTitle || "إعلان"
          }`,
          link: `/chat/${chatId}`,
          type: "chat",
        });
      }

      setText("");
      loadMessages();
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

  const formatLastSeen = (value?: number) => {
    if (!value) return "";

    return new Date(value).toLocaleString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  const otherName =
    userId === chat?.sellerId
      ? chat?.buyerName || "المشتري"
      : chat?.sellerName || "البائع";

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
          <h1 className="text-2xl font-black text-red-600">
            🚫 حسابك محظور
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-120px)] max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-slate-950 p-4 text-white">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black">💬 {otherName}</h1>

              {otherUser?.isOnline ? (
                <span className="rounded-full bg-green-500 px-2 py-1 text-[10px] font-black text-white">
                  🟢 متصل الآن
                </span>
              ) : (
                <span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] font-black text-white">
                  ⚫ غير متصل
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-300">
              {chat?.postTitle || "إعلان"}
            </p>

            {!otherUser?.isOnline && otherUser?.lastSeen > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                آخر ظهور: {formatLastSeen(otherUser.lastSeen)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/review/${chatId}`)}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
            >
              ⭐ تقييم الطرف الآخر
            </button>

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
                    <p
                      className={`mb-1 text-xs font-black ${
                        mine ? "text-green-100" : "text-slate-500"
                      }`}
                    >
                      {msg.senderName || "مستخدم"}
                    </p>

                    <p>{msg.text}</p>

                    <div
                      className={`mt-1 flex items-center gap-2 text-[11px] ${
                        mine ? "text-green-50" : "text-slate-400"
                      }`}
                    >
                      <span>{formatTime(msg.createdAt)}</span>
                      {mine && <span>{msg.isRead ? "✓✓" : "✓"}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

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