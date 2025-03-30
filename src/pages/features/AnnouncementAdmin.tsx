// In your AdminDashboard.jsx or similar file

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_active: true,
    action_link: "",
    action_text: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
    } else {
      setAnnouncements(data || []);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("announcements").insert({
      ...formData,
      created_at: new Date().toISOString(),
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to create announcement");
    } else {
      fetchAnnouncements();
      setShowForm(false);
      setFormData({
        title: "",
        content: "",
        is_active: true,
        action_link: "",
        action_text: "",
      });
    }
  };

  const toggleAnnouncementStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating announcement:", error);
    } else {
      fetchAnnouncements();
    }
  };

  const deleteAnnouncement = async (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting announcement:", error);
      } else {
        fetchAnnouncements();
      }
    }
  };

  return (
    <div className="p-4 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Announcements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancel" : "Create New"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Action Link
            </label>
            <input
              type="url"
              name="action_link"
              value={formData.action_link}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Action Text
            </label>
            <input
              type="text"
              name="action_text"
              value={formData.action_text}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Learn more"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-slate-300">Active</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Announcement
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-slate-400">No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex justify-between"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-white">
                    {announcement.title}
                  </h3>
                  {announcement.is_active ? (
                    <span className="px-2 py-0.5 text-xs bg-emerald-900/50 text-emerald-200 rounded-full border border-emerald-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs bg-slate-800/50 text-slate-300 rounded-full border border-slate-600">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-1 text-slate-300 text-sm">
                  {announcement.content}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Created: {new Date(announcement.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    toggleAnnouncementStatus(
                      announcement.id,
                      announcement.is_active
                    )
                  }
                  className={`p-1 rounded ${
                    announcement.is_active
                      ? "text-yellow-400 hover:bg-yellow-900/20"
                      : "text-emerald-400 hover:bg-emerald-900/20"
                  }`}
                  title={announcement.is_active ? "Deactivate" : "Activate"}
                >
                  {announcement.is_active ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => deleteAnnouncement(announcement.id)}
                  className="p-1 text-red-400 rounded hover:bg-red-900/20"
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
