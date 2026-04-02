"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let listeners: ((t: Toast) => void)[] = [];
let idCounter = 0;

export function toast(message: string, type: "success" | "error" = "success") {
  const t = { id: ++idCounter, message, type };
  listeners.forEach((fn) => fn(t));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter((fn) => fn !== handler); };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" ? "✓" : "✕"}&ensp;{t.message}
        </div>
      ))}
    </div>
  );
}
