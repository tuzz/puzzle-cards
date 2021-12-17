import PuzzleCard from "../public/PuzzleCard";
import CardFront from "../components/CardFront";
import CardBack from "../components/CardBack";

// This page is used to create the featured and banner images for the OpenSea collection.

const Page = () => (
  <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, background: "url(/images/felt_cloth.jpeg)", backgroundSize: "10rem", paddingTop: "4rem" }}>
    <div style={{ transform: "scale(0.8)", display: "flex", justifyContent: "space-around" }}>
      <div style={{ position: "absolute", width: "16rem", height: "21rem", left: "calc(50% - 7.5rem)", top: "-13rem", border: "0.2rem solid rgba(255, 255, 255, 0.7)", borderRadius: "0.75rem", boxSizing: "border-box" }}></div>
      <img src="/images/poker_chip_black.png" style={{ position: "absolute", width: "9rem", height: "9rem", left: "-16rem", top: "10rem", display: "none" }} />
      <img src="/images/poker_chip_black.png" style={{ position: "absolute", width: "9rem", height: "9rem", left: "55%", top: "-13.5rem" }} />

      <div style={{ width: "15rem", height: "21rem", position: "relative", display: "inline-block", transform: "translate(1rem, 1rem) rotate(10deg)" }}>
        <CardFront videoQuality="high" scaleShadows={true} card={new PuzzleCard({
          series: "Contending Claws",
          puzzle: "Island Hopping",
          tier: "Godly",
          type: "Crab",
          color1: "None",
          color2: "None",
          variant: "Point Left",
          condition: "Dire",
          edition: "Standard",
        })} />
      </div>

      <div style={{ position: "relative", top: "2rem" }}>
        <div style={{ width: "15rem", height: "21rem", position: "absolute", transform: "rotate(15deg) translate(-2rem, -1rem)" }}>
          <CardBack defects={{}} isMasterCopy={false} scaleShadows={true} />
        </div>

        <div style={{ width: "15rem", height: "21rem", position: "absolute", transform: "rotate(12deg) translate(-2rem, -1rem)" }}>
          <CardBack defects={{}} isMasterCopy={false} scaleShadows={true} />
        </div>

        <div style={{ width: "15rem", height: "21rem", position: "absolute", transform: "rotate(9deg) translate(-2rem, -1rem)" }}>
          <CardBack defects={{}} isMasterCopy={false} scaleShadows={true} />
        </div>

        <div style={{ width: "15rem", height: "21rem", position: "relative", transform: "rotate(6deg) translate(-2rem, -1rem)" }}>
          <CardBack defects={{}} isMasterCopy={false} scaleShadows={true} />
        </div>
      </div>

      <div style={{ width: "15rem", height: "21rem", position: "relative", display: "inline-block", transform: "translate(2rem, 1rem) rotate(-10deg)" }}>
        <CardFront videoQuality="high" scaleShadows={true} card={new PuzzleCard({
          series: "Star Gazing",
          puzzle: "Mysterious Aura",
          tier: "Master",
          type: "Artwork",
          color1: "None",
          color2: "None",
          variant: "Two Torches",
          condition: "Pristine",
          edition: "Master Copy",
        })} />
      </div>

      <div style={{ width: "15rem", height: "21rem", position: "relative", display: "inline-block", transform: "translate(5rem, 1rem) rotate(-5deg)" }}>
        <CardFront videoQuality="high" scaleShadows={true} card={new PuzzleCard({
          series: "Teamwork",
          puzzle: "Balancing Act II",
          tier: "Immortal",
          type: "Player",
          color1: "None",
          color2: "None",
          variant: "Jump Left 3",
          condition: "Dire",
          edition: "Standard",
        })} />
      </div>
    </div>
  </div>
);

export default Page;
