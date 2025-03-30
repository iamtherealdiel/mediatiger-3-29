"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Target, Settings, X, Plus, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

// Goal type definition
type Goal = {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
};

// Database Goal type to match Supabase schema
type DbGoal = {
  user_id: string | null;
  uuid?: string;
  date: string;
  target_object?: Record<string, any>;
  data_object?: Record<string, any>;
};

// Props for the component
interface MonthlyGoalsProps {
  user: any;
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

// Predefined goals
const predefinedGoals = [
  {
    id: "monthly-views",
    title: "Monthly Views",
    current: 0,
    target: 1,
    unit: "views",
    color: "blue",
  },
  {
    id: "subscriber-growth",
    title: "Subscriber Growth",
    current: 0,
    target: 1,
    unit: "subscribers",
    color: "green",
  },
  {
    id: "revenue-target",
    title: "Revenue Target",
    current: 0,
    target: 1,
    unit: "$",
    color: "indigo",
  },
];

export default function MonthlyGoals({ user }: MonthlyGoalsProps) {
  // State to track if goals are set up
  const year = new Date().getFullYear();
  const month = new Date().getMonth();

  const firstDayOfMonth = new Date(year, month, 1).toISOString(); // Start of the month
  const lastDayOfMonth = new Date(year, month + 1, 0).toISOString();
  const [goalsSetup, setGoalsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentValues, setCurrentValues] = useState<{
    monthlyViews?: number;
    subscriberGrowth?: number;
    revenueTarget?: number;
  } | null>({});

  // State for goals - initially empty
  const [goals, setGoals] = useState<Goal[]>(predefinedGoals);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form state for all target values
  const [targetValues, setTargetValues] = useState({
    monthlyViews: predefinedGoals[0].target,
    subscriberGrowth: predefinedGoals[1].target,
    revenueTarget: predefinedGoals[2].target,
  });

  // Get current month details
  const getCurrentMonth = () => {
    const date = new Date();
    const monthName = date.toLocaleString("default", { month: "long" });
    const monthNumber = date.getMonth() + 1;
    const formattedDate = `${date.getFullYear()}-${String(monthNumber).padStart(
      2,
      "0"
    )}-01`;

    return { monthName, monthNumber, formattedDate };
  };

  // Fetch goals data from database
  async function getGoalsData() {
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", firstDayOfMonth)
        .lte("date", lastDayOfMonth);

      if (error) {
        console.error("Error fetching goals:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log("Fetched goals:", data);

        const targetObject = data[0]?.target_object || [];
        const dataObject = data[0]?.data_object || [];

        // Convert stored objects into a structured format for state
        const updatedGoals = predefinedGoals.map((goal) => ({
          ...goal,
          target:
            targetObject.find((item: any) => item.name === goal.id)?.value ??
            goal.target,
          current:
            dataObject.find((item: any) => item.name === goal.id)?.value ??
            goal.current,
        }));
        setTargetValues({
          monthlyViews:
            targetObject.find((item: any) => item.name === "monthly-views")
              ?.value ?? predefinedGoals[0].target,
          subscriberGrowth:
            targetObject.find((item: any) => item.name === "subscriber-growth")
              ?.value ?? predefinedGoals[1].target,
          revenueTarget:
            targetObject.find((item: any) => item.name === "revenue-target")
              ?.value ?? predefinedGoals[2].target,
        });
        setGoals(updatedGoals);
        setGoalsSetup(true);
      } else {
        setGoalsSetup(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Save goals to database
  const saveGoalsToDatabase = async (data: Goal[]) => {
    try {
      let target_object = data.map((g) => {
        return { value: g.target, name: g.id };
      });
      let data_object = data.map((g) => {
        return { value: g.current, name: g.id };
      });
      // Convert timestamp to ISO string format
      let date = new Date().toISOString();
      // find the current month goals

      let { data: currentMonthData, error: currentMonthError } = await supabase
        .from("goals")
        .select("id")
        .eq("user_id", user?.id)
        .gte("date", firstDayOfMonth) // Start of the month
        .lte("date", lastDayOfMonth); // End of the month
      if (currentMonthError) {
        console.log("error current month =>", currentMonthError);
      }
      let obj = { user_id: user?.id, target_object, data_object, date };
      if (currentMonthData && currentMonthData?.length == 0) {
        let { data, error } = await supabase.from("goals").insert(obj);
        if (error) {
          console.log(error);
        } else {
          console.log(data);
        }
        setGoalsSetup(true);
      } else if (currentMonthData && currentMonthData.length !== 0) {
        console.log("to be updated ", currentMonthData[0].id);
        let { data: updateData, error: ErrorData } = await supabase
          .from("goals")
          .update(obj)
          .eq("id", currentMonthData[0].id)
          .select("*");
        console.log("updated object", updateData);
        console.log("error update", ErrorData);
      }
    } catch (error) {
      console.log("error ", error);
    }
  };

  // Setup initial goals
  const handleSetupGoals = async () => {
    try {
      setIsModalOpen(true);
      console.log("innitial goals");
    } catch (error) {
      // Handle any errors during goal setup
      console.error("Failed to set up goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update goal targets in database
  const handleUpdateTargets = async () => {
    setIsLoading(true);
    try {
      const updatedGoals = goals.map((goal) => {
        if (goal.id === "monthly-views") {
          return { ...goal, target: targetValues.monthlyViews };
        } else if (goal.id === "subscriber-growth") {
          return { ...goal, target: targetValues.subscriberGrowth };
        } else if (goal.id === "revenue-target") {
          return { ...goal, target: targetValues.revenueTarget };
        }
        return goal;
      });
      setGoals(updatedGoals);
      // Save updated goals to database
      await saveGoalsToDatabase(updatedGoals);

      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to update targets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTargetValues({
      ...targetValues,
      [name]: Number.parseFloat(value) || 0,
    });
  };

  // Close modal when clicking outside
  useEffect(() => {
    getGoalsData();
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    }

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const { monthName } = getCurrentMonth();

  // Loading state
  if (isLoading) {
    return (
      <div className="col-span-full md:col-span-2 bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="col-span-full md:col-span-2 bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Target className="h-5 w-5 text-indigo-400 mr-2" />
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)} - Monthly
          Goals
        </h3>
        {goalsSetup && (
          <button
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setIsModalOpen(true)}
            aria-label="Set Target Values"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>

      {!goalsSetup ? (
        <div className="flex flex-col items-center justify-center py-8 text-center align-center">
          <Target className="h-12 w-12 text-slate-600 mb-3" />
          <h4 className="text-slate-300 font-medium mb-2">
            No goals set up yet
          </h4>
          <p className="text-slate-400 mb-4 max-w-xs">
            Set up your monthly goals to track your progress and stay motivated.
          </p>
          <button
            onClick={handleSetupGoals}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Set Up Goals
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => {
            const percentage = Math.round((goal.current / goal.target) * 100);
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">{goal.title}</span>
                  <span className="text-slate-400">
                    {goal.unit === "$"
                      ? `$${formatNumber(goal.current)}`
                      : formatNumber(goal.current)}{" "}
                    /
                    {goal.unit === "$"
                      ? ` $${formatNumber(goal.target)}`
                      : ` ${formatNumber(goal.target)}`}
                    {goal.unit !== "$" ? ` ${goal.unit}` : ""}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${goal.color}-500 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-slate-400 text-right">
                  {percentage}% Complete
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Modal with Tailwind */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg w-full max-w-md overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-lg font-medium text-white">
                Set Target Values
              </h3>
              <button
                onClick={() => {
                  if (goalsSetup) {
                    setIsModalOpen(false);
                  } else {
                    setIsModalOpen(false);
                    setGoalsSetup(false);
                  }
                }}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <label htmlFor="monthlyViews" className="text-slate-300 flex-1">
                  Monthly Views Target
                </label>
                <input
                  id="monthlyViews"
                  name="monthlyViews"
                  type="number"
                  value={targetValues.monthlyViews}
                  onChange={handleInputChange}
                  min={0}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-white w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <label
                  htmlFor="subscriberGrowth"
                  className="text-slate-300 flex-1"
                >
                  Subscriber Growth Target
                </label>
                <input
                  id="subscriberGrowth"
                  name="subscriberGrowth"
                  type="number"
                  value={targetValues.subscriberGrowth}
                  onChange={handleInputChange}
                  min={0}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-white w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                <label
                  htmlFor="revenueTarget"
                  className="text-slate-300 flex-1"
                >
                  Revenue Target
                </label>
                <input
                  id="revenueTarget"
                  name="revenueTarget"
                  type="number"
                  min={0}
                  value={targetValues.revenueTarget}
                  onChange={handleInputChange}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-white w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
              <button
                onClick={() => {
                  if (goalsSetup) {
                    setIsModalOpen(false);
                  } else {
                    setIsModalOpen(false);
                    setGoalsSetup(false);
                  }
                }}
                className="px-4 py-2 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTargets}
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  "Save Targets"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
