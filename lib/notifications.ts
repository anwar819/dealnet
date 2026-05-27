import { supabase } from "./supabase";

export async function createNotification({
  userId,
  title,
  message,
  link = "",
  type = "general",
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
}) {
  try {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .insert({
        userId,
        title,
        message,
        link,
        type,
        isRead: false,
        createdAt: Date.now(),
      });

    if (error) {
      console.error("Notification error:", error);
    }
  } catch (error) {
    console.error("Create notification failed:", error);
  }
}