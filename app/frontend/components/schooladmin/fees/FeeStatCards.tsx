"use client";

import { DollarSign } from "lucide-react";
import type { FeeSummary } from "./types";

interface FeeStatCardsProps {
  stats: FeeSummary | null;
}

export default function FeeStatCards({ stats }: FeeStatCardsProps) {
  const total = (stats?.totalCollected ?? 0) + (stats?.totalDue ?? 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
          <DollarSign size={18} /> Total Fees (Net)
        </div>
        <div className="break-words text-lg font-bold sm:text-xl">₹{total.toLocaleString("en-IN")}</div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">Collected</div>
        <div className="break-words text-lg font-bold text-emerald-400 sm:text-xl">
          ₹{(stats?.totalCollected ?? 0).toLocaleString("en-IN")}
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">Pending</div>
        <div className="break-words text-lg font-bold text-amber-400 sm:text-xl">
          ₹{(stats?.totalDue ?? 0).toLocaleString("en-IN")}
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">Critical</div>
        <div className="text-lg font-bold text-red-400 sm:text-xl">{stats?.pending ?? 0}</div>
      </div>
    </div>
  );
}
