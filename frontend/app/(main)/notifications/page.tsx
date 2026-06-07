import { NotificationList } from "@/components/notifications/NotificationList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View your latest notifications on tarng.",
};

export default function NotificationsPage() {
  return (
    <div className="pt-4 px-4 md:px-0 pb-12">
      <NotificationList />
    </div>
  );
}
