import React from "react";
import { UserCheck, UserX } from "lucide-react";

interface ApplicationCardProps {
  application: {
    id: string;
    name: string;
    email: string;
    interests: string[];
    other_interest: string | null;
    youtube_links: string[];
    status: string;
    created_at: string;
  };
  onApprove?: (id: string, status: string) => void;
  onReject?: (id: string, status: string) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application: app,
  onApprove,
  onReject,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 group">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">{app.name}</h3>
          <p className="text-slate-400">{app.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {app.status === "pending" && (
            <>
              <button
                onClick={() => onApprove?.(app.id, "approve")}
                className="px-4 py-2 bg-green-600/90 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => onReject?.(app.id, "reject")}
                className="px-4 py-2 bg-red-600/90 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
              >
                <UserX className="h-4 w-4 mr-1" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {app.interests?.sort().map((interest, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-700 rounded-md text-xs text-slate-300"
              >
                {interest}
              </span>
            ))}
          </div>
          {app.other_interest && (
            <p className="mt-2 text-sm text-slate-300">
              Other: {app.other_interest}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">
            YouTube Channels
          </h4>
          <div className="space-y-2">
            {app.youtube_links?.map(
              (link, index) =>
                link && (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3 group-hover:bg-slate-700 transition-colors"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-400 hover:text-indigo-300 truncate max-w-full"
                    >
                      {link}
                    </a>
                  </div>
                )
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
        <span>Submitted: {new Date(app.created_at).toLocaleString()}</span>
        <span
          className={`px-2 py-1 rounded-full ${
            app.status === "pending"
              ? "bg-yellow-500/20 text-yellow-300"
              : app.status === "approved"
              ? "bg-green-500/20 text-green-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
        </span>
      </div>
    </div>
  );
};
