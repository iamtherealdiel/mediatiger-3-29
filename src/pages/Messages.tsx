import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { adminId } from "./AdminPanel";
import { X } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add new state for users, selected user, and search
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const currentPath = location.pathname;
  const fetchUsers = async () => {
    if (!user || !isAdmin) return;

    try {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("*");
      if (usersError) throw usersError;

      const messageUserIds = [
        ...new Set(messages?.flatMap((m) => [m.sender_id, m.receiver_id])),
      ];

      const nonAdminUsers = allUsers.filter(
        (u) =>
          u.user_metadata?.role !== "admin" && messageUserIds.includes(u.id)
      );

      const usersWithMessages = nonAdminUsers.map((u) => {
        const lastMessage = messages?.find(
          (m) => m.sender_id === u.id || m.receiver_id === u.id
        );
        return {
          ...u,
          last_message: lastMessage?.content || "",
          last_message_time: lastMessage?.created_at || "",
        };
      });

      const sortedUsers = usersWithMessages.sort(
        (a, b) =>
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
      );

      setUsers(sortedUsers);
      if (!selectedUser && sortedUsers.length > 0) {
        setSelectedUser(sortedUsers[0]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    const loadAdminUser = async () => {
      if (!user) return;

      try {
        fetchUsers();
      } catch (error) {
        console.error("Error loading admin user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminUser();
  }, [user]);

  if (!user) return null;

  const isAdmin = user.user_metadata.role === "admin";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async () => {
    if (!user) return;

    try {
      let fileUrl = "";
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("message-images")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("message-images").getPublicUrl(filePath);

        fileUrl = publicUrl;
      }
      const { error } = await supabase.from("messages").insert([
        {
          sender_id: user.id,
          receiver_id: isAdmin ? selectedUser?.id : adminId,
          content: newMessage.trim(),
          image_url: fileUrl || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setNewMessage("");
      setSelectedFile(null);
      setIsModalOpen(false);
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const ImagePreview = () => {
    if (!previewImage) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute -top-4 -right-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      </div>
    );
  };

  const renderMessage = (message: any) => {
    const isCurrentUser = message.sender_id === user?.id;
    return (
      <div
        key={message.id}
        className={`flex ${
          isCurrentUser ? "justify-end" : "justify-start"
        } mb-4`}
      >
        <div
          className={`flex max-w-[70%] ${
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          } items-start gap-2`}
        >
          <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-indigo-400" />
          </div>
          <div
            className={`rounded-xl p-3 ${
              isCurrentUser
                ? "bg-indigo-500 text-white"
                : "bg-slate-700 text-slate-200"
            }`}
          >
            <p className="text-sm">{message.content}</p>
            {message.image_url && (
              <img
                src={message.image_url}
                alt="Message attachment"
                className="mt-2 max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setPreviewImage(message.image_url)}
              />
            )}
            <span className="text-xs opacity-50 mt-1 block">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          isAdmin && selectedUser
            ? `and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id})`
            : `and(sender_id.eq.${user.id},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter:
            isAdmin && selectedUser
              ? `(sender_id=eq.${selectedUser.id} AND receiver_id=eq.${user.id}) OR (sender_id=eq.${user.id} AND receiver_id=eq.${selectedUser.id})`
              : `(sender_id=eq.${user.id} AND receiver_id=eq.${adminId}) OR (sender_id=eq.${adminId} AND receiver_id=eq.${user.id})`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, selectedUser]);

  useEffect(() => {
    if (messages.length > 0) {
      const messageContainer = document.querySelector(".messages-container");
      if (messageContainer) {
        setTimeout(() => {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  if (isAdmin) {
    // Filter users based on search term
    const filteredUsers = users.filter(
      (u) =>
        u.id !== adminId &&
        (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div
        className={
          "bg-slate-700/30 backdrop-blur-sm rounded-xl p-3 md:p-6 mb-6"
        }
      >
        <ImagePreview />
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 flex h-[calc(100vh-8rem)]">
            {/* Users List Sidebar */}
            <div className="w-80 border-r border-slate-700/50">
              <div className="p-4 border-b border-slate-700/50 flex items-center">
                <h2 className="text-lg font-semibold text-white flex-1">
                  Users
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-700 text-white rounded-lg pl-8 pr-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(100%-4rem)]">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors ${
                      selectedUser?.id === u.id ? "bg-slate-700/50" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                        <MessageSquare className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {u.full_name || u.email}
                        </h3>
                        {u.last_message && (
                          <p className="text-xs text-slate-400 truncate mt-1">
                            {u.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    No users found
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                        <MessageSquare className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h1 className="text-lg font-semibold text-white">
                          {selectedUser.full_name || selectedUser.email}
                        </h1>
                        <p className="text-sm text-slate-400">Chat with user</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 messages-container">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages && messages.length > 0 ? (
                          messages.map((message) => renderMessage(message))
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            No messages yet with this user.
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ height: 1 }} ref={messagesEndRef}></div>
                  </div>

                  <div className="p-4 border-t border-slate-700/50">
                    <div className="flex gap-2">
                      <textarea
                        className="flex-1 bg-slate-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[60px]"
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            (newMessage.trim() || selectedFile)
                          ) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept="image/png, image/gif, image/jpeg"
                          onChange={handleFileSelect}
                        />
                        <label
                          htmlFor="file-upload"
                          className="w-[60px] h-[60px] flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors"
                        >
                          📎
                        </label>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() && !selectedFile}
                        className="w-[60px] h-[60px] bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                        ➤
                      </button>
                    </div>
                    {selectedFile && (
                      <div className="mt-2 text-sm text-slate-400 flex items-center gap-2">
                        <span>📎 {selectedFile.name}</span>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Select a user to start chatting
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-8">
      <ImagePreview />
      <div className="max-w-4xl mx-auto bg-slate-800">
        <div className="backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 flex flex-col h-[calc(100vh-8rem)]">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Support Chat
                </h1>
                <p className="text-sm text-slate-400">
                  Chat with our support team
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 messages-container">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((message) => renderMessage(message))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No messages yet. Start a conversation!
                  </div>
                )}

                <div style={{ height: 1 }} ref={messagesEndRef}></div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <textarea
                className="flex-1 bg-slate-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[60px]"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (newMessage.trim() || selectedFile)
                  ) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="w-[60px] h-[60px] flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors"
                >
                  📎
                </label>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !selectedFile}
                className="w-[60px] h-[60px] bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
              >
                ➤
              </button>
            </div>
            {selectedFile && (
              <div className="mt-2 text-sm text-slate-400 flex items-center gap-2">
                <span>📎 {selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
