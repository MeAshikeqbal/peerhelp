import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-12 h-full">
      <MessageSquare
        className="mb-4 h-12 w-12 text-shade-50/25"
        strokeWidth={1}
      />
      <p className="text-base font-medium text-foreground">
        Select a conversation
      </p>
      <p className="mt-1.5 text-sm text-shade-50 max-w-[220px]">
        Choose a chat from the sidebar to start messaging.
      </p>
    </div>
  );
}
