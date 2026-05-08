import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-void p-6 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(54,244,164,0.12),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(16,38,32,0.65),_transparent_45%)]" />
      <div className="relative z-10 w-full max-w-[440px]">
        <Card>
          <CardHeader className="space-y-4 pb-8">
            <CardTitle className="text-[40px] font-[330] leading-[1.08]">
              Thank you for signing up!
            </CardTitle>
            <CardDescription className="text-base leading-7 text-shade-50">
              Check your email to confirm your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-shade-50">
              You&apos;ve successfully signed up. Please check your email to
              confirm your account before signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
