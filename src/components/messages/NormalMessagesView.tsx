import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ImagePreview } from '../ImagePreview';

interface NormalMessagesViewProps {
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
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

export const NormalMessagesView: React.FC<NormalMessagesViewProps> = ({
  previewImage,
  setPreviewImage,
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
    <div className="min-h-screen p-4 md:p-8">
      <ImagePreview
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
      />
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
};