import React from 'react';
import { LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

interface SettingsDropdownProps {
  user: User | null;
  handleSignOut: (
    supabase: SupabaseClient,
    isRejected: boolean,
    userId: string | undefined,
    signOut: () => Promise<void>
  ) => Promise<void>;
  supabase: SupabaseClient;
  isRejected: boolean;
  signOut: () => Promise<void>;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  user,
  handleSignOut,
  supabase,
  isRejected,
  signOut,
}) => {
  return (
    <div className="settings-dropdown absolute right-0 top-full mt-2 w-80 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-white font-semibold">Settings</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Profile Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Name</span>
            <span className="text-white">
              {user?.user_metadata?.full_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Email</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <button className="w-full text-left text-indigo-400 hover:text-indigo-300 transition-colors">
            Change Password
          </button>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-white font-medium mb-3">Security</h4>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Two-Factor Authentication</span>
            <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Enable
            </button>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-white font-medium mb-3">Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Language</span>
              <select className="bg-slate-700 text-white rounded-md px-2 py-1 text-sm">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Timezone</span>
              <select className="bg-slate-700 text-white rounded-md px-2 py-1 text-sm">
                <option>UTC</option>
                <option>EST</option>
                <option>PST</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <button
            onClick={() => {
              handleSignOut(supabase, isRejected, user?.id, signOut);
            }}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};