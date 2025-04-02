import React from "react";
import { FileSpreadsheet, RefreshCw, UserCheck, UserX } from "lucide-react";

interface YouTubeChannelsTabProps {
  applicationFilter: string;
  setApplicationFilter: (filter: string) => void;
  loadApplications: () => void;
  isLoadingApplications: boolean;
  channelsRequests: any[] | null;
  handleApplicationStatus: (
    id: string,
    status: "approved" | "rejected"
  ) => void;
  handleReject: (id: string) => void;
}

export const YouTubeChannelsTab: React.FC<YouTubeChannelsTabProps> = ({
  applicationFilter,
  setApplicationFilter,
  loadApplications,
  isLoadingApplications,
  channelsRequests,
  handleApplicationStatus,
  handleReject,
}) => {
  return (
    <div>
      <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-3 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400 mr-2" />
            Channels Requests
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={applicationFilter}
              onChange={(e) => setApplicationFilter(e.target.value)}
              className="flex-1 md:flex-none bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors hover:border-indigo-500/50"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={loadApplications}
              disabled={isLoadingApplications}
              className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  isLoadingApplications ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {isLoadingApplications ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading applications...</p>
          </div>
        ) : !channelsRequests || channelsRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No {applicationFilter} applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {channelsRequests?.map((app) => (
              <ChannelCard
                key={app.id}
                app={app}
                handleApplicationStatus={handleApplicationStatus}
                handleReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ChannelCardProps {
  app: any;
  handleApplicationStatus: (
    id: string,
    status: "approved" | "rejected"
  ) => void;
  handleReject: (id: string) => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  app,
  handleApplicationStatus,
  handleReject,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 group">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">
            {app.channel_name ||
              (app.link &&
                app.link.replace(
                  /^(https?:\/\/)?(www\.)?(youtube\.com\/channel\/|youtube\.com\/c\/|youtube\.com\/@)?/,
                  ""
                ))}
          </h3>
          <p className="text-slate-400">{app.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {app.status === "pending" && (
            <>
              <button
                onClick={() => handleApplicationStatus(app.id, "approved")}
                className="px-4 py-2 bg-green-600/90 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Approve
              </button>
              <button
                className="px-4 py-2 bg-red-600/90 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
                onClick={() => handleReject(app.id)}
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
            {app.interests?.sort().map((interest: string, index: number) => (
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
              (link: string, index: number) =>
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
