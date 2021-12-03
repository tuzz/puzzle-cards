import { useRouter } from "next/router"
import PuzzleCard from "../public/PuzzleCard";
import CardViewer from "../components/CardViewer";

const Page = () => {
  const router = useRouter();
  const { tokenID, referrer } = router.query;

  if (!tokenID) { return null; }
  const card = PuzzleCard.fromTokenID(BigInt(tokenID));

  //const card = new PuzzleCard({
  //  series: "Teamwork",
  //  puzzle: "Teamwork I",
  //  tier: "Master",
  //  type: "Artwork",
  //  color1: "None",
  //  color2: "None",
  //  variant: "Ladder Tree",
  //  condition: "Pristine",
  //  edition: "Master Copy",
  //});

  return <CardViewer card={card} referrer={referrer} />;
};

export default Page;
