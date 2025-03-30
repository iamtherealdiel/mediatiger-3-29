import React from 'react';
import { Activity, Eye, Users as UsersIcon, DollarSign, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateUtils';

interface ActivityItem {
  id: string;
  type: 'view' | 'subscriber' | 'revenue' | 'milestone';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    trend?: 'up' | 'down';
    amount?: number;
  };
}

interface RecentActivityProps {
  recentActivity: ActivityItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ recentActivity }) => {
  return (
    <div className="col-span-full md:col-span-2 bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Activity className="h-5 w-5 text-indigo-400 mr-2" />
        Recent Activity
      </h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {recentActivity.map((activity) => (
          <div
            key={activity.id}
            className="bg-slate-700/50 rounded-lg p-4 flex items-start space-x-4"
          >
            <div
              className={`p-2 rounded-full ${
                activity.type === "view"
                  ? "bg-blue-500/20"
                  : activity.type === "subscriber"
                  ? "bg-green-500/20"
                  : activity.type === "revenue"
                  ? "bg-purple-500/20"
                  : "bg-indigo-500/20"
              }`}
            >
              {activity.type === "view" && (
                <Eye className="h-5 w-5 text-blue-400" />
              )}
              {activity.type === "subscriber" && (
                <UsersIcon className="h-5 w-5 text-green-400" />
              )}
              {activity.type === "revenue" && (
                <DollarSign className="h-5 w-5 text-purple-400" />
              )}
              {activity.type === "milestone" && (
                <Award className="h-5 w-5 text-indigo-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-white font-medium">{activity.title}</h4>
                <span className="text-sm text-slate-400">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1">{activity.description}</p>
              {activity.metadata?.trend && (
                <div
                  className={`flex items-center mt-2 ${
                    activity.metadata.trend === "up"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {activity.metadata.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm">
                    {activity.metadata.amount}%{" "}
                    {activity.metadata.trend === "up" ? "increase" : "decrease"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};