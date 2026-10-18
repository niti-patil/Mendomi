import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import { useState } from "react";
import { Globe, Bell, Trash2, Loader2 } from "lucide-react";

import { usePatientProfile } from "@/hooks/usePatientProfile";
import SettingsShell, { SectionCard, Spinner } from "@/components/settings/SettingsShell";
import SaveButton from "@/components/settings/SaveButton";
import BottomSheetSelect from "@/components/ui/bottom-sheet-select";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const COMMON_TZ = ["America/Los_Angeles","America/Denver","America/Chicago","America/New_York","America/Anchorage","Pacific/Honolulu","Europe/London","Europe/Paris","Asia/Tokyo","Australia/Sydney"];

export default function OtherSettings() {
  const { profile, patch, save, saving } = usePatientProfile();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true); setDeleteError("");
    try {
      if (typeof db.auth.deleteAccount === "function") {
        await db.auth.deleteAccount();
      } else {
        await db.auth.logout();
      }
      setDeleted(true);
      setDeleteOpen(false);
    } catch (e) {
      setDeleteError(e.message || "Could not delete account. Please try again or contact support.");
    } finally {
      setDeleting(false);
    }
  };

  if (!profile) return <Spinner />;
  return (
    <SettingsShell title="Other" subtitle="Time zone and account." icon={Globe}>
      <SectionCard icon={Globe} title="Time zone" subtitle="Used for scheduling reminders">
        <BottomSheetSelect
          value={profile.time_zone || ""}
          onValueChange={(v) => patch({ time_zone: v })}
          placeholder="Select timezone"
          triggerClassName="ipt"
          options={[
            ...(!COMMON_TZ.includes(profile.time_zone) && profile.time_zone ? [{ value: profile.time_zone, label: profile.time_zone }] : []),
            ...COMMON_TZ.map((tz) => ({ value: tz, label: tz })),
          ]}
        />
      </SectionCard>
      <SectionCard icon={Bell} title="Account">
        {deleted ? (
          <p className="text-sm font-medium text-success">Your account has been scheduled for deletion. You can close this page.</p>
        ) : (
          <>
            <div className="border-t border-border pt-4">
              <p className="mb-1 text-sm font-semibold text-foreground">Delete account</p>
              <p className="mb-3 text-xs text-muted-foreground">Permanently erase your profile, recovery plan, check-ins, and uploaded documents. This cannot be undone.</p>
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4" /> Delete account
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently erase your profile, recovery plan, check-ins, and uploaded documents. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => { e.preventDefault(); deleteAccount(); }}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : "Yes, delete forever"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </SectionCard>
      <SaveButton save={save} saving={saving} />
    </SettingsShell>
  );
}