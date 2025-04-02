import React from "react";
import {
  FileSpreadsheet,
  Bell,
  LucideYoutube,
  MessageSquare,
  User2,
  FlagIcon,
  ArrowLeft,
  Database,
} from "lucide-react";

interface AdminTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navigate: any;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  setActiveTab,
  navigate,
}) => {
  const tabs = [
    { id: "applications", icon: FileSpreadsheet, label: "Applications" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "yt-channels", icon: LucideYoutube, label: "Channels" },
    { id: "messages", icon: MessageSquare, label: "Messages" },
    { id: "users", icon: User2, label: "Users" },
    { id: "announcement", icon: FlagIcon, label: "Announcement" },
  ];

  return (
    <>
      <div className="flex items-center mb-6">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mr-4">
            <Database className="h-6 w-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
            Admin Panel
          </h1>
        </div>

        <div className="ml-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-700/50 mb-6">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`py-2 px-4 md:py-3 md:px-6 font-medium text-sm flex items-center transition-colors relative ${
              activeTab === id
                ? "text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center">
              <Icon className="h-4 w-4 mr-1" />
              {label}
            </div>
          </button>
        ))}
      </div>
    </>
  );
};
