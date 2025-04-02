import React, { useState } from "react";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";
import toast from "react-hot-toast";

interface ApplicationsTabProps {
  applicationFilter: string;
  setApplicationFilter: (filter: string) => void;
  loadApplications: () => void;
  isLoadingApplications: boolean;
  applications: ApplicationData[] | null;
  handleApplicationStatus: (
    id: string,
    status: "approved" | "rejected",
    reason?: string
  ) => void;
  handleReject: (id: string) => void;
  showRejectionModal: boolean;
  setShowRejectionModal: (show: boolean) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
}

type ApplicationData = {
  id: string;
  name: string;
  email: string;
  interests: string[];
  other_interest: string | null;
  youtube_links: string[];
  website: string | null;
  youtube_channel: string | null;
  status: string;
  created_at: string;
  verification_code: string;
  handleApplicationStatus: any;
};
export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  applicationFilter,
  setApplicationFilter,
  loadApplications,
  isLoadingApplications,
  applications,
  handleApplicationStatus,
  handleReject,
  showRejectionModal,
  setShowRejectionModal,
  rejectionReason,
  setRejectionReason,
}) => {
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    console.log("rejection popup");
    if (!selectedApplicationId) return;
    handleApplicationStatus(selectedApplicationId, "rejected", rejectionReason);
  };

  return (
    <div>
      <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-3 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400 mr-2" />
            Application Requests
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
        ) : !applications || applications.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No {applicationFilter} applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications?.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onApprove={(id) => handleApplicationStatus(id, "approved")}
                onReject={() => {
                  setSelectedApplicationId(app.id);
                  setShowRejectionModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Provide Rejection Reason
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32"
              placeholder="Enter reason for rejection..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectionSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
