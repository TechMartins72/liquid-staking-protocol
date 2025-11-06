import { Check, X, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { NotificationType } from "../App";

interface NotificationCenterProps {
  notification: {
    type: NotificationType;
    message: string;
  } | null;
  onClose: () => void;
}

const NotificationCenter = ({
  notification,
  onClose,
}: NotificationCenterProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
    }
  }, [notification]);

  useEffect(() => {
    if (!notification) {
      setIsVisible(false);
    }
  }, [notification]);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 max-w-md transition-all duration-300 ${
        isVisible ? "animate-slide-in" : "animate-slide-out"
      }`}
    >
      <div
        className={`glass rounded-xl border border-border/50 p-4 flex items-start gap-4 ${
          notification.type === "success"
            ? "border-accent/50 bg-accent/5"
            : "border-destructive/50 bg-destructive/5"
        }`}
      >
        <div
          className={
            notification.type === "success" ? "text-accent" : "text-destructive"
          }
        >
          {notification.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1">
          <p
            className={`font-semibold text-sm ${
              notification.type === "success"
                ? "text-accent"
                : "text-destructive"
            }`}
          >
            {notification.type === "success" ? "Success" : "Error"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;
