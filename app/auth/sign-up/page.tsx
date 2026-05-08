import { SignUpForm } from "@/components/auth/sign-up-form";

export default function Page() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-void p-6 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(54,244,164,0.12),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(16,38,32,0.65),_transparent_45%)]" />
      <div className="relative z-10 w-full px-4">
        <SignUpForm />
      </div>
    </div>
  );
}
