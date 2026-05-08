"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface RatingFormProps {
  dealId: string;
  counterpartName: string;
  onSuccess: () => void;
}

export function RatingForm({ dealId, counterpartName, onSuccess }: RatingFormProps) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, score, comment: comment.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to submit rating");
        return;
      }
      onSuccess();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const display = hovered || score;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-border bg-overlay/[0.03] p-4 space-y-3"
    >
      <p className="text-sm font-medium text-foreground">
        Rate your experience with {counterpartName}
      </p>

      {/* Star selector */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setScore(n)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={24}
              className={
                n <= display
                  ? "fill-neon-green text-neon-green"
                  : "fill-transparent text-muted-foreground"
              }
            />
          </button>
        ))}
      </div>

      {/* Optional comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a comment (optional)"
        maxLength={500}
        rows={2}
        className="w-full rounded-md border border-border bg-forest px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/30 resize-none"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={score === 0 || isSubmitting}
          className="bg-neon-green text-void hover:bg-neon-green/90 font-semibold"
        >
          {isSubmitting ? "Submitting…" : "Submit rating"}
        </Button>
      </div>
    </form>
  );
}
