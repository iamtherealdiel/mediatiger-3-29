import { Check, CheckCircle, Copy, X } from "lucide-react";
import React from "react";
import { ChannelInfo } from "../../stores/onboardingStore";

interface StepperProps {
  step: number;
  interests: {
    channelManagement: boolean;
    musicPartnerProgram: boolean;
    digitalRights: boolean;
    other: boolean;
  };
  channelInfo: ChannelInfo;
  digitalRightsInfo: {
    website: string;
    youtubeChannels: string[];
  };
  otherInterest: string;
  isVerifying: boolean;
  verificationCopied: boolean;
  user: { id: string; user_metadata: { full_name: string } } | null;
  handleInterestChange: (interest: string) => void;
  handleChannelInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setDigitalRightsInfo: React.Dispatch<
    React.SetStateAction<{ website: string; youtubeChannels: string[] }>
  >;
  setOtherInterest: React.Dispatch<React.SetStateAction<string>>;
  addChannelField: () => void;
  removeChannelField: (index: number) => void;
  handleCopyVerification: (
    setVerificationCopied: React.Dispatch<React.SetStateAction<boolean>>,
    channelInfo: { verificationCode: string }
  ) => void;
  setIsVerifying: React.Dispatch<React.SetStateAction<boolean>>;
  setChannelInfo: React.Dispatch<React.SetStateAction<ChannelInfo>>;
  verifyChannel: (
    channelUrl: string,
    setIsVerifying: React.Dispatch<React.SetStateAction<boolean>>,
    channelInfo: ChannelInfo,
    setChannelInfo: React.Dispatch<React.SetStateAction<ChannelInfo>>,
    userId: string | null
  ) => Promise<void>;
  setVerificationCopied: React.Dispatch<React.SetStateAction<boolean>>;
}

