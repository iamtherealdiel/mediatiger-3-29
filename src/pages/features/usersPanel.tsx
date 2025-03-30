import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { BanIcon } from "lucide-react";

const UsersPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [banList, setBanList] = useState<string[]>([]);
  // Updated to use filteredUsers for pagination
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) =>
      Object.values({
        username: user?.raw_user_meta_data?.username || "",
        email: user?.email || "",
        fullName: user?.raw_user_meta_data?.full_name || "",
      })
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);
  const getBanList = async () => {
    try {
      const { data, error } = await supabase.from("ban").select("user_id");

      if (error) {
        console.error("Error fetching ban list:", error);
        return;
      }

      // Extract user_ids from ban list data
      const bannedUserIds = data?.map((ban) => ban.user_id) || [];
      setBanList(bannedUserIds);
    } catch (error) {
      console.error("Error in getBanList:", error);
    }
  };
  useEffect(() => {
    getBanList();
  }, []);
  // Frontend pagination on filtered users
  const paginatedUsers = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_users");

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total pages based on filtered users
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  async function setBlockedRequest(selectedUser: any) {
    console.log("🚀 ~ setBlockedRequest ~ selectedUser:", selectedUser);

    try {
      // Update user in the frontend state

      // Check if user is already blocked
      const { data: existingBan } = await supabase
        .from("ban")
        .select("*")
        .eq("user_id", selectedUser.user_id)
        .single();

      if (existingBan) {
        // If user is blocked, delete the ban record
        const { error: deleteError } = await supabase
          .from("ban")
          .delete()
          .eq("user_id", selectedUser.user_id);

        if (deleteError) {
          console.error("Error removing ban:", deleteError);
          return;
        }
        setBanList(banList.filter((id) => id !== selectedUser.user_id));
      } else {
        // If user is not blocked, create a new ban record
        const { error: insertError } = await supabase
          .from("ban")
          .insert({ user_id: selectedUser.user_id });

        if (insertError) {
          console.error("Error creating ban:", insertError);
          return;
        }
        setBanList([...banList, selectedUser.user_id]);
      }

      // Refresh the users list to reflect changes
      await fetchUsers();
      await getBanList();
      // Update the selected user with the new data
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <>
      <div className="w-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-slate-700/50">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Search users..."
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-slate-400 mt-2">
              {filteredUsers.length} result
              {filteredUsers.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-700/50 divide-y divide-slate-600">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-slate-300"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-slate-300"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-600/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-600 text-slate-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={
                              user?.raw_user_meta_data?.avatar_url ||
                              "https://mellitahog.ly/en/wp-content/uploads/2021/09/randomUser.jpg"
                            }
                            alt="User avatar"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-200">
                            {user?.raw_user_meta_data?.username || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          banList.includes(user.user_id)
                            ? "bg-red-900/50 text-red-200"
                            : user?.raw_user_meta_data?.email_verified
                            ? "bg-emerald-900/50 text-emerald-200"
                            : "bg-slate-800/50 text-slate-300"
                        }`}
                      >
                        {banList.includes(user.user_id)
                          ? "Banned"
                          : user?.raw_user_meta_data?.email_verified
                          ? "Active"
                          : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="px-3 py-1 text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-600 transition-colors"
                        onClick={() => {
                          setSelectedUser(user);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-700/50 px-4 py-3 flex items-center justify-between border-t border-slate-600 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">
                Showing{" "}
                <span className="font-medium">{page * rowsPerPage + 1}</span> -{" "}
                <span className="font-medium">
                  {Math.min((page + 1) * rowsPerPage, filteredUsers.length)}
                </span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span>{" "}
                results
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="rounded-md border-slate-600 bg-slate-800 text-slate-200"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
              </select>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-2 py-1 border border-slate-600 rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-300">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="px-2 py-1 border border-slate-600 rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto p-4 bg-black/80 backdrop-blur-sm"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overscrollBehavior: "contain",
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800/95 rounded-xl p-8 shadow-2xl border border-slate-700 relative">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-slate-200">
                  User Details
                </h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-slate-700 overflow-hidden">
                    <img
                      src={
                        selectedUser.raw_user_meta_data?.avatar_url ||
                        "https://mellitahog.ly/en/wp-content/uploads/2021/09/randomUser.jpg"
                      }
                      alt="User avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-slate-200">
                      {selectedUser.raw_user_meta_data?.full_name || "N/A"}
                    </h3>
                    <p className="text-sm text-slate-400">
                      @{selectedUser.raw_user_meta_data?.username}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-700/30 rounded-lg backdrop-blur-sm">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">
                      Basic Information
                    </h4>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-400">Email:</span>{" "}
                        {selectedUser.email}
                      </p>
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-400">User ID:</span>{" "}
                        {selectedUser.user_id}
                      </p>
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-400">Role:</span>{" "}
                        {selectedUser.raw_app_meta_data?.role}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-700/30 rounded-lg backdrop-blur-sm">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">
                      Verification Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full mr-3 ${
                            selectedUser.raw_user_meta_data?.email_verified
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <span className="text-sm text-slate-300">
                          Email Verification
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full mr-3 ${
                            selectedUser.raw_user_meta_data?.phone_verified
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <span className="text-sm text-slate-300">
                          Phone Verification
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-700/30 rounded-lg backdrop-blur-sm">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">
                      Payment Information
                    </h4>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-400">Tipalti ID:</span>{" "}
                        {selectedUser.raw_user_meta_data?.tipalti_id || "N/A"}
                      </p>
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full mr-3 ${
                            selectedUser.raw_user_meta_data?.payment_enabled
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <span className="text-sm text-slate-300">
                          Payment Enabled
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-700/30 rounded-lg backdrop-blur-sm">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">
                      Account Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full mr-3 ${
                            selectedUser.raw_user_meta_data?.onboarding_complete
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        ></span>
                        <span className="text-sm text-slate-300">
                          Onboarding Status
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-400">Provider:</span>{" "}
                        {selectedUser.raw_app_meta_data?.provider}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-slate-300">
                          Block User
                        </span>
                        <button
                          className={`flex items-center gap-2 flew-row px-4 py-2 rounded-md text-sm font-medium ${
                            banList.includes(selectedUser.user_id)
                              ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                              : "bg-slate-600/50 text-slate-300 hover:bg-slate-600"
                          }`}
                          onClick={() => {
                            // Add your block user logic here
                            setBlockedRequest(selectedUser);
                            console.log("Block user clicked");
                          }}
                        >
                          {banList.includes(selectedUser.user_id)
                            ? "Unblock"
                            : "Block"}
                          <BanIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersPanel;
