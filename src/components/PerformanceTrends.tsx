import React from "react";
import { LineChart } from "lucide-react";
import { Line } from "react-chartjs-2";

interface PerformanceTrendsProps {
  performanceData: {
    labels: string[];
    views: number[];
    engagement: number[];
    revenue: number[];
  };
}

export const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({
  performanceData,
}) => {
  return (
    <div className="col-span-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <LineChart className="h-5 w-5 text-indigo-400 mr-2" />
        Performance Trends
      </h3>
      <div className="h-[300px] w-full">
        <Line
          data={{
            labels: performanceData.labels,
            datasets: [
              {
                label: "Views",
                data: performanceData.views,
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.4,
                fill: true,
              },
              {
                label: "Engagement Rate",
                data: performanceData.engagement,
                borderColor: "rgb(168, 85, 247)",
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                tension: 0.4,
                fill: true,
              },
              {
                label: "Revenue",
                data: performanceData.revenue,
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: "index",
            },
            scales: {
              y: {
                grid: {
                  color: "rgba(148, 163, 184, 0.1)",
                },
                ticks: {
                  color: "rgb(148, 163, 184)",
                },
              },
              x: {
                grid: {
                  color: "rgba(148, 163, 184, 0.1)",
                },
                ticks: {
                  color: "rgb(148, 163, 184)",
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: "rgb(148, 163, 184)",
                },
              },
              tooltip: {
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                titleColor: "rgb(255, 255, 255)",
                bodyColor: "rgb(148, 163, 184)",
                borderColor: "rgba(148, 163, 184, 0.2)",
                borderWidth: 1,
              },
            },
          }}
        />
      </div>
    </div>
  );
};
