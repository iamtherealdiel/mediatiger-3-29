import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Send,
  Image as ImageIcon,
  Loader,
  Check,
  CheckCheck,
  Search,
  X,
  UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// Interfaces
interface User {
  id: string;
  username: string;
  email: string;
  profile_image?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
}

interface MessagePanelProps {
  userId: string;
  isAdmin: boolean;
  otherUserId?: string;
  userName: string;
}

// UserSearch Component
export function UserSearch({
  userId,
  onSelectUser,
}: {
  userId: string;
  onSelectUser: (user: User) => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .neq("id", userId); // Exclude current user

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userId]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  return (
    <div className="w-full max-w-md bg-slate-800 rounded-lg">
      {/* Search Input */}
      <div className="p-4 bg-slate-700 rounded-t-lg">
        <div className="flex items-center bg-slate-600 rounded-full px-3 py-2">
          <Search className="h-5 w-5 text-slate-400 mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-slate-400 p-4">No users found</div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="flex items-center p-4 hover:bg-slate-700 cursor-pointer transition-colors"
            >
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.username}
                  className="h-10 w-10 rounded-full mr-4"
                />
              ) : (
                <UserCircle className="h-10 w-10 text-slate-500 mr-4" />
              )}
              <div>
                <h4 className="text-white font-semibold">{user.username}</h4>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// MessagePanel Component
export function MessagePanel({
  userId,
  isAdmin,
  otherUserId,
  userName,
}: MessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom on messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages and set up subscription
  useEffect(() => {
    if (!otherUserId) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Mark unread messages as read
        const unreadMessages =
          data?.filter((m) => m.receiver_id === userId && !m.read_at) || [];

        for (const msg of unreadMessages) {
          await supabase.rpc("mark_message_read", { message_id: msg.id });
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId},receiver_id=eq.${otherUserId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;
            setMessages((prev) => [...prev, newMessage]);

            // Mark message as read if we're the receiver
            if (newMessage.receiver_id === userId) {
              await supabase.rpc("mark_message_read", {
                message_id: newMessage.id,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, otherUserId]);

  // Filter messages based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMessages(messages);
      return;
    }

    const filtered = messages.filter(
      (message) =>
        message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.image_url &&
          message.image_url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredMessages(filtered);
  }, [messages, searchTerm]);

  // Image selection handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("message-images")
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("message-images").getPublicUrl(data.path);

    return publicUrl;
  };

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !imageFile) return;
    if (!otherUserId) return;

    setIsSending(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: otherUserId,
        content: newMessage.trim(),
        image_url: imageUrl || null,
      });

      if (error) throw error;

      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // No selected user state
  if (!otherUserId) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        Select a user to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-800 rounded-lg overflow-hidden">
      {/* Header with Search */}
      <div className="bg-slate-700 px-4 py-3 flex items-center">
        <div className="flex-1 flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-white">
            {isAdmin ? userName : "MediaTiger Support"}
          </h3>
          <div className="flex-1 flex items-center bg-slate-600 rounded-full px-3 py-1">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-300">
            {filteredMessages.length} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((message) => {
          const isOwnMessage = message.sender_id === userId;
          const highlightedContent = message.content.replace(
            new RegExp(`(${searchTerm})`, "gi"),
            '<mark class="bg-yellow-200 text-black">$1</mark>'
          );

          return (
            <div
              key={message.id}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] ${
                  isOwnMessage
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-200"
                } rounded-lg px-4 py-2 space-y-2`}
              >
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="Message attachment"
                    className={`rounded-lg max-h-60 object-contain ${
                      message.image_url
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                        ? "border-2 border-yellow-300"
                        : ""
                    }`}
                  />
                )}
                <p
                  className="break-words"
                  dangerouslySetInnerHTML={{ __html: highlightedContent }}
                />
                <div className="flex items-center justify-end space-x-2 text-xs opacity-70">
                  <span>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                  {isOwnMessage &&
                    (message.read_at ? (
                      <CheckCheck className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
        {filteredMessages.length === 0 && (
          <div className="text-center text-slate-400 py-4">
            No messages found
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 bg-slate-700">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="h-20 w-20 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-700">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-full transition-colors"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-600 text-white placeholder-slate-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !imageFile)}
            className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Main Messaging Component
export default function Messaging({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="flex space-x-4 p-4 bg-slate-900 min-h-screen">
      <UserSearch
        userId={userId}
        onSelectUser={(user) => setSelectedUser(user)}
      />
      <MessagePanel
        userId={userId}
        isAdmin={isAdmin}
        otherUserId={selectedUser?.id}
        userName={selectedUser?.username || ""}
      />
    </div>
  );
}
