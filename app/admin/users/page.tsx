"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  };

  const toggleBlock = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "users", id), {
      isBlocked: !current,
    });
    loadUsers();
  };

  const toggleVerify = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "users", id), {
      isVerified: !current,
    });
    loadUsers();
  };

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">👤 إدارة المستخدمين</h1>

      {users.map((u) => (
        <div key={u.id} className="bg-white p-4 mb-3 rounded-xl shadow">
          <p>{u.email}</p>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => toggleBlock(u.id, u.isBlocked)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              {u.isBlocked ? "فك الحظر" : "حظر"}
            </button>

            <button
              onClick={() => toggleVerify(u.id, u.isVerified)}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              {u.isVerified ? "إلغاء التوثيق" : "توثيق"}
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}