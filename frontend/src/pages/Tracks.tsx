import { PageHeader } from "../components/PageHeader";
import { TopTracks } from "../components/TopTracks";

export default function Tracks() {
  return (
    <>
      <PageHeader
        title="Top Tracks"
        subtitle="Your most-played tracks over the selected window."
      />
      <TopTracks />
    </>
  );
}
