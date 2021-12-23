const fs = require("fs")
const batchSize = 1000;

let PuzzleCard;
try {
  PuzzleCard = require("../public/PuzzleCard.js");
} catch (e) {
  // The require path is different from the GitHub action.
  PuzzleCard = require("../../../../PuzzleCard.js");
}

const main = async () => {
  fs.mkdirSync("public/decks", { recursive: true });
  PuzzleCard.attach(ethers, ethers.provider);

  let minBlock = PuzzleCard.CONTRACT_BLOCK;

  if (fs.existsSync("public/decks/_last_indexed")) {
    minBlock = parseInt(fs.readFileSync("public/decks/_last_indexed", "utf8"), 10) + 1;
  }

  const maxBlock = (await PuzzleCard.CONTRACT.provider.getBlock("latest")).number;

  PuzzleCard.attach(ethers, ethers.provider);
  await PuzzleCard.fetchBalances({ minBlock, maxBlock, onFetch: updateDeck, onProgress: console.log });

  fs.writeFileSync("public/decks/_last_indexed", maxBlock.toString());
};

const updateDeck = (address, tokenIDs, quantitiesChanged) => {
  if (address === "0x0000000000000000000000000000000000000000") { return; }

  let deck = { balanceByTokenID: {}, mostRecentFirst: [] };

  if (fs.existsSync(`public/decks/${address}.json`)) {
    deck = JSON.parse(fs.readFileSync(`public/decks/${address}.json`, "utf8"));
  }

  PuzzleCard.updateDeckIndex(deck, tokenIDs, quantitiesChanged);

  fs.writeFileSync(`public/decks/${address}.json`, JSON.stringify(deck));
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
