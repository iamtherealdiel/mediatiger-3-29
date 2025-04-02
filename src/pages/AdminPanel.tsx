import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  lookupUserBySecureId,
  isValidSecureId,
  getAccessLogs,
} from "../utils/adminService";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import UsersPanel from "./features/usersPanel";
import Messages from "./Messages";
import { AnnouncementManager } from "./features/AnnouncementAdmin";
import { AdminHeader } from "../components/admin/AdminHeader";
import { AdminTabs } from "../components/admin/AdminTabs";
import { ApplicationsTab } from "../components/admin/ApplicationsTab";
import { NotificationsTab } from "../components/admin/NotificationsTab";
import { YouTubeChannelsTab } from "../components/admin/YouTubeChannelsTab";
export const adminId = "26c83260-54f6-4dd4-bc65-d21e7e52632b";
import { handleApplicationStatus } from "../services/applicationService";
type UserLookupData = {
  id: string;
  email: string;
  created_at: string;
  user_metadata: Record<string, any>;
  last_sign_in_at: string | null;
  confirmed_at: string | null;
};

type AccessLogItem = {
  id: string;
  admin_id: string;
  accessed_user_id: string;
  accessed_at: string;
  access_reason: string | null;
  admin: { email: string } | null;
};

export default function AdminPanel() {
  const [secureId, setSecureId] = useState("");
  const [lookupReason, setLookupReason] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [userData, setUserData] = useState<UserLookupData | null>(null);
  const [userLookupError, setUserLookupError] = useState("");
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [channelsRequests, setChannelRequests] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState("applications");
  const [applications, setApplications] = useState<ApplicationData[] | null>(
    null
  );

  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationFilter, setApplicationFilter] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const { user, signOut, showOnboarding, setShowOnboarding } = useAuth();
  const { user: currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === "logs") {
      loadAccessLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "applications") {
      loadApplications();
    } else if (activeTab == "yt-channels") {
      loadRequests();
    }
  }, [activeTab, applicationFilter]);

  const loadApplications = async () => {
    console.log("working!");
    setIsLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from("admin_applications_view")
        .select("*")
        .eq("status", applicationFilter)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Error loading applications:", err);
      toast.error("Failed to load applications");
    } finally {
      setIsLoadingApplications(false);
    }
  };
  const loadRequests = async () => {
    setIsLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("status", applicationFilter);
      console.log(data);
      if (error) throw error;
      setChannelRequests(data || []);
    } catch (err) {
      console.error("Error loading applications:", err);
      toast.error("Failed to load applications");
    } finally {
      setIsLoadingApplications(false);
    }
  };
  /*  const handleApplicationStatus = async (
    id: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    try {
      if (activeTab == "applications") {
        const {
          data,
          error,
          status: reqStats,
          count,
        } = await supabase.rpc("update_application_status_with_admin", {
          admin_id: adminId, // First parameter
          application_id: id, // Second parameter
          new_status: status, // Third parameter
          reason: status === "rejected" ? reason : `Application ${status}`, // Fourth parameter
        });
        console.log("im here");
        if (error) throw error;
        console.log(data, reqStats, count);
        toast.success(`Application ${status} successfully`);
        setShowRejectionModal(false);
        setRejectionReason("");
        setSelectedApplicationId(null);
        loadApplications(); // Reload the applications list
      } else if (activeTab == "yt-channels") {
        await supabase
          .from("channels")
          .update({
            viewed_by: adminId, // First parameter
            status: status, // Third parameter
            reason: status === "rejected" ? reason : `Application ${status}`, // Fourth parameter
          })
          .eq("id", id);

        loadRequests();
        toast.success(`Channel request ${status} successfully`);
        setShowRejectionModal(false);
        setRejectionReason("");
        setSelectedApplicationId(null);
        loadApplications();
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      toast.error("Failed to update application status");
    }
  }; */

  const handleReject = (id: string) => {
    setSelectedApplicationId(id);
    setShowRejectionModal(true);
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    if (selectedApplicationId) {
      handleApplicationStatus(
        selectedApplicationId,
        "rejected",
        rejectionReason
      );
    }
  };

  const loadAccessLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await getAccessLogs();
      if (error) {
        toast.error(error);
      } else {
        setAccessLogs(data);
      }
    } catch (err) {
      console.error("Error loading access logs:", err);
      toast.error("Failed to load access logs");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Admin dashboard
  return (
    <div className="min-h-screen bg-slate-900 p-2 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminHeader handleSignOut={handleSignOut} />
        <div
          className={`bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden ${
            activeTab == "users" ? "min-h-[90vh]" : ""
          }`}
        >
          {/* Background gradient effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-slate-500/5"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl"></div>

          {/* Content */}
          <div className="relative z-10">
            <AdminTabs
              navigate={navigate}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Applications tab */}
            {activeTab === "applications" && (
              <ApplicationsTab
                handleApplicationStatus={(id, status, reason) => {
                  handleApplicationStatus({
                    id: id,
                    status: status,
                    adminId: adminId,
                    reason: reason ?? "rejected",
                    activeTab: activeTab,
                    onSuccess: {
                      loadApplications: loadApplications,
                      setRejectionReason: setRejectionReason,
                      setSelectedApplicationId: setSelectedApplicationId,
                      setShowRejectionModal: setShowRejectionModal,
                    },
                  });
                }}
                applicationFilter={applicationFilter}
                applications={applications}
                isLoadingApplications={isLoadingApplications}
                loadApplications={loadApplications}
                setApplicationFilter={setApplicationFilter}
                showRejectionModal={showRejectionModal}
                setRejectionReason={setRejectionReason}
                rejectionReason={rejectionReason}
                setShowRejectionModal={setShowRejectionModal}
              />
            )}

            {/* Notifications tab */}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "yt-channels" && (
              <YouTubeChannelsTab
                applicationFilter={applicationFilter}
                setApplicationFilter={setApplicationFilter}
                loadApplications={loadApplications}
                isLoadingApplications={isLoadingApplications}
                channelsRequests={channelsRequests}
                handleApplicationStatus={(id, status) => {
                  console.log(id, status);
                  //  handleApplicationStatus({id:})
                }}
                handleReject={handleReject}
              />
            )}
            {activeTab == "users" && <UsersPanel />}
            {activeTab == "messages" && <Messages />}
            {activeTab == "announcement" && <AnnouncementManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
