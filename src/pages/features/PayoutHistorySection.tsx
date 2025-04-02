import { useEffect, useState } from "react";
interface PayoutHistory {
  id: string;
  amount: number;
  status: "completed" | "pending" | "processing";
  payout_date: string;
  method: string;
}
import { supabase } from "../../lib/supabase";
export const PayoutHistorySection = () => {
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayoutHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("payouts")
          .select("*")
          .order("payout_date", { ascending: false });

        if (error) throw error;
        setPayouts(data || []);
      } catch (error) {
        console.error("Error fetching payout history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayoutHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No payout history available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upcoming Payouts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Upcoming Payouts
        </h3>
        <div className="space-y-3">
          {payouts
            .filter((payout) => payout.status === "pending")
            .map((payout) => (
              <div
                key={payout.id}
                className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">
                      ${payout.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400">
                      Expected{" "}
                      {new Date(payout.payout_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="px-3 py-1 text-sm bg-indigo-500/20 text-indigo-300 rounded-full">
                      Scheduled
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Past Payouts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Past Payouts</h3>
        <div className="space-y-3">
          {payouts
            .filter((payout) => payout.status === "completed")
            .map((payout) => (
              <div
                key={payout.id}
                className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">
                      ${payout.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400">
                      Paid via {payout.method} •{" "}
                      {new Date(payout.payout_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="px-3 py-1 text-sm bg-green-500/20 text-green-300 rounded-full">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
