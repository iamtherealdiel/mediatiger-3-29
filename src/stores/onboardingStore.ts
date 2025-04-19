import { create } from "zustand";

interface Interests {
  channelManagement: boolean;
  musicPartnerProgram: boolean;
  digitalRights: boolean;
  other: boolean;
}

interface DigitalRightsInfo {
  website: string;
  youtubeChannels: string[];
}

export interface ChannelInfo {
  name: string;
  email: string;
  youtubeLinks: string[];
  verificationCode: string;
  verifiedChannels: Record<string, boolean>;
}

interface OnboardingState {
  step: number;
  interests: Interests;
  otherInterest: string;
  digitalRightsInfo: DigitalRightsInfo;
  channelInfo: ChannelInfo;
  isVerifying: boolean;
  isSubmitting: boolean;
  verificationCopied: boolean;
  setStep: (step: number) => void;
  setInterests: (interests: Interests) => void;
  setOtherInterest: (otherInterest: string) => void;
  setDigitalRightsInfo: (info: DigitalRightsInfo) => void;
  setChannelInfo: (info: ChannelInfo) => void;
  setIsVerifying: (isVerifying: boolean) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setVerificationCopied: (verificationCopied: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  interests: {
    channelManagement: false,
    musicPartnerProgram: false,
    digitalRights: false,
    other: false,
  },
  otherInterest: "",
  digitalRightsInfo: {
    website: "",
    youtubeChannels: [""],
  },
  channelInfo: {
    name: "",
    email: "",
    youtubeLinks: [""],
    verificationCode: "",
    verifiedChannels: {},
  },
  isVerifying: false,
  isSubmitting: false,
  verificationCopied: false,
  setStep: (step) => set({ step }),
  setInterests: (interests) => set({ interests }),
  setOtherInterest: (otherInterest) => set({ otherInterest }),
  setDigitalRightsInfo: (info) => set({ digitalRightsInfo: info }),
  setChannelInfo: (info) => set({ channelInfo: info }),
  setIsVerifying: (isVerifying) => set({ isVerifying }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setVerificationCopied: (verificationCopied) => set({ verificationCopied }),
}));
