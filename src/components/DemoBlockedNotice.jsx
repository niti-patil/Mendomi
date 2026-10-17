import React from "react";
import { Lock, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { isDemoMode } from "@/lib/demoClient";

export default function DemoBlockedNotice({ title = "This feature needs an account", message = "Demo users can't test this until an account is created." }) {
  if (!isDemoMode()) return null;
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-amber-300 bg-amber-50/80 px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <Lock className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <h3 className="font-display text-lg font-semibold text-amber-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-amber-800">{message}</p>
      <Link
        to="/auth"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <UserPlus className="h-4 w-4" /> Create an account
      </Link>
    </div>
  );
}