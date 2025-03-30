import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { navigationItems } from "../utils/navigationItems";
import { supabase } from "../lib/supabase";
import { getTypeIcon, NotificationItem } from "../utils/notifications";
import { formatRelativeTime, formatNumber } from "../utils/dateUtils";
import { clearNotifications, markAllAsRead } from "../utils/notificationUtils";
import {
  checkUserIfBanned,
  fecthUserRequest,
  handleSignOut,
} from "../utils/auth";
import {
  Settings,
  MessageSquare,
  Menu,
  Users as UsersIcon,
} from "lucide-react";
import OnboardingPopup from "../components/OnboardingPopup";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import ChannelManagement from "./features/ChannelManagement";
import BalanceSection from "./features/BalanceComponent";
import UsernameSetupModal from "../components/UsernameSetupModal";
import MonthlyGoals from "./features/GoalsComponent";
import BannedComponent from "./features/BannedComponent";
import { Announcements } from "./features/Announcement";
import Sidebar from "../components/SideBar";
import Messages from "./Messages";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { SettingsDropdown } from "../components/SettingsDropdown";
import { DashboardCards } from "../components/DashboardCards";
import { RealtimePerformance } from "../components/RealtimePerformance";
import { RecentActivity } from "../components/RecentActivity";
import { PerformanceTrends } from "../components/PerformanceTrends";
import { RejectedApplication } from "../components/RejectedApplication";
import {
  generateSampleActivity,
  generateSampleGoals,
  generatePerformanceData,
  generateRealtimeViews,
  fetchDashboardStats,
} from "../utils/dashboardUtils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ActivityItem {
  id: string;
  type: "view" | "subscriber" | "revenue" | "milestone";
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    amount?: number;
    trend?: "up" | "down";
    percentage?: number;
  };
}

interface GoalProgress {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export default function Dashboard() {
  const { user, signOut, showOnboarding, setShowOnboarding } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [monthlyViews, setMonthlyViews] = useState(0);
  const [linkedChannels, setLinkedChannels] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [isRejected, setIsRejected] = useState(false);
  const [hasChanel, setHasChanel] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [notificationType, setNotificationType] = useState("info");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notifNumber, setNotifNumber] = useState<any>(0);
  const [isBanned, setIsBanned] = useState(false);
  const [showMessages, setShowMessage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  );
  const [username, setUsername] = useState(
    user?.user_metadata?.username || null
  );
  const [showUsernameModal, setShowUsernameModal] = useState(
    username == "" || username == null
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [realtimeViews, setRealtimeViews] = useState({
    current: 0,
    last24h: 0,
    last48h: 0,
  });
  const [performanceData, setPerformanceData] = useState({
    labels: [] as string[],
    views: [] as number[],
    engagement: [] as number[],
    revenue: [] as number[],
  });
  const getNotifNumber = async () => {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact" }) // Correct way to count rows in Supabase
        .eq("read", false)
        .eq("user_id", user?.id);

      if (error) throw error;

      console.log("Unread notifications:", count);
      return count; // Return the count if needed elsewhere
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return 0; // Return 0 in case of an error
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setUploadingImage(true);

      // Upload image to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `/${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      setProfileImage(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    setRecentActivity(generateSampleActivity());
    setGoals(generateSampleGoals());
    setPerformanceData(generatePerformanceData());
    setRealtimeViews(generateRealtimeViews());

    const fetchStats = async () => {
      if (!hasChanel || !user.id) return;
      const stats = await fetchDashboardStats(supabase, user.id);
      setMonthlyViews(stats.monthlyViews);
      setLinkedChannels(stats.linkedChannels);
    };

    fetchStats();

    const interval = setInterval(fetchStats, 3600000);
    return () => clearInterval(interval);
  }, [user]);

  // Effect to fetch and subscribe to notifications
  const handleNotifications = (payload) => {
    const notif = payload.new;
    if (notif?.user_id === user?.id) {
      const { content, title, type } = notif;
      console.log({ content, title, type });
      setNotification({ content, title, type });
      setNotificationType(type);
      setIsVisible(true);
    }
  };
  useEffect(() => {
    let timer;
    if (isVisible) {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isVisible]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(
        data.map((notification) => ({
          id: notification.id,
          title: notification.title,
          content: notification.content,
          time: formatRelativeTime(notification.created_at),
          read: notification.read,
        }))
      );
    };

    fetchNotifications();
    getNotifNumber().then((res) => {
      setNotifNumber(res);
    });

    // Subscribe to notifications
    const notificationSubscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        handleNotifications
      )
      .subscribe();

