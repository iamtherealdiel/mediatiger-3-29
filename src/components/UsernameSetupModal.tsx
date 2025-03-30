import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function UsernameSetupModal({
  isOpen,
  onClose,
  setDashboardUsername,
}) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (username.trim() == "") {
        toast.error("Please enter a username");
        return;
      } else if (username.trim().length < 3) {
        toast.error("Your username must be at least 3 chars");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        data: { username: username },
      });

      if (updateError) throw updateError;
      onClose();
    } catch (err) {
      setError("Username exists, please select a different one.");
    } finally {
      setIsLoading(false);
      setDashboardUsername(username);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800/90 rounded-xl p-8 max-w-xl w-full shadow-2xl border border-slate-700/50 relative overflow-hidden">
        {/* Gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-slate-500/5 pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">
            Create Your Username
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Choose a unique username that will identify you in the system. This
            will be your @handle.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-lg font-medium text-slate-300 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  @
                </span>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 px-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="username"
                />
              </div>
              {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg py-3 px-6 font-medium hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Setting Username...
                </span>
              ) : (
                "Set Username"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
