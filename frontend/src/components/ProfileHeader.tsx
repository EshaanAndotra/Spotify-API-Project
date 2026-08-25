import { useEffect, useState } from "react";
import { api, ApiError, type UserProfile } from "../api/client";

/**
 * Vertical profile block intended for the bottom of the sidebar:
 * avatar + name on top row, tier on the next, log out button below.
 *
 * Name kept as ProfileHeader for continuity, even though it's no longer in the header.
 */
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
        // Profile fetch failures are non-fatal — leave profile unset.
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
      if (err instanceof ApiError) console.warn("Logout API error:", err.message);
    }
    // Full reload kicks the app back to the unauthenticated state cleanly.
    window.location.reload();
  }

  const avatar = profile?.images[0]?.url ?? null;
  const name = profile?.display_name || profile?.id || "Connected";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-surface-border" />
        )}
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium text-zinc-100">
            {name}
          </div>
          {profile?.product && (
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              {profile.product}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-full border border-surface-border px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 disabled:opacity-50"
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
