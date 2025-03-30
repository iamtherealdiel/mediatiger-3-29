import React from 'react';
import { Eye, Play, Shield, Globe } from 'lucide-react';

interface DashboardCardsProps {
  monthlyViews: number;
  linkedChannels: number;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  monthlyViews,
  linkedChannels,
}) => {
  return (
    <div className="cards-dashboard grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 relative z-[1]">
      {/* Views Card */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-indigo-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-indigo-500/5 opacity-50"></div>
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all duration-300">
            <Eye className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-400">
              {new Date().toLocaleString("default", { month: "long" })}{" "}
              Views
            </p>
            <p className="text-2xl font-semibold text-white">
              {monthlyViews.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Channels Card */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-green-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-green-500/5 opacity-50"></div>
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
            <Play className="h-8 w-8 text-green-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-400">
              Active Channels
            </p>
            <p className="text-2xl font-semibold text-white">
              {linkedChannels}
            </p>
          </div>
        </div>
      </div>

      {/* Rights Card */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-purple-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-purple-500/5 opacity-50"></div>
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-400">
              Revenue
            </p>
            <p className="text-2xl font-semibold text-white whitespace-nowrap">
              $156K
            </p>
          </div>
        </div>
      </div>

      {/* Distribution Card */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-blue-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 opacity-50"></div>
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
            <Globe className="h-8 w-8 text-blue-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-400">
              Global Reach
            </p>
            <p className="text-2xl font-semibold text-white">48M</p>
          </div>
        </div>
      </div>
    </div>
  );
};