import CardFront from "../CardFront";

const CardViewer = ({ card }) => {
  return (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, background: "#999" }}>
      <div style={{ width: "15rem", height: "21rem", margin: "auto", marginTop: "5rem", position: "absolute", left: "10rem", top: "5rem" }}>
        <CardFront card={card} />
      </div>
    </div>
  );
};

export default CardViewer;
