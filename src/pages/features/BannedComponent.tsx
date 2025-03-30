import { X } from "lucide-react";

interface BannedComponentProps {
  reason?: string;
  handleSignOut: () => void;
}

const BannedComponent: React.FC<BannedComponentProps> = ({
  reason,
  handleSignOut,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-800 rounded-xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-slate-800/50 to-red-500/5"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Account Suspended
          </h2>
          <p className="text-slate-300 mb-6">
            Your account has been temporarily suspended. Please contact support
            for assistance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSignOut}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedComponent;
