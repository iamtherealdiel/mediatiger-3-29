import React from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const NotificationsTab: React.FC = () => {
  return (
    <div>
      <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-3 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Bell className="h-5 w-5 text-indigo-400 mr-2" />
            Send Notification
            <span className="ml-2 text-sm font-normal text-slate-400">
              (Send to individual user or all users)
            </span>
          </h2>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const sendToAll = formData.get("sendToAll") === "true";

            try {
              if (sendToAll) {
                const { data: users, error: usersError } = await supabase
                  .from("user_requests")
                  .select("user_id")
                  .in("status", ["pending", "approved"]);

                if (usersError) throw usersError;

                for (const user of users || []) {
                  await supabase.rpc("create_notification", {
                    p_user_id: user.user_id,
                    p_title: formData.get("title") as string,
                    p_content: formData.get("content") as string,
                    p_type: formData.get("type") as string,
                  });
                }

                toast.success("Notifications sent to all users");
              } else {
                const { error } = await supabase.rpc("create_notification", {
                  p_user_id: formData.get("userId") as string,
                  p_title: formData.get("title") as string,
                  p_content: formData.get("content") as string,
                  p_type: formData.get("type") as string,
                });

                if (error) throw error;
                toast.success("Notification sent successfully");
              }

              form.reset();
            } catch (err) {
              console.error("Error sending notification:", err);
              toast.error("Failed to send notification");
            }
          }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendToAll"
              name="sendToAll"
              value="true"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
              onChange={(e) => {
                const userIdInput = document.getElementById(
                  "userId"
                ) as HTMLInputElement;
                if (userIdInput) {
                  userIdInput.disabled = e.target.checked;
                  if (e.target.checked) {
                    userIdInput.value = "";
                  }
                }
              }}
            />
            <label
              htmlFor="sendToAll"
              className="text-sm font-medium text-slate-300"
            >
              Send to all users
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              name="userId"
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter user ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Content
            </label>
            <textarea
              name="content"
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
              placeholder="Notification content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Type
            </label>
            <select
              name="type"
              required
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Bell className="h-4 w-4 mr-2" />
              <span id="submitButtonText">Send Notification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};