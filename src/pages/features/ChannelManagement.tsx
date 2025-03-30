import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  ArrowLeft,
  Play,
  RefreshCw,
  Settings,
  TrendingUp,
  Eye,
  ChevronRight,
  Youtube,
  ExternalLink,
  BarChart2,
  User,
  Plus,
  Clock,
  XCircle,
} from "lucide-react";
import NewChannelPopup from "../../components/AddNewChannel";

interface Channel {
  url: string;
  views: number;
  monthlyViews: number;
  subscribers: number;
  growth: number;
  status?: string;
}

export default function ChannelManagement() {
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const fetchChannels = async () => {
    try {
      // Get user's linked channels
      const { data: requestData, error: requestError } = await supabase
        .from("user_requests")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("requestData from user_requests:", requestData);
      if (requestError) throw requestError;

      // Then get additional channels from channels table
      const { data: channelsData, error: channelsError } = await supabase
        .from("channels")
        .select("*")
        .eq("user_id", user.id);

      console.log("channelsData from channels:", channelsData);
      if (channelsError) throw channelsError;

      if (
        !requestData?.youtube_links?.length &&
        (!channelsData || channelsData.length === 0)
      ) {
        setError("No channels linked to your account");
      }

      if (!requestData[0]?.user_requests.youtube_links?.length) {
        setError("No channels linked to your account");
      }

      // Get views data for each channel
      const { data: viewsData, error: viewsError } = await supabase
        .from("channel_views")
        .select("*")
        .eq("user_id", user.id)
        .order("month", { ascending: false });

      if (viewsError) throw viewsError;

      // Transform data
      let mainChannel = (requestData.youtube_links || []).map((url: string) => {
        console.log("url from main channel ", requestData?.youtube_links);
        const channelViews =
          viewsData?.filter((v) => v.channel_id === url) || [];
        const currentMonthViews = channelViews[0]?.views || 0;
        const lastMonthViews = channelViews[1]?.views || 0;
        const growth = lastMonthViews
          ? ((currentMonthViews - lastMonthViews) / lastMonthViews) * 100
          : 0;
        return {
          url,
          views: channelViews.reduce((sum, v) => sum + v.views, 0),
          monthlyViews: currentMonthViews,
          subscribers: Math.floor(Math.random() * 1000000), // Mock data
          growth,
          status: "approved",
        };
      });
      let otherChannels = (channelsData || []).map((data: any) => {
        const url = data?.link;
        const channelViews =
          viewsData?.filter((v) => v.channel_id === url) || [];
        const currentMonthViews = channelViews[0]?.views || 0;
        const lastMonthViews = channelViews[1]?.views || 0;
        const growth = lastMonthViews
          ? ((currentMonthViews - lastMonthViews) / lastMonthViews) * 100
          : 0;
        return {
          url,
          views: channelViews.reduce((sum, v) => sum + v.views, 0),
          monthlyViews: currentMonthViews,
          subscribers: Math.floor(Math.random() * 1000000), // Mock data
          growth,
          status: data.status,
        };
      });
      setChannels([...mainChannel, ...otherChannels]);
    } catch (error) {
      console.error("Error fetching channels:", error);
      setError("Failed to load channel data");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!user) return;

    fetchChannels();
  }, [user]);

  const handleAddChannel = async () => {
    if (!newChannelUrl || !user) return;

    try {
      setIsLoading(true);

      // Get current channel links
      const { data: userData, error: fetchError } = await supabase
        .from("user_requests")
        .select("youtube_links")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentLinks = userData?.youtube_links || [];
      const updatedLinks = [...currentLinks, newChannelUrl];

      // Update with new channel
      const { error: updateError } = await supabase
        .from("user_requests")
        .update({ youtube_links: updatedLinks })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Reset and reload
      setNewChannelUrl("");
      setShowAddChannelModal(false);
      fetchChannels();
    } catch (error) {
      console.error("Error adding channel:", error);
      setError("Failed to add channel");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-slate-300">Loading your channels...</p>
        </div>
      </div>
    );
  }

  if (error && channels.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        {showAddChannelModal && (
          <NewChannelPopup
            loadChannels={fetchChannels}
            type="main"
            isOpen={showAddChannelModal}
            onClose={() => {
              setShowAddChannelModal(false);
            }}
            userEmail={user?.email || ""}
            userId={user?.id || ""}
          />
        )}
        <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <Youtube className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{error}</h3>
          <p className="text-slate-400 mb-6">
            Please link your YouTube channels through the onboarding process to
            view analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                fetchChannels();
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors inline-flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddChannelModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col space-y-6">
          {/* Channels List Section */}
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Your Channels
              </h2>
              <div className="flex space-x-3">
                <button
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  onClick={() => {
                    setIsLoading(true);
                    fetchChannels();
                  }}
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
                  onClick={() => setShowAddChannelModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Channel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channels.map((channel) => (
                <button
                  key={channel.url}
                  onClick={() => setSelectedChannel(channel)}
                  className={`p-4 rounded-xl transition-all duration-300 text-left ${
                    selectedChannel?.url === channel.url
                      ? "bg-indigo-600 shadow-lg shadow-indigo-500/20"
                      : "bg-slate-700/50 hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                      <Youtube className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <p className="text-white font-medium truncate">
                        {channel.url.replace(
                          /^https?:\/\/(www\.)?(youtube\.com\/|youtu\.be\/)/,
                          ""
                        )}
                      </p>
                      <p className="text-sm text-slate-400">
                        {channel.monthlyViews.toLocaleString()} views this month
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Channel Analytics - Only shown when a channel is selected */}
          {selectedChannel?.status == "approved" ? (
            <div className="space-y-6">
              {/* Channel Header */}
              <div className="bg-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-600/20 flex items-center justify-center">
                      <Youtube className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-semibold text-white">
                        {selectedChannel.url.replace(
                          /^https?:\/\/(www\.)?(youtube\.com\/|youtu\.be\/)/,
                          ""
                        )}
                      </h2>
                      <a
                        href={selectedChannel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center mt-1"
                      >
                        View Channel
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700/80 transition-colors">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-500/20">
                      <Eye className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-slate-400">Total Views</p>
                      <p className="text-2xl font-semibold text-white">
                        {selectedChannel.views.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700/80 transition-colors">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-500/20">
                      <BarChart2 className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-slate-400">Monthly Views</p>
                      <p className="text-2xl font-semibold text-white">
                        {selectedChannel.monthlyViews.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700/80 transition-colors">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-500/20">
                      <User className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-slate-400">Subscribers</p>
                      <p className="text-2xl font-semibold text-white">
                        {selectedChannel.subscribers.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700/80 transition-colors">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-500/20">
                      <TrendingUp className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-slate-400">Growth</p>
                      <p className="text-2xl font-semibold text-white">
                        {selectedChannel.growth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Chart */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Views Over Time
                </h3>
                <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-700/50 rounded-lg">
                  <p className="text-center">
                    <span className="block text-lg mb-2">
                      📊 Analytics Coming Soon
                    </span>
                    <span className="text-sm text-slate-500">
                      Detailed channel analytics will be available here
                    </span>
                  </p>
                </div>
              </div>

              {/* Recent Videos */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Videos
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center">
                        <Play className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-white font-medium">
                          Video Title {i + 1}
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">
                          {Math.floor(Math.random() * 10000).toLocaleString()}{" "}
                          views • {Math.floor(Math.random() * 24)} hours ago
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedChannel?.status === "pending" ? (
            <div className="bg-slate-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Channel Pending Approval
              </h3>
              <p className="text-slate-400 mb-6">
                Your channel is currently under review. This process typically
                takes 24-48 hours.
              </p>
              <div className="flex justify-center">
                <a
                  href={selectedChannel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center"
                >
                  View Channel <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          ) : selectedChannel?.status === "rejected" ? (
            <div className="bg-slate-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Channel Not Approved
              </h3>
              <p className="text-slate-400 mb-6">
                Unfortunately, this channel doesn't meet our requirements.
                Please ensure your channel follows our guidelines.
              </p>
              <div className="flex flex-col items-center gap-4">
                <a
                  href={selectedChannel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-400 hover:text-red-300 flex items-center"
                >
                  View Channel <ExternalLink className="h-4 w-4 ml-1" />
                </a>
                <button
                  onClick={() => setShowAddChannelModal(true)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Try Another Channel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <Youtube className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Channel Selected
              </h3>
              <p className="text-slate-400">
                Select a channel from the list above to view its analytics
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Channel Modal */}
      {showAddChannelModal && (
        <NewChannelPopup
          isOpen={showAddChannelModal}
          onClose={() => {
            setShowAddChannelModal(false);
          }}
          userEmail={user?.email || ""}
          userId={user?.id || ""}
        />
      )}
    </div>
  );
}
