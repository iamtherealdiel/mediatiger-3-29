import React from "react";
import { Activity, Clock, Eye, BarChart2 } from "lucide-react";
import { formatNumber } from "../utils/dateUtils";

interface RealtimePerformanceProps {
  realtimeViews: {
    current: number;
    last24h: number;
    last48h: number;
  };
}

export const RealtimePerformance: React.FC<RealtimePerformanceProps> = ({
  realtimeViews,
}) => {
  return (
    <div className="col-span-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Activity className="h-5 w-5 text-indigo-400 mr-2 animate-pulse" />
        Realtime Performance
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="realtime-card wave-animation bg-gradient-to-br from-slate-700/50 via-slate-700/40 to-slate-700/50 rounded-lg p-4 border border-slate-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Current Views</span>
            <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(realtimeViews.current)}
          </p>
          <p className="text-sm text-slate-400">Active viewers right now</p>
        </div>
        <div className="realtime-card wave-animation bg-gradient-to-br from-slate-700/50 via-slate-700/40 to-slate-700/50 rounded-lg p-4 border border-slate-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Last 24 Hours</span>
            <Eye className="h-4 w-4 text-green-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(realtimeViews.last24h)}
          </p>
          <p className="text-sm text-slate-400">Total views in past 24h</p>
        </div>
        <div className="realtime-card wave-animation bg-gradient-to-br from-slate-700/50 via-slate-700/40 to-slate-700/50 rounded-lg p-4 border border-slate-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Last 48 Hours</span>
            <BarChart2 className="h-4 w-4 text-blue-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(realtimeViews.last48h)}
          </p>
          <p className="text-sm text-slate-400">Total views in past 48h</p>
        </div>
      </div>
    </div>
  );
};
