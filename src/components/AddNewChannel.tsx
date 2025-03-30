import React, { useState } from "react";
import { X, Check, Copy, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface NewChannelPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  loadChannels: any;
  type?: "channel" | "main";
}

export default function NewChannelPopup({
  isOpen,
  onClose,
  userId,
  type = "channel",
  userEmail,
  loadChannels,
}: NewChannelPopupProps) {
  const [channelInfo, setChannelInfo] = useState({
    youtubeLinks: [""],
    verificationCode: "",
    verifiedChannels: {} as Record<string, boolean>,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCopied, setVerificationCopied] = useState(false);
  const { user } = useAuth();
  React.useEffect(() => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setChannelInfo((prev) => ({ ...prev, verificationCode: code }));
  }, []);

  const handleCopyVerification = () => {
    navigator.clipboard.writeText(channelInfo.verificationCode);
    setVerificationCopied(true);
    setTimeout(() => setVerificationCopied(false), 2000);
  };

  const verifyChannel = async (channelUrl: string) => {
    setIsVerifying(true);
    try {
      const { data: existingRequest, error: checkError } = await supabase
        .from("user_requests")
        .select("id")
        .filter("youtube_links", "cs", `{"${channelUrl}"}`)
        .filter("status", "eq", "approved")
        .maybeSingle();

      if (checkError) throw checkError;
      const { data: existsInChannelsRequest, error: channelsErrorExists } =
        await supabase
          .from("channels")
          .select("id")
          .eq("link", channelUrl)
          .eq("status", "approved")
          .single();
      const { data: alreadySubmitted, error: erroralreadySubmitted } =
        await supabase
          .from("channels")
          .select("id")
          .eq("link", channelUrl)
          .eq("status", "pending")
          .eq("user_id", userId)
          .single();
      if (alreadySubmitted) {
        toast.error(
          "This YouTube channel is already pending review. Please wait for approval."
        );
        return;
      }
      if (existingRequest || existsInChannelsRequest) {
        toast.error("This YouTube channel is already registered.");
        setChannelInfo((prev) => ({
          ...prev,
          verifiedChannels: { ...prev.verifiedChannels, [channelUrl]: false },
        }));
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const isVerified = true; // Simulated verification

      setChannelInfo((prev) => ({
        ...prev,
        verifiedChannels: {
          ...prev.verifiedChannels,
          [channelUrl]: isVerified,
        },
      }));

      isVerified
        ? toast.success("Channel verified successfully!")
        : toast.error("Verification code not found in channel description");
    } catch (error) {
      toast.error("Failed to verify channel");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChannelInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("youtubeLink")) {
      const index = parseInt(name.replace("youtubeLink", ""));
      setChannelInfo((prev) => ({
        ...prev,
        youtubeLinks: prev.youtubeLinks.map((link, i) =>
          i === index ? value : link
        ),
      }));
    }
  };

  const addChannelField = () => {
    setChannelInfo((prev) => ({
      ...prev,
      youtubeLinks: [...prev.youtubeLinks, ""],
    }));
  };

  const removeChannelField = (index: number) => {
    setChannelInfo((prev) => ({
      ...prev,
      youtubeLinks: prev.youtubeLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    const unverifiedChannels = channelInfo.youtubeLinks.filter(
      (link) => link.trim() && !channelInfo.verifiedChannels[link]
    );

    if (unverifiedChannels.length > 0) {
      toast.error("Please verify all YouTube channels before submitting");
      return;
    }
    const youtubeUrlRegex =
      /^https:\/\/(?:www\.)?youtube\.com\/[@a-zA-Z0-9-_]+$/;

    if (!youtubeUrlRegex.test(channelInfo.youtubeLinks[0])) {
      toast.error("Please enter a valid YouTube channel URL");
      return;
    }
    setIsSubmitting(true);
    try {
      // get main request id
      const { data: dataReqId, error: errorReqId } = await supabase
        .from("user_requests")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (type == "channel") {
        const { error } = await supabase.from("channels").insert([
          {
            user_id: userId,
            link: channelInfo.youtubeLinks[0],
            status: "pending",
            main_request_id: dataReqId?.id,
          },
        ]);

        if (error) throw error;
      } else {
        // check if array is empty of youtube likns
        const { data: existingRequest, error: checkError } = await supabase
          .from("user_requests")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "approved")
          .single();
        if (
          channelInfo.youtubeLinks.filter((link) => link.trim() !== "")
            .length === 0
        ) {
          toast.error("Please add at least one YouTube channel");
          return;
        }
        if (existingRequest?.youtube_links?.length == 0) {
          await supabase
            .from("user_requests")
            .update({
              youtube_links: channelInfo.youtubeLinks.filter(
                (link) => link.trim() !== ""
              ),
            })
            .eq("user_id", userId);
        } else {
          const { data, error } = await supabase.from("user_requests").insert([
            {
              user_id: userId,
              interests: ["channelManagement"],
              name: user?.user_metadata?.full_name || "",
              email: userEmail,
              youtube_links: channelInfo.youtubeLinks.filter(
                (link) => link.trim() !== ""
              ),
              status: "pending",
            },
          ]);
          if (error) {
            console.error("Error submitting request:", error);
            throw new Error(error.message);
          }
        }
      }
      toast.success("Channel added successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to add channel");
    } finally {
      setIsSubmitting(false);
      loadChannels;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full flex flex-col border border-slate-700"
        >
          <div className="bg-slate-700 px-6 py-4 flex items-center justify-center border-b border-slate-600">
            <h2 className="text-xl font-bold text-white">Add New Channel</h2>
          </div>

          <div className="px-6 py-5 overflow-y-auto max-h-[calc(100vh-16rem)]">
            <div className="space-y-3 mb-6">
              {channelInfo.youtubeLinks.map((link, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    name={`youtubeLink${index}`}
                    value={link}
                    onChange={handleChannelInfoChange}
                    placeholder="Enter YouTube channel URL"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {index > 0 && (
                    <button
                      onClick={() => removeChannelField(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}

              <div className="mt-4 bg-slate-800/70 rounded-lg p-4 border border-slate-600">
                <h3 className="text-sm font-medium text-slate-300 mb-2">
                  Verification
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Add this code to your YouTube channel description to verify
                  ownership:
                </p>

                <div className="flex items-center space-x-2 bg-slate-700/70 p-2 rounded-md">
                  <code className="text-indigo-400 flex-1 font-mono">
                    {channelInfo.verificationCode}
                  </code>
                  <button
                    onClick={handleCopyVerification}
                    className="p-1 hover:bg-slate-600 rounded"
                  >
                    {verificationCopied ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {channelInfo.youtubeLinks.map(
                    (link, index) =>
                      link.trim() && (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-slate-700/50 p-2 rounded"
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            {channelInfo.verifiedChannels[link] === false ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/20 text-red-400">
                                <X className="h-4 w-4" />
                              </div>
                            ) : channelInfo.verifiedChannels[link] === true ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : null}
                            <span className="text-sm text-slate-300 truncate max-w-[200px]">
                              {link}
                            </span>
                          </div>
                          <button
                            onClick={() => verifyChannel(link)}
                            disabled={isVerifying}
                            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isVerifying ? "Checking..." : "Verify"}
                          </button>
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 px-6 py-4 flex justify-end gap-3 border-t border-slate-600">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Channel"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
