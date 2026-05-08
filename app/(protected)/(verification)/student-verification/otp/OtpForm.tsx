"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function OtpForm({ message }: { message: string | null }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResendMessage(null);

    try {
      const res = await fetch("/api/student-verification/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.code === "already-verified") {
          router.replace("/dashboard");
          return;
        }
        router.push(
          `/student-verification/otp?error=${encodeURIComponent(data.code || "otp-verify")}`,
        );
        return;
      }

      // Check for pending-review status (manual review required)
      if (data?.needsReview) {
        router.replace("/student-verification/pending-review");
        return;
      }

      // Auto-verified (academic domain)
      if (data?.verified) {
        router.replace("/dashboard");
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error(error);
      router.push("/student-verification/otp?error=otp-verify");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);

    try {
      const res = await fetch("/api/student-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const error = await res.json();
        if (res.status === 429) {
          setResendMessage(`Too many requests. Try again in ${error.retryAfter} seconds.`);
          if (error.nextRetryAt) {
            // Calculate seconds until nextRetryAt
            const nextRetryTime = new Date(error.nextRetryAt).getTime();
            const secondsUntilRetry = Math.ceil((nextRetryTime - Date.now()) / 1000);
            setResendCooldown(Math.max(1, secondsUntilRetry));
          } else if (error.retryAfter) {
            setResendCooldown(Math.max(30, Number(error.retryAfter)));
          }
        } else {
          setResendMessage(error.message || "Failed to resend OTP");
        }
        return;
      }

      setResendMessage("OTP sent! Check your email.");
      
      // Use server's nextRetryAt to sync cooldown with rate limit policy
      const data = await res.json();
      if (data?.nextRetryAt) {
        const nextRetryTime = new Date(data.nextRetryAt).getTime();
        const secondsUntilRetry = Math.ceil((nextRetryTime - Date.now()) / 1000);
        setResendCooldown(Math.max(1, secondsUntilRetry));
      } else {
        // Fallback to 60 seconds (conservative default)
        setResendCooldown(60);
      }
      
      setOtp("");
    } catch (error) {
      console.error(error);
      setResendMessage("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-3">
        <Label htmlFor="otp" className="text-sm text-foreground">
          Verification code (6 digits)
        </Label>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          required
        />
      </div>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}
      {resendMessage ? (
        <p className={`text-sm ${resendMessage.includes("sent") || resendMessage.includes("Check") ? "text-green-400" : "text-yellow-400"}`}>
          {resendMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || otp.length !== 6} className="w-full">
        {submitting ? "Verifying..." : "Verify"}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleResend}
        disabled={resending || resendCooldown > 0}
        className="w-full"
      >
        {resending
          ? "Sending..."
          : resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend OTP"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push("/student-verification")}
        className="w-full"
      >
        Back to college info
      </Button>
    </form>
  );
}