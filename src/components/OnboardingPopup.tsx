import React, { useState } from "react";
import { X, Check, LogOut, Copy, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  handleCopyVerification,
  handleFinalSubmit,
  handleSignOut,
  handleSubmitInterests,
  showUniqueToast,
  verifyChannel,
} from "./Onboarding-Stepper";
import { Stepper } from "./Onboarding-Stepper/Stepper";
// Utility to prevent duplicate toasts

export default function OnboardingPopup({
  isOpen,
  onClose,
  userId,
  userEmail,
}: any) {
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState({
    channelManagement: false,
    musicPartnerProgram: false,
    digitalRights: false,
    other: false,
  });
  const [otherInterest, setOtherInterest] = useState("");
  const [digitalRightsInfo, setDigitalRightsInfo] = useState({
    website: "",
    youtubeChannels: [""],
  });
  const [channelInfo, setChannelInfo] = useState({
    name: "",
    email: userEmail || "",
    youtubeLinks: [""],
    verificationCode: "",
    verifiedChannels: {} as Record<string, boolean>,
  });
  const [showChannelPrompt, setShowChannelPrompt] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCopied, setVerificationCopied] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Generate a random verification code when component mounts
  React.useEffect(() => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setChannelInfo((prev) => ({ ...prev, verificationCode: code }));
  }, []);

  const handleInterestChange = (interest: keyof typeof interests) => {
    setInterests((prev) => ({
      ...prev,
      [interest]: !prev[interest],
    }));

    // Show channel prompt when Channel Management is selected
    if (interest === "channelManagement") {
      setShowChannelPrompt((prev) => !prev);
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
    } else {
      setChannelInfo((prev) => ({
        ...prev,
        [name]: value,
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

  const validateStep2 = () => {
    if (!channelInfo.name.trim()) {
      showUniqueToast("Please enter your name", "error", "name-required");
      return false;
    }
    if (!channelInfo.email.trim()) {
      showUniqueToast("Please enter your email", "error", "email-required");
      return false;
    }
    if (!channelInfo.youtubeLinks[0]?.trim()) {
      showUniqueToast(
        "Please enter your YouTube channel link",
        "error",
        "youtube-required"
      );
      return false;
    }
    return true;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4 overflow-hidden">
        {/* Floating Cubes Background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-indigo-500/10 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
                transform: `rotate(45deg)`,
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full flex flex-col border border-slate-700 relative z-10"
        >
          {/* Header */}
          <div className="bg-slate-700 px-6 py-4 flex items-center justify-center border-b border-slate-600">
            <h2 className="text-xl font-bold text-white">
              {step === 1 ? "Welcome to MediaTiger!" : "Channel Information"}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-5 overflow-y-auto max-h-[calc(100vh-16rem)]">
            <Stepper
              step={step}
              interests={interests}
              channelInfo={channelInfo}
              digitalRightsInfo={digitalRightsInfo}
              otherInterest={otherInterest}
              isVerifying={isVerifying}
              verificationCopied={verificationCopied}
              user={user}
              handleInterestChange={handleInterestChange}
              handleChannelInfoChange={handleChannelInfoChange}
              setDigitalRightsInfo={setDigitalRightsInfo}
              setOtherInterest={setOtherInterest}
              addChannelField={addChannelField}
              removeChannelField={removeChannelField}
              handleCopyVerification={handleCopyVerification}
              setIsVerifying={setIsVerifying}
              setChannelInfo={setChannelInfo}
              verifyChannel={verifyChannel}
            />
          </div>

          {/* Footer */}
          <div className="bg-slate-700 px-6 py-4 flex justify-between items-center border-t border-slate-600 mt-auto">
            <button
              onClick={() => {
                handleSignOut(signOut, navigate);
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
            {step === 1 ? (
              <button
                onClick={() => {
                  handleSubmitInterests(
                    interests,
                    otherInterest,
                    channelInfo,
                    digitalRightsInfo,
                    setStep,
                    user,
                    onClose,
                    setIsSubmitting
                  );
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Continue"}
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (validateStep2()) {
                      handleFinalSubmit(
                        setIsSubmitting,
                        interests,
                        userId,
                        otherInterest,
                        digitalRightsInfo,
                        channelInfo,
                        user,
                        userEmail,
                        onclose
                      );
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
