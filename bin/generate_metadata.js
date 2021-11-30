const fs = require("fs")
const PuzzleCard = require("../public/PuzzleCard");

const standardTypes = { from: 0, to: 14 };
const masterTypes = { from: 15, to: 16 };

const nonLimitedEditions = ["Standard", "Signed"];
const standardEditionOnly = ["Standard"];

const main = async () => {
  let cardCombinations = 0;

  for (let puzzleIndex = 0; puzzleIndex < PuzzleCard.PUZZLE_NAMES.length; puzzleIndex += 1) {
    const puzzle = PuzzleCard.PUZZLE_NAMES[puzzleIndex];

    const seriesIndex = PuzzleCard.SERIES_FOR_EACH_PUZZLE[puzzleIndex];
    const series = PuzzleCard.SERIES_NAMES[seriesIndex];

    for (let tier of PuzzleCard.TIER_NAMES) {
      const isMasterTier = tier === "Master";
      const typesRange = isMasterTier ? masterTypes : standardTypes;

      for (let typeIndex = typesRange.from; typeIndex <= typesRange.to; typeIndex += 1) {
        const type = PuzzleCard.TYPE_NAMES[typeIndex];
        const isArtwork = type === "Artwork";

        const numColors = PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE[typeIndex];
        const numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[typeIndex];
        const variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[typeIndex];

        const color1Choices = numColors < 1 ? ["None"] : PuzzleCard.COLOR_NAMES;
        const color2Choices = numColors < 2 ? ["None"] : PuzzleCard.COLOR_NAMES;
        const variantChoices = numVariants < 1 ? ["None"] : PuzzleCard.VARIANT_NAMES.slice(variantOffset, variantOffset + numVariants);

        for (let color1 of color1Choices) {
          for (let color2 of color2Choices) {
            for (let variant of variantChoices) {
              for (let condition of PuzzleCard.CONDITION_NAMES) {
                const isPristine = condition === "Pristine";

                const editionChoices = isMasterTier && isArtwork && isPristine ? PuzzleCard.EDITION_NAMES :
                                       isMasterTier && isArtwork               ? nonLimitedEditions :
                                                                                 standardEditionOnly;

                for (let edition of editionChoices) {
                  const card = new PuzzleCard({ series, puzzle, tier, type, color1, color2, variant, condition, edition });
                  const filename = `public/metadata/${card.metadataID()}.json`;

                  const metadata = {
                    name: card.openSeaTitle(),
                    description: "Description",
                    image: "https://storage.googleapis.com/opensea-prod.appspot.com/creature/1.png",
                    animation_url: `https://1163-2a02-6b6c-60-0-419d-553a-1213-6374.ngrok.io/card?tokenID=${card.tokenID()}`,
                    attributes: card.openSeaProperties(),
                  };

                  fs.writeFileSync(filename, JSON.stringify(metadata, null, 2) + "\n");
                  cardCombinations += 1;
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(`${cardCombinations} card combinations written to public/metadata/`);
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
