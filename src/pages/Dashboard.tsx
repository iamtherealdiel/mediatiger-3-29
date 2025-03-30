import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { createPortal } from "react-dom";
import { formatRelativeTime, formatNumber } from "../utils/dateUtils";
import {
  LogOut,
  Settings,
  User,
  Eye,
  MessageSquare,
  Bell,
  BarChart3,
  Play,
  Shield,
  Globe,
  Menu,
  X,
  UserCircle,
  Mail,
  Calendar,
  Clock,
  Youtube,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Activity,
  Target,
  LineChart,
  TrendingDown,
  Award,
  Users as UsersIcon,
  ThumbsUp,
  DollarSign,
  Music,
  Wallet,
} from "lucide-react";
import OnboardingPopup from "../components/OnboardingPopup";
import Swal from "sweetalert2";
import { Line } from "react-chartjs-2";
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

interface Channel {
  url: string;
  views: number;
  monthlyViews: number;
  subscribers: number;
  growth: number;
}

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

    // Generate sample activity data
    const sampleActivity: ActivityItem[] = [
      {
        id: "1",
        type: "view",
        title: "Viewership Spike",
        description:
          'Your channel "Gaming Adventures" saw a 25% increase in views',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        metadata: { amount: 25, trend: "up" },
      },
      {
        id: "2",
        type: "subscriber",
        title: "New Subscriber Milestone",
        description: "You've reached 100K subscribers!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        metadata: { amount: 100000 },
      },
      {
        id: "3",
        type: "revenue",
        title: "Revenue Update",
        description: "Monthly revenue increased by 15%",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        metadata: { amount: 15, trend: "up" },
      },
      {
        id: "4",
        type: "milestone",
        title: "Achievement Unlocked",
        description: "Your video reached 1M views",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
    ];
    setRecentActivity(sampleActivity);

    // Set sample goals
    const sampleGoals: GoalProgress[] = [
      {
        id: "1",
        title: "Monthly Views",
        current: 850000,
        target: 1000000,
        unit: "views",
        color: "indigo",
      },
      {
        id: "2",
        title: "Subscriber Growth",
        current: 75000,
        target: 100000,
        unit: "subscribers",
        color: "purple",
      },
      {
        id: "3",
        title: "Revenue Target",
        current: 8500,
        target: 10000,
        unit: "USD",
        color: "green",
      },
    ];
    setGoals(sampleGoals);

    // Generate sample performance data
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    const generateTrendData = () =>
      Array.from(
        { length: 30 },
        () => Math.floor(Math.random() * 100000) + 50000
      );

    setPerformanceData({
      labels: last30Days,
      views: generateTrendData(),
      engagement: generateTrendData().map((n) => n * 0.1),
      revenue: generateTrendData().map((n) => n * 0.01),
    });

    // Set sample realtime views
    setRealtimeViews({
      current: Math.floor(Math.random() * 5000) + 1000,
      last24h: Math.floor(Math.random() * 100000) + 50000,
      last48h: Math.floor(Math.random() * 150000) + 75000,
    });

    const fetchStats = async () => {
      if (!hasChanel) return;
      try {
        // Get current month's views
        const { data: viewsData, error: viewsError } = await supabase.rpc(
          "get_total_monthly_views",
          {
            p_user_id: user.id,
            p_month: new Date().toISOString().slice(0, 10),
          }
        );

        if (viewsError) throw viewsError;
        setMonthlyViews(viewsData || 0);

        // Get linked channels count
        const { data: requestData, error: requestError } = await supabase
          .from("user_requests")
          .select("youtube_links")
          .eq("user_id", user.id)
          .single();

        if (requestError) throw requestError;
        setLinkedChannels(requestData?.youtube_links?.length || 0);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();

    // Set up interval to check stats every hour
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
  const getTypeIcon = (type) => {
    switch (type) {
      case "success":
        return (
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
    }
  };
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

  const handleSignOut = async () => {
    try {
      if (isRejected) {
        supabase
          .rpc("delete_user_request", { request_id: user?.id })
          .then(({ data, error }) => {
            if (error) {
              console.error("Error deleting user request:", error);
            } else {
              console.log("User request deleted successfully:", data);
            }
          });
      }
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const clearNotifications = () => {
    // Update notifications as read in database
    if (!user) return;

    const updateNotifications = async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error clearing notifications:", error);
        return;
      }

      setNotifications([]);
      setHasNewNotification(false);
    };

    updateNotifications();
  };

  const markAllAsRead = () => {
    // Mark all notifications as read in database
    try {
      if (!user) return;

      const updateNotifications = async () => {
        const { data, error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user.id);
        console.log("data ", data);
        console.log("error ", error);
        if (error) {
          console.error("Error marking notifications as read:", error);
          return;
        }
        setNotifNumber(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setHasNewNotification(false);
      };

      updateNotifications();
    } catch (error) {
      console.log("Error", error);
    }
  };

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
    const fecthUserRequest = async (userId: string) => {
      const { data: requestData, error: requestError } = await supabase
        .from("user_requests")
        .select("status,rejection_reason")
        .eq("user_id", userId);

      if (requestError) {
        console.error("Error fetching user requests:", requestError);
        throw requestError;
      }

      return requestData;
    };
    const checkUserIfBanned = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("ban")
          .select("user_id")
          .eq("user_id", user?.id);

        if (error) {
          console.error("Error fetching ban list:", error);
          return;
        }

        setIsBanned(data.length !== 0);
      } catch (error) {
        console.error("Error in getBanList:", error);
      }
    };
    if (user?.user_metadata?.role === "admin") {
      navigate("/purple");
      setIsLoading(false);
      return;
    } else if (user) {
      checkUserIfBanned();
      fecthUserRequest(user?.id)
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

  const navigationItems = [
    {
      name: "Overview",
      section: "overview",
      icon: <Eye className="h-5 w-5" />,
      stepNumber: 1,
    },
    {
      name: "Analytics",
      section: "analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: "Channel Management",
      section: "channels",
      icon: <Play className="h-5 w-5" />,
    },
    {
      name: "Music",
      section: "music",
      icon: <Music className="h-5 w-5" />,
    },
    {
      name: "Balance",
      section: "balance",
      icon: <Wallet className="h-5 w-5" />,
    },
  ];

  const userStats = {
    joinDate: new Date(user?.created_at || Date.now()).toLocaleDateString(),
    lastLogin: new Date(
      user?.last_sign_in_at || Date.now()
    ).toLocaleDateString(),
    accountType: "Pro User",
    contentCount: 156,
  };

  const showNotification = (notification: any) => {
    Swal.fire({
      title: notification.title,
      text: notification.content,
      icon: "info",
      confirmButtonText: "Okay",
    });
  };

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-slate-800 rounded-xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-slate-800/50 to-red-500/5"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Application Rejected
            </h2>
            <p className="text-slate-300 mb-6">
              Unfortunately, your application has been rejected by admin.
            </p>
            {reason && (
              <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-white font-semibold mb-2">Reason:</h3>
                <ul className="text-slate-300 space-y-2 list-disc list-inside">
                  <li>{reason || "no reason"}</li>
                </ul>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleSignOut()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
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
        <div className="fixed top-2 left-0 right-0 mx-auto w-80 z-50 animate-slide-in">
          <div
            className="
            bg-gray-200/90 backdrop-blur-md
            p-3 rounded-2xl shadow-lg 
            border border-gray-300/40
          "
          >
            <div className="flex items-start">
              {getTypeIcon(notificationType)}
              <div className="ml-3 flex-1 pt-1">
                <div className="text-gray-800 font-semibold text-base">
                  {notification?.title}
                </div>
                <div className="text-gray-700 text-sm">
                  {notification?.content}
                </div>
              </div>
              <div className="text-gray-500 text-xs self-start pt-1">now</div>
            </div>
          </div>
        </div>
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
                  <div
                    className="notifications-button mx-2 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 relative"
                    data-popover-target="notifications-popover"
                  >
                    <Bell
                      onClick={() => {
                        setShowNotifications((prev) => !prev);
                        markAllAsRead();
                        setShowSettings(false); // Close settings when opening notifications
                      }}
                      className={`h-6 w-6 transition-all duration-300 ${
                        notifications.some((n) => !n.read)
                          ? "text-white animate-pulse filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                          : "text-slate-400"
                      }`}
                    />

                    {/* Notification Badge */}
                    {notifNumber > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] flex justify-center items-center">
                        {notifNumber > 9 ? "9+" : notifNumber}
                      </span>
                    )}

                    {/* Notifications Dropdown with Apple-style Animation */}
                    {showNotifications &&
                      createPortal(
                        <div
                          className="dropdown fixed top-16 right-6 w-96 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 transform transition-all duration-500 z-50"
                          style={{
                            animation:
                              "slide-in-right 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards",
                            opacity: 0,
                            transform: "translateX(20px)",
                          }}
                        >
                          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-white font-semibold">
                              Notifications
                            </h3>
                            <div className="flex gap-2">
                              <button className="text-xs text-slate-400 hover:text-white transition-colors">
                                Mark all as read
                              </button>
                              <button
                                onClick={clearNotifications}
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
                                  <h4 className="text-white font-medium">
                                    {notification.title}
                                  </h4>
                                  <p className="text-slate-400 text-sm mt-1">
                                    {notification.content}
                                  </p>
                                  <p className="text-slate-500 text-xs mt-2">
                                    {notification.time}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>,
                        document.body
                      )}

                    {/* Add this CSS to your global styles or component */}
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
                            <h4 className="text-white font-medium mb-3">
                              Security
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">
                                Two-Factor Authentication
                              </span>
                              <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                                Enable
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-slate-700 pt-4">
                            <h4 className="text-white font-medium mb-3">
                              Preferences
                            </h4>
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
                              onClick={handleSignOut}
                              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
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
                <div className="cards-dashboard grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 relative z-[1]">
                  {/* Views Card */}
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-indigo-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-indigo-500/5 opacity-50"></div>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                        <Eye className="h-8 w-8 text-indigo-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-400">
                          {new Date().toLocaleString("default", {
                            month: "long",
                          })}{" "}
                          Views
                        </p>
                        <p className="text-2xl font-semibold text-white">
                          {monthlyViews.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Channels Card */}
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-green-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-green-500/5 opacity-50"></div>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
                        <Play className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-400">
                          Active Channels
                        </p>
                        <p className="text-2xl font-semibold text-white">
                          {linkedChannels}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rights Card */}
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-purple-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-purple-500/5 opacity-50"></div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                        <Shield className="h-8 w-8 text-purple-500" />
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-400">
                          Revenue
                        </p>
                        <p className="text-2xl font-semibold text-white whitespace-nowrap">
                          $156K
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Card */}
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-blue-500/10 transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 opacity-50"></div>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                        <Globe className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-400">
                          Global Reach
                        </p>
                        <p className="text-2xl font-semibold text-white">48M</p>
                      </div>
                    </div>
                  </div>
                  <Announcements />
                  {/* Realtime Views Section */}
                  <div className="col-span-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Activity className="h-5 w-5 text-indigo-400 mr-2 animate-pulse" />
                      Realtime Performance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="realtime-card wave-animation bg-gradient-to-br from-slate-700/50 via-slate-700/40 to-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">Current Views</span>
                          <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(realtimeViews.current)}
                        </p>
                        <p className="text-sm text-slate-400">
                          Active viewers right now
                        </p>
                      </div>
                      <div className="realtime-card wave-animation bg-gradient-to-br from-slate-700/50 via-slate-700/40 to-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">Last 24 Hours</span>
                          <Eye className="h-4 w-4 text-green-400 animate-pulse" />
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(realtimeViews.last24h)}
                        </p>
                        <p className="text-sm text-slate-400">
                          Total views in past 24h
                        </p>
                      </div>
                      <div className="realtime-card wave-animation bg-gradient-to-br from-slate-700/50 via-slate-700/40 to-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">Last 48 Hours</span>
                          <BarChart2 className="h-4 w-4 text-blue-400 animate-pulse" />
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(realtimeViews.last48h)}
                        </p>
                        <p className="text-sm text-slate-400">
                          Total views in past 48h
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Goals Section */}
                  <MonthlyGoals user={user} />

                  {/* Activity Feed */}
                  <div className="col-span-full md:col-span-2 bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Activity className="h-5 w-5 text-indigo-400 mr-2" />
                      Recent Activity
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-slate-700/50 rounded-lg p-4 flex items-start space-x-4"
                        >
                          <div
                            className={`p-2 rounded-full ${
                              activity.type === "view"
                                ? "bg-blue-500/20"
                                : activity.type === "subscriber"
                                ? "bg-green-500/20"
                                : activity.type === "revenue"
                                ? "bg-purple-500/20"
                                : "bg-indigo-500/20"
                            }`}
                          >
                            {activity.type === "view" && (
                              <Eye className="h-5 w-5 text-blue-400" />
                            )}
                            {activity.type === "subscriber" && (
                              <UsersIcon className="h-5 w-5 text-green-400" />
                            )}
                            {activity.type === "revenue" && (
                              <DollarSign className="h-5 w-5 text-purple-400" />
                            )}
                            {activity.type === "milestone" && (
                              <Award className="h-5 w-5 text-indigo-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-white font-medium">
                                {activity.title}
                              </h4>
                              <span className="text-sm text-slate-400">
                                {formatRelativeTime(activity.timestamp)}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm mt-1">
                              {activity.description}
                            </p>
                            {activity.metadata?.trend && (
                              <div
                                className={`flex items-center mt-2 ${
                                  activity.metadata.trend === "up"
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {activity.metadata.trend === "up" ? (
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 mr-1" />
                                )}
                                <span className="text-sm">
                                  {activity.metadata.amount}%{" "}
                                  {activity.metadata.trend === "up"
                                    ? "increase"
                                    : "decrease"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Trends */}
                  <div className="col-span-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <LineChart className="h-5 w-5 text-indigo-400 mr-2" />
                      Performance Trends
                    </h3>
                    <div className="h-[300px] w-full">
                      <Line
                        data={{
                          labels: performanceData.labels,
                          datasets: [
                            {
                              label: "Views",
                              data: performanceData.views,
                              borderColor: "rgb(99, 102, 241)",
                              backgroundColor: "rgba(99, 102, 241, 0.1)",
                              tension: 0.4,
                              fill: true,
                            },
                            {
                              label: "Engagement Rate",
                              data: performanceData.engagement,
                              borderColor: "rgb(168, 85, 247)",
                              backgroundColor: "rgba(168, 85, 247, 0.1)",
                              tension: 0.4,
                              fill: true,
                            },
                            {
                              label: "Revenue",
                              data: performanceData.revenue,
                              borderColor: "rgb(34, 197, 94)",
                              backgroundColor: "rgba(34, 197, 94, 0.1)",
                              tension: 0.4,
                              fill: true,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            intersect: false,
                            mode: "index",
                          },
                          scales: {
                            y: {
                              grid: {
                                color: "rgba(148, 163, 184, 0.1)",
                              },
                              ticks: {
                                color: "rgb(148, 163, 184)",
                              },
                            },
                            x: {
                              grid: {
                                color: "rgba(148, 163, 184, 0.1)",
                              },
                              ticks: {
                                color: "rgb(148, 163, 184)",
                              },
                            },
                          },
                          plugins: {
                            legend: {
                              labels: {
                                color: "rgb(148, 163, 184)",
                              },
                            },
                            tooltip: {
                              backgroundColor: "rgba(30, 41, 59, 0.8)",
                              titleColor: "rgb(255, 255, 255)",
                              bodyColor: "rgb(148, 163, 184)",
                              borderColor: "rgba(148, 163, 184, 0.2)",
                              borderWidth: 1,
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
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
