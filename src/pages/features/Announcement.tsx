import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);

        // Fetch announcements from Supabase
        const { data, error } = await supabase
          .from("announcements")
          .select("")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;

        setAnnouncements(data || []);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("public:announcements")
      .on(
        "postgres_changes",
        {
          event: "",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // If there are no announcements, don't render anything
  if (announcements.length === 0) return null;

  return (
    <div className="col-span-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
      <div className="flex items-center mb-3">
        <svg
          className="w-5 h-5 text-yellow-400 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
            clipRule="evenodd"
          />
        </svg>
        <h2 className="text-lg font-semibold text-white">Announcements</h2>
      </div>

      {loading ? (
        <div className="p-3 text-gray-400">Loading announcements...</div>
      ) : error ? (
        <div className="p-3 text-red-400">{error}</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-3 bg-gray-700/50 rounded border-l-4 border-yellow-500"
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-white">{announcement.title}</h3>
                <span className="text-xs text-gray-400">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-gray-300">{announcement.content}</p>

              {announcement.action_link && (
                <a
                  href={announcement.action_link}
                  className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
                >
                  {announcement.action_text || "Learn more"} →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
