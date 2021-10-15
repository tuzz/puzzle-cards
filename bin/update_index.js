const fs = require("fs")
const PuzzleCard = require("../public/PuzzleCard.js");
const batchSize = 1000;

const main = async () => {
  fs.mkdirSync("public/decks", { recursive: true });

  const lastBlock = (await ethers.provider.getBlock("latest")).number;
  let lastIndexed = PuzzleCard.CONTRACT_BLOCK;

  if (fs.existsSync("public/decks/_last_indexed")) {
    lastIndexed = parseInt(fs.readFileSync("public/decks/_last_indexed", "utf8"), 10);
  }

  PuzzleCard.attach(ethers, ethers.provider);

  let [eventCount, cardCount] = [0, 0];

  for (let block = lastIndexed + 1; block <= lastBlock; block += batchSize) {
    const fromBlock = block;
    const toBlock = Math.min(block + batchSize - 1, lastBlock);

    const batchFilter = PuzzleCard.CONTRACT.filters.TransferBatch();
    const batchLogs = await ethers.provider.getLogs({ ...batchFilter, fromBlock, toBlock });

    for (const log of batchLogs) {
      const event = PuzzleCard.CONTRACT.interface.parseLog(log);
      const [{ from, to, ids }, quantities] = [event.args, event.args[4]];

      updateDeck(from, ids, quantities, -1);
      updateDeck(to, ids, quantities, 1);

      eventCount += 1; cardCount += ids.length;
    }

    const singleFilter = PuzzleCard.CONTRACT.filters.TransferSingle();
    const singleLogs = await ethers.provider.getLogs({ ...singleFilter, fromBlock, toBlock });

    for (const log of singleLogs) {
      const event = PuzzleCard.CONTRACT.interface.parseLog(log);
      const { from, to, id, value: quantity } = event.args;

      updateDeck(from, [id], [quantity], -1);
      updateDeck(to, [id], [quantity], 1);

      eventCount += 1; cardCount += 1;
    }

    console.log(`${eventCount} events :: ${cardCount} cards :: ${lastBlock - block} blocks remaining`);
  }

  fs.writeFileSync("public/decks/_last_indexed", lastBlock.toString());
}

const updateDeck = (address, tokenIDs, quantities, direction) => {
  if (address === "0x0000000000000000000000000000000000000000") { return; }

  let deck = { balanceByTokenID: {}, mostRecentFirst: [] };

  if (fs.existsSync(`public/decks/${address}.json`)) {
    deck = JSON.parse(fs.readFileSync(`public/decks/${address}.json`, "utf8"));
  }

  for (let i = 0; i < tokenIDs.length; i += 1) {
    const tokenID = tokenIDs[i].toString();
    const quantity = quantities[i].toNumber();

    const position = deck.mostRecentFirst.indexOf(tokenID);
    if (position !== -1) { deck.mostRecentFirst.splice(position, 1); }

    const balance = deck.balanceByTokenID[tokenID] || 0;
    const newBalance = balance + quantity * direction;

    if (newBalance === 0) {
      delete deck.balanceByTokenID[tokenID];
    } else {
      deck.balanceByTokenID[tokenID] = newBalance;
      deck.mostRecentFirst.unshift(tokenID);
    }
  }

  fs.writeFileSync(`public/decks/${address}.json`, JSON.stringify(deck));
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
