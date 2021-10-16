import { useContext } from "react";
import AppContext from "../components/AppContext";

const Index = () => {
  const { PuzzleCard, address } = useContext(AppContext);

  return <>
    <p>hi {address}</p>
  </>;
};

export default Index;
