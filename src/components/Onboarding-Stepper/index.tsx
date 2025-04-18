import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
const shownToasts = new Set<string>();
export const showUniqueToast = (
  message: string,
  type: "success" | "error",
  id?: string
) => {
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

export const handleCopyVerification = (setVerificationCopied, channelInfo) => {
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
    } catch (err) {
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
  channelUrl,
  setIsVerifying,
  setChannelInfo,
  userId
) => {
  setIsVerifying(true);
  if (!channelUrl || !channelUrl.toLowerCase().includes("youtube")) {
    showUniqueToast("Enter a valid youtube link.", "error", "channel-exists");
    return setIsVerifying(false);
  }
  try {
    // First check if channel is already registered
    const { data: existingRequest, error: checkError } = await supabase
      .from("user_requests")
      .select("id")
      .filter("youtube_links", "cs", `{"${channelUrl}"}`)
      .filter("status", "eq", "approved")
      .not("user_id", "eq", userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingRequest) {
      showUniqueToast(
        "This YouTube channel is already registered with another account",
        "error",
        "channel-exists"
      );
      setChannelInfo((prev) => ({
        ...prev,
        verifiedChannels: {
          ...prev.verifiedChannels,
          [channelUrl]: false,
        },
      }));
      return;
    }

    // Simulate API call to check channel description
    // In production, this would be a real API call to YouTube's API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo purposes, randomly verify
    const isVerified = true;

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
        "Verification code not found in channel description",
        "error",
        "verification-failed"
      );
    }
  } catch (error) {
    showUniqueToast("Failed to verify channel", "error", "verification-error");
  } finally {
    setIsVerifying(false);
  }
};
export const handleSignOut = async (signOut, navigate) => {
  try {
    await signOut();
    navigate("/login");
  } catch (error) {
    console.error("Error signing out:", error);
    showUniqueToast("Failed to sign out", "error", "signout-error");
  }
};
export const handleFinalSubmit = async (
  setIsSubmitting,
  interests,
  userId,
  otherInterest,
  digitalRightsInfo,
  channelInfo,
  user,
  userEmail,
  onClose
) => {
  setIsSubmitting(true);
  try {
    // Create submission data
    const selectedInterests = Object.entries(interests)
      .filter(([_, selected]) => selected)
      .map(([interest, _]) => interest);

    const { error } = await supabase.from("user_requests").insert([
      {
        user_id: userId,
        interests: selectedInterests,
        other_interest: interests.other ? otherInterest : null,
        website: interests.digitalRights ? digitalRightsInfo.website : null,
        youtube_channel: interests.digitalRights
          ? digitalRightsInfo.youtubeChannels[0]
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
  } catch (error: any) {
    showUniqueToast(
      error.message || "Failed to submit your information. Please try again.",
      "error",
      "onboarding-error"
    );
  } finally {
    setIsSubmitting(false);
  }
};
export const handleSubmitInterests = async (
  interests,
  otherInterest,
  channelInfo,
  digitalRightsInfo,
  setStep,
  user,
  onClose,
  setIsSubmitting
) => {
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
      user?.id,
      otherInterest,
      null, // digitalRightsInfo not needed for "other" interest
      channelInfo,
      user,
      user?.email,
      onClose
    );
  }
};
