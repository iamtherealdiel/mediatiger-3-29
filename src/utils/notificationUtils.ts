import { SupabaseClient } from "@supabase/supabase-js";

interface NotificationHandlers {
  setNotifications: (notifications: any[]) => void;
  setHasNewNotification: (value: boolean) => void;
  setNotifNumber: (value: number) => void;
}

export const clearNotifications = async (
  supabase: SupabaseClient,
  userId: string,
  handlers: NotificationHandlers
) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    handlers.setNotifications([]);
    handlers.setHasNewNotification(false);
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw error;
  }
};

export const markAllAsRead = async (
  supabase: SupabaseClient,
  userId: string,
  handlers: NotificationHandlers
) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    handlers.setNotifNumber(0);
    handlers.setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    handlers.setHasNewNotification(false);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};
