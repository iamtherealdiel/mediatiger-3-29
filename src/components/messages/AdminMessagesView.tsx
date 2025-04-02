import React from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { ImagePreview } from '../ImagePreview';

interface AdminMessagesViewProps {
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredUsers: any[];
  selectedUser: any;
  setSelectedUser: (user: any) => void;
  isLoading: boolean;
  messages: any[];
  renderMessage: (message: any) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  selectedFile: File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedFile: (file: File | null) => void;
}

export const AdminMessagesView: React.FC<AdminMessagesViewProps> = ({
  previewImage,
  setPreviewImage,
  searchTerm,
  setSearchTerm,
  filteredUsers,
  selectedUser,
  setSelectedUser,
  isLoading,
  messages,
  renderMessage,
  messagesEndRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
  selectedFile,
  handleFileSelect,
  setSelectedFile,
}) => {
  return (
    <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-3 md:p-6 mb-6">
      <ImagePreview
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
      />
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 flex h-[calc(100vh-8rem)]">
          <UsersList
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredUsers={filteredUsers}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
          <ChatArea
            selectedUser={selectedUser}
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
        </div>
      </div>
    </div>
  );
};

interface UsersListProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredUsers: any[];
  selectedUser: any;
  setSelectedUser: (user: any) => void;
}

const UsersList: React.FC<UsersListProps> = ({
  searchTerm,
  setSearchTerm,
  filteredUsers,
  selectedUser,
  setSelectedUser,
}) => {
  return (
    <div className="w-80 border-r border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 flex items-center">
        <h2 className="text-lg font-semibold text-white flex-1">Users</h2>
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
          <UserListItem
            key={u.id}
            user={u}
            isSelected={selectedUser?.id === u.id}
            onSelect={() => setSelectedUser(u)}
          />
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center py-4 text-slate-400 text-sm">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

interface UserListItemProps {
  user: any;
  isSelected: boolean;
  onSelect: () => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors ${
      isSelected ? "bg-slate-700/50" : ""
    }`}
  >
    <div className="flex items-center">
      <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
        <MessageSquare className="h-5 w-5 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white truncate">
          {user.full_name || user.email}
        </h3>
        {user.last_message && (
          <p className="text-xs text-slate-400 truncate mt-1">
            {user.last_message}
          </p>
        )}
      </div>
    </div>
  </button>
);

interface ChatAreaProps {
  selectedUser: any;
  isLoading: boolean;
  messages: any[];
  renderMessage: (message: any) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  selectedFile: File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedFile: (file: File | null) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedUser,
  isLoading,
  messages,
  renderMessage,
  messagesEndRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
  selectedFile,
  handleFileSelect,
  setSelectedFile,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {selectedUser ? (
        <>
          <ChatHeader user={selectedUser} />
          <MessageList
            isLoading={isLoading}
            messages={messages}
            renderMessage={renderMessage}
            messagesEndRef={messagesEndRef}
          />
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            selectedFile={selectedFile}
            handleFileSelect={handleFileSelect}
            setSelectedFile={setSelectedFile}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-slate-400">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
};

const ChatHeader: React.FC<{ user: any }> = ({ user }) => (
  <div className="p-4 border-b border-slate-700/50">
    <div className="flex items-center">
      <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
        <MessageSquare className="h-5 w-5 text-indigo-400" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-white">
          {user.full_name || user.email}
        </h1>
        <p className="text-sm text-slate-400">Chat with user</p>
      </div>
    </div>
  </div>
);

interface MessageListProps {
  isLoading: boolean;
  messages: any[];
  renderMessage: (message: any) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  isLoading,
  messages,
  renderMessage,
  messagesEndRef,
}) => (
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
);

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  selectedFile: File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedFile: (file: File | null) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  selectedFile,
  handleFileSelect,
  setSelectedFile,
}) => (
  <div className="p-4 border-t border-slate-700/50">
    <div className="flex gap-2">
      <textarea
        className="flex-1 bg-slate-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[60px]"
        placeholder="Type your message here..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && (newMessage.trim() || selectedFile)) {
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
);