import axios from "axios";
import React from "react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { ChannelInfo } from "../../stores/onboardingStore";

const shownToasts = new Set<string>();

export const showUniqueToast = (
  message: string,
  type: "success" | "error",
  id?: string
): void => {
  const toastId = id || message;
  if (!shownToasts.has(toastId)) {
    shownToasts.add(toastId);

    if (type === "success") {
      toast.success(message, { id: toastId });
    } else {
      toast.error(message, { id: toastId });
    }

    // Remove from tracking after some time
    setTimeout(() => {
      shownToasts.delete(toastId);
    }, 5000);
  }
};

export const handleCopyVerification = (
  setVerificationCopied: React.Dispatch<React.SetStateAction<boolean>>,
  channelInfo: { verificationCode: string }
): void => {
  if (!channelInfo.verificationCode) {
    showUniqueToast("No verification code to copy", "error", "no-code");
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(channelInfo.verificationCode)
      .then(() => {
        setVerificationCopied(true);
        setTimeout(() => setVerificationCopied(false), 2000);
      })
      .catch(() => {
        showUniqueToast(
          "Failed to copy verification code",
          "error",
          "copy-failed"
        );
      });
  } else {
    // Fallback for unsupported browsers
    const textarea = document.createElement("textarea");
    textarea.value = channelInfo.verificationCode;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setVerificationCopied(true);
      setTimeout(() => setVerificationCopied(false), 2000);
    } catch {
      showUniqueToast(
        "Failed to copy verification code",
        "error",
        "copy-failed"
      );
    }
    document.body.removeChild(textarea);
  }
};

