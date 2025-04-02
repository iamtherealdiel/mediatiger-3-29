import { supabase } from "../lib/supabase";
export const verifyChannel = async (
  channelUrl: string,
  userId: string,
  showUniqueToast: any,
  setChannelInfo: any,
  setIsVerifying: any
) => {
  setIsVerifying(true);
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

export const handleChannelInfoChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setChannelInfo: React.Dispatch<React.SetStateAction<any>>
) => {
  const { name, value } = e.target;
  console.log("is this working");
  if (name.startsWith("youtubeLink")) {
    const index = parseInt(name.replace("youtubeLink", ""));
    setChannelInfo((prev: any) => ({
      ...prev,
      youtubeLinks: prev.youtubeLinks.map((link: string, i: number) =>
        i === index ? value : link
      ),
    }));
  } else {
    setChannelInfo((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  }
};
export const handleSubmitInterests = async (
  interests: {
    channelManagement: boolean;
    musicPartnerProgram: boolean;
    digitalRights: boolean;
    other: boolean;
  },
  otherInterest: string,
  channelInfo: {
    youtubeLinks: string[];
    verifiedChannels: { [key: string]: boolean };
  },
  digitalRightsInfo: {
    website: string;
    youtubeChannels: string[];
  },
  showUniqueToast: any,
  setStep: (step: number) => void,
  handleFinalSubmit: () => Promise<void>
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
    await handleFinalSubmit();
  }
};
