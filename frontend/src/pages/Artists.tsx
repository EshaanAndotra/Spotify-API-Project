import { PageHeader } from "../components/PageHeader";
import { TopArtists } from "../components/TopArtists";

export default function Artists() {
  return (
    <>
      <PageHeader
        title="Top Artists"
        subtitle="Your most-played artists over the selected window."
      />
      <TopArtists />
    </>
  );
}