export const verifyChannel = async (
  channelUrl: string,
  setIsVerifying: React.Dispatch<React.SetStateAction<boolean>>,
  channelInfo: ChannelInfo,
  setChannelInfo: React.Dispatch<React.SetStateAction<ChannelInfo>>,
  userId: string | null
): Promise<void> => {
  setIsVerifying(true);
  console.log("[Onboarding] -> verifyChannel -> userId: ", userId);

  if (!channelUrl || !channelUrl.toLowerCase().includes("youtube")) {
    showUniqueToast("Enter a valid YouTube link.", "error", "channel-exists");
    setIsVerifying(false);
    return;
  }

  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  try {
    let channelId: string | null = null;

    if (channelUrl.includes("@")) {
      const handle = channelUrl.split("@")[1];
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${youtubeApiKey}`
      );
      channelId = response.data.items?.[0]?.id || null;
    } else if (channelUrl.includes("/channel/")) {
      const channelIdMatch = channelUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
      channelId = channelIdMatch ? channelIdMatch[1] : null;
    } else if (channelUrl.includes("/c/")) {
      const customName = channelUrl.split("/c/")[1];
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${customName}&key=${youtubeApiKey}`
      );
      channelId = response.data.items?.[0]?.snippet?.channelId || null;
    }

    if (!channelId) {
      showUniqueToast("Invalid YouTube channel URL.", "error", "invalid-url");
      setIsVerifying(false);
      console.log(
        "[Onboarding] -> verifyChannel -> Channel ID not found: ",
        channelId
      );
      return;
    }

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${youtubeApiKey}`
    );

    const channel = response.data.items[0];
    console.log("[Onboarding] -> verifyChannel -> Channel data: ", channel);
    if (!channel) {
      showUniqueToast("Channel not found.", "error", "channel-not-found");
      setIsVerifying(false);
      return;
    }

    const description = channel.snippet.description || "";
    const verificationCode = channelInfo.verificationCode || "";

    if (!description.trim()) {
      showUniqueToast(
        "The channel has no description.",
        "error",
        "no-description"
      );
      setIsVerifying(false);
      return;
    }

    const isVerified = description.includes(verificationCode);

    setChannelInfo((prev) => ({
      ...prev,
      verifiedChannels: {
        ...prev.verifiedChannels,
        [channelUrl]: isVerified,
      },
    }));

    if (isVerified) {
      showUniqueToast(
        "Channel verified successfully!",
        "success",
        "channel-verified"
      );
    } else {
      showUniqueToast(
        "Verification code not found in channel description.",
        "error",
        "verification-failed"
      );
      console.log(
        "[Onboarding] -> verifyChannel -> Verification code not found in channel description: ",
        description
      );
    }
  } catch (error) {
    console.error("Error verifying channel:", error);
    showUniqueToast("Failed to verify channel.", "error", "verification-error");
  } finally {
    setIsVerifying(false);
  }
};

export const handleSignOut = async (
  signOut: () => Promise<void>,
  navigate: (path: string) => void
): Promise<void> => {
  try {
    await signOut();
    navigate("/login");
  } catch (error) {
    console.error("Error signing out:", error);
    showUniqueToast("Failed to sign out", "error", "signout-error");
  }
};

export const handleFinalSubmit = async (
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
  interests: { [key: string]: boolean },
  userId: string,
  otherInterest: string,
  digitalRightsInfo: { website: string; youtubeChannels: string[] } | null,
  channelInfo: {
    youtubeLinks: string[];
    verifiedChannels: Record<string, boolean>;
    name?: string;
    email?: string;
  },
  user: {
    id?: string;
    email?: string;
    user_metadata?: { full_name: string };
  } | null,
  userEmail: string | undefined,
  onClose: () => void
): Promise<void> => {
  setIsSubmitting(true);
  try {
    // Create submission data
    const selectedInterests = Object.entries(interests)
      .filter(([, selected]) => selected)
      .map(([interest]) => interest);

    const { error } = await supabase.from("user_requests").insert([
      {
        user_id: userId,
        interests: selectedInterests,
        other_interest: interests.other ? otherInterest : null,
        website: interests.digitalRights ? digitalRightsInfo?.website : null,
        youtube_channel: interests.digitalRights
          ? digitalRightsInfo?.youtubeChannels[0]
          : null,
        name: channelInfo.name || user?.user_metadata?.full_name || "",
        email: channelInfo.email || userEmail,
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

    // Also update user metadata to mark onboarding as complete
    await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
      },
    });

    // Show submission popup
    const popup = document.createElement("div");
    popup.className =
      "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900";
    popup.innerHTML = `
        <div class="bg-slate-800 rounded-xl p-12 max-w-xl w-full text-center shadow-2xl border-2 border-indigo-500/20">
          <div class="w-20 h-20 mx-auto mb-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
            <svg class="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-3xl font-bold text-white mb-6">Application Submitted</h3>
          <div class="mb-8">
            <div class="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden shadow-lg" style="background-size: 200% 100%; animation: gradient-wave 3s ease infinite;">
              Pending
            </div>
          </div>
          <p class="text-slate-300 text-lg mb-4">Your application is under review.</p>
          <p class="text-slate-400">You will be automatically redirected to your dashboard once your application is approved.</p>
        </div>
      `;
    document.body.appendChild(popup);

    // Close the onboarding popup after a short delay
    setTimeout(() => {
      onClose();
    }, 500);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    showUniqueToast(
      errorMessage || "Failed to submit your information. Please try again.",
      "error",
      "onboarding-error"
    );
  } finally {
    setIsSubmitting(false);
  }
};

export const handleSubmitInterests = async (
  interests: { [key: string]: boolean },
  otherInterest: string,
  channelInfo: {
    youtubeLinks: string[];
    verifiedChannels: Record<string, boolean>;
  },
  digitalRightsInfo: { website: string; youtubeChannels: string[] },
  setStep: React.Dispatch<React.SetStateAction<number>>,
  user: { id: string; email: string } | null,
  onClose: () => void,
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  // Check if at least one interest is selected
  if (
    !interests.channelManagement &&
    !interests.musicPartnerProgram &&
    !interests.digitalRights &&
    !interests.other
  ) {
    showUniqueToast(
      "Please select at least one option",
      "error",
      "interests-required"
    );
    return;
  }

  // If other is selected but no text is provided
  if (interests.other && !otherInterest.trim()) {
    showUniqueToast(
      "Please specify your other interest",
      "error",
      "other-interest-required"
    );
    return;
  }

  // If Channel Management or Music Partner Program is selected, validate YouTube URLs and verification
  if (
    (interests.channelManagement || interests.musicPartnerProgram) &&
    !channelInfo.youtubeLinks[0]
  ) {
    showUniqueToast(
      "Please provide your YouTube channel URL",
      "error",
      "youtube-required"
    );
    return;
  }

  // Check if all channels are verified
  if (interests.channelManagement || interests.musicPartnerProgram) {
    const unverifiedChannels = channelInfo.youtubeLinks.filter(
      (link) => link.trim() && !channelInfo.verifiedChannels[link]
    );

    if (unverifiedChannels.length > 0) {
      showUniqueToast(
        "Please verify all YouTube channels before continuing",
        "error",
        "unverified-channels"
      );
      return;
    }
  }

  // Validate Digital Rights fields if selected
  if (interests.digitalRights) {
    if (!digitalRightsInfo.website.trim()) {
      showUniqueToast(
        "Please provide your website URL",
        "error",
        "website-required"
      );
      return;
    }
    if (!digitalRightsInfo.youtubeChannels[0]?.trim()) {
      showUniqueToast(
        "Please provide your YouTube channel URL",
        "error",
        "youtube-required"
      );
      return;
    }
  }

  // Proceed to step 2 for additional info
  if (
    ((interests.channelManagement || interests.musicPartnerProgram) &&
      channelInfo.youtubeLinks[0]) ||
    interests.digitalRights
  ) {
    setStep(2);
  } else {
    // If only "other" is selected, submit directly
    await handleFinalSubmit(
      setIsSubmitting,
      interests,
      user?.id || "",
      otherInterest,
      null, // digitalRightsInfo not needed for "other" interest
      {
        ...channelInfo,
        name: user?.email || "",
        email: user?.email || "",
      },
      user,
      user?.email,
      onClose
    );
  }
};
