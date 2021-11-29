import { useRouter } from "next/router"
import PuzzleCard from "../public/PuzzleCard";
import CardViewer from "../components/CardViewer";

const Page = () => {
  const router = useRouter();
  const { tokenID } = router.query;

  if (!tokenID) { return null; }
  const card = PuzzleCard.fromTokenID(BigInt(tokenID));

  return <CardViewer card={card} />;
};

export default Page;
