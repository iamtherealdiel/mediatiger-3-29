import { ReactElement } from "react";

export const getTypeIcon = (
  type: "success" | "warning" | "error" | "info"
): ReactElement => {
  switch (type) {
    case "success":
      return (
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    case "warning":
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      );
    case "error":
      return (
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
      );
    case "info":
      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
      );
    default:
      throw new Error(`Unsupported notification type: ${type}`);
  }
};
export const NotificationItem = ({
  notification,
  notificationType,
}: {
  notification: { title: string; content: string };
  notificationType: string;
}) => {
  return (
    <div className="fixed top-2 left-0 right-0 mx-auto w-80 z-50 animate-slide-in">
      <div
        className="
            bg-gray-200/90 backdrop-blur-md
            p-3 rounded-2xl shadow-lg 
            border border-gray-300/40
          "
      >
        <div className="flex items-start">
          {getTypeIcon(notificationType)}
          <div className="ml-3 flex-1 pt-1">
            <div className="text-gray-800 font-semibold text-base">
              {notification?.title}
            </div>
            <div className="text-gray-700 text-sm">{notification?.content}</div>
          </div>
          <div className="text-gray-500 text-xs self-start pt-1">now</div>
        </div>
      </div>
    </div>
  );
};
