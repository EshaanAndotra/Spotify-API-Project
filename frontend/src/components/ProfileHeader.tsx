import { useEffect, useState } from "react";
import { api, ApiError, type UserProfile } from "../api/client";

export function ProfileHeader() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((_: unknown) => {
        // Profile fetch failures are non-fatal here — the status dot in App
        // already surfaces auth issues. Just leave profile unset.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch (err) {
      // Log but continue — we want the user back on the login screen regardless.
      if (err instanceof ApiError) console.warn("Logout API error:", err.message);
    }
    // Full reload kicks the app back to the unauthenticated state cleanly.
    window.location.reload();
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="inline-block h-2 w-2 rounded-full bg-spotify" />
        connected
      </div>
    );
  }

  const avatar = profile.images[0]?.url ?? null;
  const name = profile.display_name || profile.id;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-surface-border" />
        )}
        <div className="text-right leading-tight">
          <div className="text-sm font-medium text-zinc-100">{name}</div>
          {profile.product && (
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              {profile.product}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-full border border-surface-border px-3 py-1 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 disabled:opacity-50"
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
