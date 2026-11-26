"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-[#FF9500] px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-[13px] font-medium text-black">
      <WifiOff className="size-3.5" aria-hidden />
      オフラインです。接続が戻ると自動で再試行します。
    </div>
  );
}
