"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className="mx-auto w-full max-w-[440px]">
          <CardHeader className="space-y-4 pb-10">
            <CardTitle className="text-[48px] font-[330] leading-[1.1] tracking-[-0.01em]">
              Check your email
            </CardTitle>
            <CardDescription className="text-base leading-7 text-shade-50">
              Password reset instructions sent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-shade-50">
              If you registered with that email you&apos;ll receive a reset
              link shortly. Check your spam folder if it doesn&apos;t arrive.
            </p>
            <div className="mt-8 text-center text-sm text-shade-50">
              <Link
                href="/auth/login"
                className="font-medium text-foreground transition-colors hover:text-neon-green"
              >
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-[440px]">
          <CardHeader className="space-y-4 pb-10">
            <CardTitle className="text-[48px] font-[330] leading-[1.1] tracking-[-0.01em]">
              Forgot password?
            </CardTitle>
            <CardDescription className="text-base leading-7 text-shade-50">
              Enter your email and we&apos;ll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-3">
                  <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="mt-4 w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
              <div className="mt-8 text-center text-sm text-shade-50">
                Remember it?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-foreground transition-colors hover:text-neon-green"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
