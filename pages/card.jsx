import { useRouter } from "next/router"
import CardFront from "../components/CardFront";
import PuzzleCard from "../public/PuzzleCard";

const Tmp = () => {
  const router = useRouter();
  const { tokenID } = router.query;

  if (!tokenID) { return null; }
  //const card = PuzzleCard.fromTokenID(BigInt(tokenID));
  const card = new PuzzleCard({
    series: "Teamwork",
    puzzle: "I",
    tier: "Mortal",
    type: "Crab",
    color1: "None",
    color2: "None",
    variant: "Middle",
    condition: "Pristine",
    edition: "Standard",
  });

  return (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, background: "#999" }}>
      <div style={{ width: "45rem", height: "63rem", margin: "auto", marginTop: "5rem", position: "relative" }}>
        <CardFront card={card} />
      </div>

      <div style={{ width: "15rem", height: "21rem", margin: "auto", marginTop: "5rem", position: "absolute", left: "10rem", top: "5rem" }}>
        <CardFront card={card} />
      </div>
    </div>
  );
};

export default Tmp;