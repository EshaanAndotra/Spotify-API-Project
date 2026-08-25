import { NavLink, Outlet } from "react-router-dom";
import { ProfileHeader } from "./ProfileHeader";

/**
 * Authenticated app shell: fixed-width left sidebar, scrollable main area.
 *
 * Sidebar layout, top to bottom:
 *  - Brand title
 *  - Nav links (Top Tracks, Top Artists, Recent)
 *  - Spacer
 *  - Profile + log out
 *
 * Main area renders the active <Route> via <Outlet />.
 */
export function Layout() {
  return (
    <div className="min-h-screen bg-surface text-zinc-100 font-sans flex">
      <aside className="w-60 shrink-0 border-r border-surface-border flex flex-col">
        <div className="px-6 pt-7 pb-6">
          <div className="text-lg font-semibold tracking-tight">
            Listening Stats
          </div>
          <div className="text-xs text-zinc-500 mt-1">v0</div>
        </div>

        <nav className="px-3 flex-1">
          <ul className="space-y-1">
            <SidebarLink to="/tracks" label="Top Tracks" />
            <SidebarLink to="/artists" label="Top Artists" />
            <SidebarLink to="/recent" label="Recently Played" />
            <SidebarLink to="/insights" label="Insights" />
          </ul>
        </nav>

        <div className="px-6 pb-6 pt-4 border-t border-surface-border">
          <ProfileHeader />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-4xl px-10 py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          [
            "block rounded-md px-3 py-2 text-sm",
            isActive
              ? "bg-surface-raised text-spotify font-medium"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-surface-raised/60",
          ].join(" ")
        }
      >
        {label}
      </NavLink>
    </li>
  );
}
