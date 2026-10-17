import { useEffect, useRef, useState } from "react";
import { Loader2, Check } from "lucide-react";

export default function SaveButton({ save, saving }) {
  const [justSaved, setJustSaved] = useState(false);
  const prev = useRef(false);

  useEffect(() => {
    if (prev.current && !saving) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2000);
      prev.current = saving;
      return () => clearTimeout(t);
    }
    prev.current = saving;
  }, [saving]);

  return (
    <div className="mt-4">
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        ) : justSaved ? (
          <><Check className="h-4 w-4" /> Saved</>
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );
}