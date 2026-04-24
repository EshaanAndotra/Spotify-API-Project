/**
 * Thin fetch wrapper pointing at the FastAPI backend.
 *
 * Routes gain typed wrappers as they come online. For now only /health is
 * wired — the scaffold needs at least one round-trip to prove the pipe is
 * clear before we build feature components.
 */

const BASE_URL = "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`API ${status}: ${detail}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body && typeof body.detail === "string") detail = body.detail;
    } catch {
      // Response body isn't JSON — keep statusText.
    }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content or empty body.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface HealthResponse {
  status: string;
  authenticated: boolean;
}

export interface UserImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  product: string | null;
  followers: number | null;
  images: UserImage[];
  external_url: string | null;
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface ArtistRef {
  id: string;
  name: string;
  external_url: string | null;
}

export interface AlbumRef {
  id: string;
  name: string;
  release_date: string | null;
  image_url: string | null;
  external_url: string | null;
}

export interface Track {
  id: string;
  name: string;
  artists: ArtistRef[];
  album: AlbumRef;
  duration_ms: number;
  popularity: number | null;
  preview_url: string | null;
  external_url: string | null;
}

export interface TopTracksResponse {
  range: TimeRange;
  items: Track[];
}

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity: number | null;
  followers: number | null;
  image_url: string | null;
  external_url: string | null;
}

export interface TopArtistsResponse {
  range: TimeRange;
  items: Artist[];
}

export interface PlayContext {
  type: string;
  external_url: string | null;
}

export interface RecentPlay {
  track: Track;
  played_at: string; // ISO 8601
  context: PlayContext | null;
}

export interface RecentResponse {
  items: RecentPlay[];
}

export const api = {
  loginUrl: () => `${BASE_URL}/login`,
  health: () => request<HealthResponse>("/health"),
  me: () => request<UserProfile>("/me"),
  logout: () => request<{ ok: boolean }>("/logout", { method: "POST" }),
  topTracks: (range: TimeRange, limit = 20) =>
    request<TopTracksResponse>(
      `/top/tracks?range=${range}&limit=${limit}`,
    ),
  topArtists: (range: TimeRange, limit = 20) =>
    request<TopArtistsResponse>(
      `/top/artists?range=${range}&limit=${limit}`,
    ),
  recent: (limit = 20) =>
    request<RecentResponse>(`/recent?limit=${limit}`),
};
