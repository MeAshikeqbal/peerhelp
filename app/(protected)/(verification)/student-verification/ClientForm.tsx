"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getProfileById } from "@/utils/query/profiles";
import { Loader2, Building2, Check } from "lucide-react";

type CollegeSuggestion = { name: string; country?: string; web_pages?: string[] };

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-foreground font-medium">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function ClientForm({ message }: { message: string | null }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [suggestions, setSuggestions] = useState<CollegeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!mounted) return;
        if (!user) return;

        const { data: profile } = await getProfileById(supabase, user.id);

        if (!mounted) return;
        if (profile?.verification_status === "verified") {
          router.replace("/dashboard");
          return;
        }
        if (profile?.full_name?.trim()) setFullName(profile.full_name.trim());
        if (profile?.college_name) setCollegeName(profile.college_name);
        if (profile?.college_email) setCollegeEmail(profile.college_email);
      } catch (err) {
        console.error("Failed to load profile in verification form:", err);
      }
    })();

    return () => { mounted = false; };
  }, [router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const selectSuggestion = useCallback((name: string) => {
    setCollegeName(name);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  function handleCollegeInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setCollegeName(v);
    setActiveIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (v.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/universities?q=${encodeURIComponent(v)}`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setSuggestions((data || []).slice(0, 8));
        setIsOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleCollegeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex].name);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/student-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeName,
          collegeEmail,
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.code === "already-verified") {
          router.replace("/dashboard");
          return;
        }
        setError(data.message || "Failed to send verification code.");
        return;
      }

      if (data.requiresReview) {
        router.push("/student-verification/pending-review");
        return;
      }

      router.push("/student-verification/otp");
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showDropdown = isOpen && (loading || suggestions.length > 0 || (collegeName.length >= 3 && !loading));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-3">
        <Label htmlFor="fullName" className="text-sm text-foreground">
          Full name
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      {/* College name combobox */}
      <div className="grid gap-3">
        <Label htmlFor="collegeName" className="text-sm text-foreground">
          College or university
        </Label>
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Input
              id="collegeName"
              type="text"
              placeholder="Start typing your institution…"
              value={collegeName}
              onChange={handleCollegeInput}
              onKeyDown={handleCollegeKeyDown}
              onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
              required
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
              aria-controls="college-listbox"
              aria-activedescendant={activeIndex >= 0 ? `college-option-${activeIndex}` : undefined}
              className="pr-9"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-shade-50">
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Building2 className="h-4 w-4" />
              }
            </span>
          </div>

          {showDropdown && (
            <ul
              id="college-listbox"
              ref={listRef}
              role="listbox"
              className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-overlay/10 bg-card shadow-card-elevated"
              style={{ maxHeight: "14rem", overflowY: "auto" }}
            >
              {loading && suggestions.length === 0 ? (
                <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-shade-50">
                  <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                  Searching…
                </li>
              ) : suggestions.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-shade-50">No results found.</li>
              ) : (
                suggestions.map((s, i) => {
                  const isActive = i === activeIndex;
                  const isSelected = s.name === collegeName;
                  return (
                    <li
                      key={s.name}
                      id={`college-option-${i}`}
                      role="option"
                      aria-selected={isActive}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        selectSuggestion(s.name);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                        isActive ? "bg-overlay/10 text-foreground" : "text-shade-50 hover:bg-overlay/5 hover:text-foreground"
                      }`}
                    >
                      <span className="flex-1 truncate">{highlightMatch(s.name, collegeName)}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-neon-green" />}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="collegeEmail" className="text-sm text-foreground">
          College or personal email
        </Label>
        <Input
          id="collegeEmail"
          type="email"
          required
          placeholder="you@college.edu or you@gmail.com"
          value={collegeEmail}
          onChange={(e) => setCollegeEmail(e.target.value)}
        />
        <p className="text-xs text-shade-50">
          Institutional email (.edu, .ac.in, etc.) will be verified instantly via OTP.
          Personal email (Gmail, Yahoo, etc.) will go through manual review.
        </p>
      </div>

      {(message || error) ? (
        <p className="text-sm text-red-400">{error ?? message}</p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting..." : "Continue"}
      </Button>
    </form>
  );
}
