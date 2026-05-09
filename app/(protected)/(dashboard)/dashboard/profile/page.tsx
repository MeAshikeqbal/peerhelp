import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Clock, ShieldAlert,
  BookOpen, Handshake, GraduationCap,
  Mail, Building2, KeyRound, ChevronRight, Phone, Bell, Ban,
} from "lucide-react";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PhoneForm } from "@/components/profile/PhoneForm";
import { ReverifyButton } from "@/components/profile/ReverifyButton";
import { NotificationPrefsForm } from "@/components/profile/NotificationPrefsForm";
import { BlockedUsersList } from "@/components/profile/BlockedUsersList";
import { PushSubscribeButton } from "@/components/pwa/PushSubscribeButton";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById, getOwnPhone } from "@/utils/query/profiles";
import { countUserListings } from "@/utils/query/listings";
import { countUserDeals } from "@/utils/query/deals";
import { getNotificationPrefs } from "@/utils/query/notifications";

function VerificationBadge({ status }: { status: string | null }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20">
        <ShieldCheck size={11} />
        Verified Student
      </span>
    );
  }
  if (status === "pending" || status === "pending_manual") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        <Clock size={11} />
        Pending Verification
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
      <ShieldAlert size={11} />
      Not Verified
    </span>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { user, error: userError } = await getCurrentUser(supabase);
  if (userError || !user) redirect("/auth/login");

  const [{ data: profile }, { count: listingsCount }, { count: dealsCount }, { data: phoneData }] = await Promise.all([
    getProfileById(supabase, user.id),
    countUserListings(supabase, user.id),
    countUserDeals(supabase, user.id),
    getOwnPhone(supabase),
  ]);

  const notifPrefs = await getNotificationPrefs(supabase, user.id);

  const phoneNumber = (phoneData as string | null) ?? null;

  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Student";

  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account and personal details.</p>
      </div>

      {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl border border-overlay/[0.07] bg-forest mb-5">
          <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-neon-green/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-10 h-48 w-48 rounded-full bg-neon-green/5 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 px-5 py-6 sm:px-7 sm:py-8">
            <AvatarUploader
              currentUrl={profile?.avatar_url ?? null}
              name={profile?.full_name ?? null}
              email={user.email ?? ""}
            />

            <div className="flex-1 min-w-0">
              <ProfileForm initialName={profile?.full_name ?? ""} displayName={displayName} />
              <p className="text-sm text-shade-50 mt-0.5 mb-3">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                <VerificationBadge status={profile?.verification_status ?? null} />
                {profile?.verification_status !== "verified" && (
                  <Link
                    href="/student-verification"
                    className="text-xs text-shade-50 hover:text-neon-green transition-colors underline underline-offset-2"
                  >
                    Verify now
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats + details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: account + security — shown after stats on mobile */}
          <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
            <section className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
              <div className="px-6 pt-5 pb-2">
                <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">Account</h2>
              </div>
              <div className="divide-y divide-white/[0.05]">
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-overlay/5">
                    <Mail size={14} className="text-shade-50" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-shade-50 mb-0.5">Login Email</p>
                    <p className="text-sm text-foreground truncate">{user.email}</p>
                  </div>
                </div>
                {profile?.college_email && (
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-overlay/5">
                      <GraduationCap size={14} className="text-shade-50" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-shade-50 mb-0.5">College Email</p>
                      <p className="text-sm text-foreground truncate">{profile.college_email}</p>
                    </div>
                  </div>
                )}
                {profile?.college_name && (
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-overlay/5">
                      <Building2 size={14} className="text-shade-50" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-shade-50 mb-0.5">Institution</p>
                      <p className="text-sm text-foreground truncate">{profile.college_name}</p>
                    </div>
                  </div>
                )}

                {/* Phone number row */}
                <div className="flex items-start gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-overlay/5">
                    <Phone size={14} className={phoneNumber ? "text-shade-50" : "text-amber-400"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-shade-50 mb-1">Phone Number</p>
                    <PhoneForm initialPhone={phoneNumber ?? ""} />
                    {!phoneNumber && (
                      <p className="mt-1 text-[11px] text-amber-400/80">Required to post listings</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
              <div className="px-6 pt-5 pb-2">
                <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">Security</h2>
              </div>
              <Link
                href="/auth/update-password"
                className="group flex items-center justify-between px-6 py-4 hover:bg-overlay/[0.03] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-overlay/5">
                    <KeyRound size={14} className="text-shade-50" />
                  </div>
                  <span className="text-sm text-foreground">Change password</span>
                </div>
                <ChevronRight size={15} className="text-shade-50 group-hover:text-foreground transition-colors" />
              </Link>
              <div className="border-t border-overlay/[0.05]">
                <ReverifyButton />
              </div>
            </section>

            {/* Email notification preferences */}
            <section className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
              <div className="flex items-center gap-2 px-6 pt-5 pb-2">
                <Bell size={12} className="text-shade-50" />
                <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">Email Notifications</h2>
              </div>
              <NotificationPrefsForm initialPrefs={notifPrefs} />
            </section>

            {/* Push notifications */}
            <section className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
              <div className="flex items-center gap-2 px-6 pt-5 pb-2">
                <Bell size={12} className="text-shade-50" />
                <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">Push Notifications</h2>
              </div>
              <PushSubscribeButton />
            </section>

            {/* Blocked users */}
            <section className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
              <div className="flex items-center gap-2 px-6 pt-5 pb-2">
                <Ban size={12} className="text-shade-50" />
                <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">Blocked users</h2>
              </div>
              <BlockedUsersList />
            </section>
          </div>

          {/* Right: activity stats — first on mobile, sidebar on desktop */}
          <div className="order-1 lg:order-2">
            <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest px-1 mb-3">Activity</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
              {[
                { icon: BookOpen, label: "Listings", value: listingsCount ?? 0, href: "/dashboard/my-listings" },
                { icon: Handshake, label: "Deals", value: dealsCount ?? 0, href: "/dashboard/deals" },
              ].map(({ icon: Icon, label, value, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center justify-between rounded-2xl border border-overlay/[0.07] bg-forest px-4 py-4 sm:px-5 sm:py-5 hover:border-neon-green/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5 text-shade-50 group-hover:text-neon-green transition-colors">
                      <Icon size={12} />
                      <span className="text-[10px] uppercase tracking-widest">{label}</span>
                    </div>
                    <p className="text-3xl font-bold font-display text-foreground">{value}</p>
                  </div>
                  <ChevronRight size={15} className="text-shade-60 group-hover:text-neon-green transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </>
  );
}
