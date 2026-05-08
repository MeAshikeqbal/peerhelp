"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  baseUrl?: string;
}

export function TutorsSearchBar({ baseUrl = "/tutors" }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("q") ?? "");

  useEffect(() => {
    setValue(sp.get("q") ?? "");
  }, [sp]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(sp.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    params.delete("page");
    router.push(`${baseUrl}?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative mb-6">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tutors by headline…"
        className="pl-9 h-11"
      />
    </form>
  );
}
