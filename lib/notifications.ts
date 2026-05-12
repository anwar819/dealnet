import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

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
  if (!userId) return;

  await addDoc(collection(db, "notifications"), {
    userId,
    title,
    message,
    link,
    type,
    isRead: false,
    createdAt: Date.now(),
  });
}