const InterestOption = ({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    className={`p-3 rounded-lg cursor-pointer flex items-center ${
      isSelected
        ? "bg-indigo-600/20 border border-indigo-600/30"
        : "bg-slate-700 border border-slate-600 hover:bg-slate-600"
    }`}
    onClick={onClick}
  >
    <div
      className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${
        isSelected ? "bg-indigo-600 text-white" : "bg-slate-600"
      }`}
    >
      {isSelected && <Check className="h-4 w-4" />}
    </div>
    <span className="text-white">{label}</span>
  </div>
);

const YouTubeChannelField = ({
  link,
  index,
  onChange,
  onRemove,
}: {
  link: string;
  index: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) => (
  <div className="flex items-center space-x-2 mb-2">
    <input
      type="text"
      name={`youtubeLink${index}`}
      value={link}
      onChange={onChange}
      placeholder="Enter your YouTube channel URL"
      className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    {index > 0 && (
      <button
        onClick={onRemove}
        className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
);

export const Stepper: React.FC<StepperProps> = ({
  step,
  interests,
  channelInfo,
  digitalRightsInfo,
  otherInterest,
  isVerifying,
  verificationCopied,
  user,
  handleInterestChange,
  handleChannelInfoChange,
  setDigitalRightsInfo,
  setOtherInterest,
  addChannelField,
  removeChannelField,
  handleCopyVerification,
  setIsVerifying,
  setChannelInfo,
  verifyChannel,
  setVerificationCopied,
}) => {
  return step === 1 ? (
    <>
      <p className="text-slate-300 mb-5">
        Thank you for verifying your email. To help us serve you better, please
        let us know what you're here for:
      </p>

      <div className="space-y-3 mb-6">
        <InterestOption
          label="Channel Management"
          isSelected={interests.channelManagement}
          onClick={() => handleInterestChange("channelManagement")}
        />
        <InterestOption
          label="Music Partner Program"
          isSelected={interests.musicPartnerProgram}
          onClick={() => handleInterestChange("musicPartnerProgram")}
        />

        {(interests.channelManagement || interests.musicPartnerProgram) && (
          <div className="mt-2 pl-8 animate-fadeIn">
            {channelInfo.youtubeLinks.map((link, index) => (
              <YouTubeChannelField
                key={index}
                link={link}
                index={index}
                onChange={handleChannelInfoChange}
                onRemove={() => removeChannelField(index)}
              />
            ))}
            <button
              onClick={addChannelField}
              type="button"
              className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Add another channel
            </button>

            {/* Verification Section */}
            <div className="mt-4 bg-slate-800/70 rounded-lg p-4 border border-slate-600">
              <h3 className="text-sm font-medium text-slate-300 mb-2">
                Verification
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                On the Youtube website, go to View your channel &gt; Customize
                channel &gt; Scroll down to &quot;Description&quot;, enter the
                verification code &gt; Publish in the top right corner. This is
                to ensure that you own the channel you link. You can remove it
                once your application has been accepted.
              </p>

              <div className="flex items-center space-x-2 bg-slate-700/70 p-2 rounded-md">
                <code className="text-indigo-400 flex-1 font-mono">
                  {channelInfo.verificationCode}
                </code>
                <button
                  onClick={() => {
                    handleCopyVerification(setVerificationCopied, channelInfo);
                  }}
                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                  title="Copy verification code"
                >
                  {verificationCopied ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <Copy className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Verification Status */}
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
                          onClick={() =>
                            verifyChannel(
                              link,
                              setIsVerifying,
                              channelInfo,
                              setChannelInfo,
                              user?.id || ""
                            )
                          }
                          disabled={isVerifying}
                          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {isVerifying ? "Checking..." : "Verify"}
                        </button>
                      </div>
                    )
                )}
              </div>
            </div>
          </div>
        )}

        <InterestOption
          label="Digital Rights"
          isSelected={interests.digitalRights}
          onClick={() => handleInterestChange("digitalRights")}
        />

        {interests.digitalRights && (
          <div className="mt-2 pl-8 space-y-3 animate-fadeIn">
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Website URL
              </label>
              <input
                type="text"
                id="website"
                value={digitalRightsInfo.website}
                onChange={(e) =>
                  setDigitalRightsInfo((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                placeholder="https://your-website.com"
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                YouTube Channel URLs
              </label>
              {digitalRightsInfo.youtubeChannels.map((channel, index) => (
                <YouTubeChannelField
                  key={index}
                  link={channel}
                  index={index}
                  onChange={(e) => {
                    const newChannels = [...digitalRightsInfo.youtubeChannels];
                    newChannels[index] = e.target.value;
                    setDigitalRightsInfo((prev) => ({
                      ...prev,
                      youtubeChannels: newChannels,
                    }));
                  }}
                  onRemove={() => {
                    setDigitalRightsInfo((prev) => ({
                      ...prev,
                      youtubeChannels: prev.youtubeChannels.filter(
                        (_, i) => i !== index
                      ),
                    }));
                  }}
                />
              ))}
              <button
                onClick={() => {
                  setDigitalRightsInfo((prev) => ({
                    ...prev,
                    youtubeChannels: [...prev.youtubeChannels, ""],
                  }));
                }}
                type="button"
                className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                Add another channel
              </button>
            </div>
          </div>
        )}

        <InterestOption
          label="Other"
          isSelected={interests.other}
          onClick={() => handleInterestChange("other")}
        />

        {interests.other && (
          <div className="mt-2 pl-8">
            <label
              htmlFor="otherDescription"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Please describe what you're interested in
            </label>
            <textarea
              id="otherDescription"
              value={otherInterest}
              onChange={(e) => setOtherInterest(e.target.value)}
              placeholder="Describe your interests or requirements"
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
            ></textarea>
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <p className="text-slate-300 mb-5">
        Please provide your channel information so we can better assist you:
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={channelInfo.name}
            onChange={handleChannelInfoChange}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={channelInfo.email}
            onChange={handleChannelInfoChange}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your email address"
          />
        </div>

        <div>
          <label
            htmlFor="youtubeLink"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Verified YouTube Channels
          </label>
          {channelInfo.youtubeLinks
            .filter((link) => channelInfo.verifiedChannels[link])
            .map((link, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <div className="flex items-center space-x-2 flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-white">{link}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
