import seedrandom from "seedrandom";

const stableRandom = (card) => {
  const tokenID = card.tokenID().toString();

  return (seed) => {
    const generator = seedrandom(tokenID + seed);
    generator.mod = (n) => Math.abs(generator.int32()) % n;

    return generator;
  };
};

export default stableRandom;
