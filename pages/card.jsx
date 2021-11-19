import CardFront from "../components/CardFront";

const Tmp = () => {
  return (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, background: "#999" }}>
      <div style={{ width: "45rem", height: "63rem", margin: "auto", marginTop: "5rem", position: "relative" }}>
        <CardFront />
      </div>

      <div style={{ width: "15rem", height: "21rem", margin: "auto", marginTop: "5rem", position: "absolute", left: "10rem", top: "5rem" }}>
        <CardFront />
      </div>
    </div>
  );
};

export default Tmp;