    // Subscribe to ban status changes
    const banSubscription = supabase
      .channel("ban")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ban" },
        async (payload) => {
          console.log("Ban change received!", payload);
          if (payload.eventType == "INSERT") {
            if (payload.new.user_id == user?.id) {
              setIsBanned(true);
            }
          } else if (payload.eventType === "DELETE") {
            const deletedBanId = payload.old.id;

            // Query the ban table to get the user_id associated with the deleted ban

            const { data, error } = await supabase
              .from("ban")
              .select("*")
              .eq("user_id", user?.id);

            if (error) {
              console.error("Error fetching user_id for deleted ban:", error);
              return;
            }

            if (data.length == 0) {
              setIsBanned(false); // Update state to reflect the unban
            }
          }
        }
      )

      .subscribe();

    // Cleanup subscriptions
    return () => {
      notificationSubscription.unsubscribe();
      banSubscription.unsubscribe();
    };
  }, [user]);

  // Effect to check for unread messages
  useEffect(() => {
    if (!user) return;

    const checkUnreadMessages = async () => {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("receiver_id", user.id)
        .is("read_at", null);

      if (error) {
        console.error("Error checking unread messages:", error);
        return;
      }

      setHasUnreadMessages(messages && messages.length > 0);
    };

    checkUnreadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          checkUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Effect to handle notification animation
  useEffect(() => {
    if (notifications.some((n) => !n.read)) {
      setHasNewNotification(true);
      // Reset the animation after it plays
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".notifications-dropdown") &&
        !target.closest(".notifications-button")
      ) {
        setShowNotifications(false);
      }
      if (
        !target.closest(".settings-dropdown") &&
        !target.closest(".settings-button")
      ) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.role === "admin") {
      navigate("/purple");
      setIsLoading(false);
      return;
    } else if (user) {
      checkUserIfBanned(supabase, user, setIsBanned);
      fecthUserRequest(supabase, user?.id)
        .then((res) => {
          console.log(res);
          if (res.length == 0) {
            setShowOnboarding(true);
            setIsLoading(false);
            return;
          }
          if (res[0].status === "pending") {
            const popup = document.createElement("div");
            popup.className =
              "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900";
            popup.innerHTML = `
        <div class="bg-slate-800 rounded-xl p-12 max-w-xl w-full text-center shadow-2xl border-2 border-indigo-500/20">
          <div class="w-20 h-20 mx-auto mb-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
            <svg class="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-3xl font-bold text-white mb-6">Application Submitted</h3>
          <div class="mb-8">
            <div class="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden shadow-lg" style="background-size: 200% 100%; animation: gradient-wave 3s ease infinite;">
              Pending
            </div>
          </div>
          <p class="text-slate-300 text-lg mb-4">Your application is under review.</p>
          <p class="text-slate-400">You will be automatically redirected to your dashboard once your application is approved.</p>
        </div>
      `;
            document.body.appendChild(popup);
          }
          if (res[0].status == "approved") {
            setHasChanel(true);
          }
          if (res[0].status == "rejected") {
            setReason(res[0]?.rejection_reason);
            setIsRejected(true);
            setIsLoading(false);
          }
          setIsLoading(false);
        })

        .catch((err) => {
          console.log(err);
        });
    }
  }, [user, setShowOnboarding]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
          <span className="text-white text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (isRejected) {
    return (
      <RejectedApplication
        reason={reason}
        handleSignOut={() => {
          handleSignOut(supabase, isRejected, user?.id, signOut);
        }}
        supabase={supabase}
        isRejected={isRejected}
        userId={user?.id}
        signOut={signOut}
      />
    );
  }

  if (isBanned && !isLoading) {
    return <BannedComponent handleSignOut={signOut} />;
  }
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {showMessages && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            // Close messages if clicking outside the messages container
            if (e.target === e.currentTarget) {
              setShowMessage(false);
            }
          }}
        >
          <div className="w-full h-full max-w-4xl rounded-lg shadow-xl overflow-auto">
            <Messages />
          </div>
        </div>
      )}
      <UsernameSetupModal
        setDashboardUsername={setUsername}
        isOpen={showUsernameModal}
        onClose={() => {
          setShowUsernameModal(false);
          setShowTutorial(true);
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-slate-500/5 pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      {/* Onboarding Popup */}
      {isVisible && notification && (
        <NotificationItem
          notification={notification}
          notificationType={notificationType}
        />
      )}
      {showOnboarding && user && (
        <OnboardingPopup
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userId={user.id}
          userEmail={user.email || ""}
        />
      )}

      {/* Sidebar for desktop */}
      {!showOnboarding && (
        <Sidebar
          user={user}
          username={username}
          profileImage={profileImage}
          uploadingImage={uploadingImage}
          handleImageUpload={handleImageUpload}
          navigationItems={navigationItems}
          setActiveSection={setActiveSection}
          showTuto={showTutorial}
        />
      )}

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-slate-800 pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1">
          <div className="py-6">
            {/* Background gradient effects */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-8">
              <div className="flex items-center justify-between">
                <h1
                  onMouseEnter={() => {
                    setShowNotifications(false);
                    setShowSettings(false);
                  }}
                  className="text-2xl font-semibold text-white w-full"
                >
                  {activeSection === "overview"
                    ? "Dashboard"
                    : activeSection === "channels"
                    ? "Channel Management"
                    : activeSection === "analytics"
                    ? "Analytics"
                    : activeSection === "rights"
                    ? "Digital Rights"
                    : activeSection === "music"
                    ? "Music Library"
                    : activeSection === "balance"
                    ? "Balance & Earnings"
                    : "Global Distribution"}
                </h1>
                <div className="flex items-center relative z-50">
                  {/* Added relative positioning and z-50 */}
                  <NotificationDropdown
                    showNotifications={showNotifications}
                    setShowNotifications={setShowNotifications}
                    notifications={notifications}
                    notifNumber={notifNumber}
                    supabase={supabase}
                    userId={user?.id}
                    setHasNewNotification={setHasNewNotification}
                    setNotifications={setNotifications}
                    setNotifNumber={setNotifNumber}
                    setShowSettings={setShowSettings}
                    markAllAsRead={() => {
                      markAllAsRead(supabase, user?.id, {
                        setHasNewNotification,
                        setNotifications,
                        setNotifNumber,
                      });
                    }}
                    clearNotifications={() => {
                      clearNotifications(supabase, user?.id, {
                        setHasNewNotification,
                        setNotifications,
                        setNotifNumber,
                      });
                    }}
                  />
                  <div
                    className="settings-button p-2 mr-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 relative"
                    onMouseEnter={() => {
                      setShowNotifications(false);
                    }}
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setShowNotifications(false);
                    }}
                  >
                    <Settings className="h-6 w-6" />

                    {/* Settings Dropdown */}
                    {showSettings && (
                      <SettingsDropdown
                        user={user}
                        handleSignOut={handleSignOut}
                        supabase={supabase}
                        isRejected={isRejected}
                        signOut={signOut}
                      />
                    )}
                  </div>
                  <button
                    onMouseEnter={() => {
                      setShowNotifications(false);
                      setShowSettings(false);
                    }}
                    onClick={() => {
                      setShowMessage((prev) => !prev);
                    }}
                    className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 hover:scale-110"
                  >
                    <MessageSquare
                      className={`h-6 w-6 transition-all duration-300 ${
                        hasUnreadMessages
                          ? "text-white animate-pulse filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                          : "text-slate-400"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              {activeSection === "overview" && (
                <>
                  <DashboardCards
                    linkedChannels={linkedChannels}
                    monthlyViews={monthlyViews}
                  />
                  <div className=" grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 relative z-[1]">
                    <Announcements />
                    <RealtimePerformance realtimeViews={realtimeViews} />
                    <MonthlyGoals user={user} />
                    <RecentActivity recentActivity={recentActivity} />
                    <PerformanceTrends performanceData={performanceData} />
                  </div>
                </>
              )}

              {activeSection == "channels" && <ChannelManagement />}
              {activeSection == "balance" && <BalanceSection />}
              {activeSection !== "overview" &&
                activeSection !== "channels" &&
                activeSection !== "balance" && (
                  <div className="bg-slate-800 rounded-xl p-12 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Coming Soon
                    </h3>
                    <p className="text-slate-400">
                      This section is currently under development
                    </p>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
