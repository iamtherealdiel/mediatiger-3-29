import React from 'react';
import { Bell } from 'lucide-react';
import { createPortal } from 'react-dom';
import { SupabaseClient } from '@supabase/supabase-js';

interface NotificationDropdownProps {
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
  notifications: any[];
  notifNumber: number;
  supabase: SupabaseClient;
  userId?: string;
  setHasNewNotification: (value: boolean) => void;
  setNotifications: (notifications: any[]) => void;
  setNotifNumber: (value: number) => void;
  setShowSettings: (value: boolean) => void;
  markAllAsRead: (supabase: SupabaseClient, userId: string | undefined, handlers: any) => void;
  clearNotifications: (supabase: SupabaseClient, userId: string | undefined, handlers: any) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  showNotifications,
  setShowNotifications,
  notifications,
  notifNumber,
  supabase,
  userId,
  setHasNewNotification,
  setNotifications,
  setNotifNumber,
  setShowSettings,
  markAllAsRead,
  clearNotifications,
}) => {
  return (
    <div className="notifications-button mx-2 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 relative" data-popover-target="notifications-popover">
      <Bell
        onClick={() => {
          setShowNotifications((prev) => !prev);
          markAllAsRead(supabase, userId, {
            setHasNewNotification,
            setNotifications,
            setNotifNumber,
          });
          setShowSettings(false);
        }}
        className={`h-6 w-6 transition-all duration-300 ${
          notifications.some((n) => !n.read)
            ? "text-white animate-pulse filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            : "text-slate-400"
        }`}
      />

      {notifNumber > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] flex justify-center items-center">
          {notifNumber > 9 ? "9+" : notifNumber}
        </span>
      )}

      {showNotifications &&
        createPortal(
          <div
            className="dropdown fixed top-16 right-6 w-96 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 transform transition-all duration-500 z-50"
            style={{
              animation: "slide-in-right 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards",
              opacity: 0,
              transform: "translateX(20px)",
            }}
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex gap-2">
                <button className="text-xs text-slate-400 hover:text-white transition-colors">
                  Mark all as read
                </button>
                <button
                  onClick={() => {
                    clearNotifications(supabase, userId, {
                      setHasNewNotification,
                      setNotifications,
                      setNotifNumber,
                    });
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-all duration-300 ${
                      !notification.read ? "bg-indigo-500/5" : ""
                    }`}
                  >
                    <h4 className="text-white font-medium">{notification.title}</h4>
                    <p className="text-slate-400 text-sm mt-1">{notification.content}</p>
                    <p className="text-slate-500 text-xs mt-2">{notification.time}</p>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}

      <style jsx>{`
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};