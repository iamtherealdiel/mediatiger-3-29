import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { adminId } from "./AdminPanel";
import { X } from "lucide-react";
import { ImagePreview } from "../components/ImagePreview";
import { AdminMessagesView } from "../components/messages/AdminMessagesView";
import { NormalMessagesView } from "../components/messages/NormalMessagesView";

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
      <AdminMessagesView
        filteredUsers={filteredUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        messages={messages}
        isLoading={isLoading}
        handleSendMessage={handleSendMessage}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        handleFileSelect={handleFileSelect}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        renderMessage={renderMessage}
      />
    );
  }

  return (
    <NormalMessagesView
      previewImage={previewImage}
      setPreviewImage={setPreviewImage}
      isLoading={isLoading}
      messages={messages}
      renderMessage={renderMessage}
      messagesEndRef={messagesEndRef}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      handleSendMessage={handleSendMessage}
      selectedFile={selectedFile}
      handleFileSelect={handleFileSelect}
      setSelectedFile={setSelectedFile}
    />
  );
}
