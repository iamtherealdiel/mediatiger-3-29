import { SupabaseClient } from '@supabase/supabase-js';

export interface ActivityItem {
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

export interface GoalProgress {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export const generateSampleActivity = (): ActivityItem[] => [
  {
    id: "1",
    type: "view",
    title: "Viewership Spike",
    description: 'Your channel "Gaming Adventures" saw a 25% increase in views',
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

export const generateSampleGoals = (): GoalProgress[] => [
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

export const generatePerformanceData = () => {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const generateTrendData = () =>
    Array.from({ length: 30 }, () => Math.floor(Math.random() * 100000) + 50000);

  const views = generateTrendData();
  return {
    labels: last30Days,
    views,
    engagement: views.map((n) => n * 0.1),
    revenue: views.map((n) => n * 0.01),
  };
};

export const generateRealtimeViews = () => ({
  current: Math.floor(Math.random() * 5000) + 1000,
  last24h: Math.floor(Math.random() * 100000) + 50000,
  last48h: Math.floor(Math.random() * 150000) + 75000,
});

export const fetchDashboardStats = async (
  supabase: SupabaseClient,
  userId: string
) => {
  try {
    const { data: viewsData, error: viewsError } = await supabase.rpc(
      "get_total_monthly_views",
      {
        p_user_id: userId,
        p_month: new Date().toISOString().slice(0, 10),
      }
    );

    if (viewsError) throw viewsError;

    const { data: requestData, error: requestError } = await supabase
      .from("user_requests")
      .select("youtube_links")
      .eq("user_id", userId)
      .single();

    if (requestError) throw requestError;

    return {
      monthlyViews: viewsData || 0,
      linkedChannels: requestData?.youtube_links?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      monthlyViews: 0,
      linkedChannels: 0,
    };
  }
};