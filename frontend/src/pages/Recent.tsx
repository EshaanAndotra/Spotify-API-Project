import { PageHeader } from "../components/PageHeader";
import { Recent as RecentList } from "../components/Recent";

export default function Recent() {
  return (
    <>
      <PageHeader
        title="Recently Played"
        subtitle="The last 20 tracks you listened to. Spotify caps history at 50 plays within 24 hours."
      />
      <RecentList />
    </>
  );
}
