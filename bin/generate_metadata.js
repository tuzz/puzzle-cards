const fs = require("fs")
const PuzzleCard = require("../public/PuzzleCard");

const standardTypes = { from: 0, to: 13 };
const virtualTypes = { from: 0, to: 14 };
const masterTypes = { from: 15, to: 16 };

const nonLimitedEditions = ["Standard", "Signed"];
const standardEditionOnly = ["Standard"];

const main = async () => {
  let cardCombinations = 0;

  for (let puzzleIndex = 0; puzzleIndex < PuzzleCard.PUZZLE_NAMES.length; puzzleIndex += 1) {
    console.log(`${puzzleIndex + 1} / ${PuzzleCard.PUZZLE_NAMES.length}`);
    const puzzle = PuzzleCard.PUZZLE_NAMES[puzzleIndex];

    const seriesIndex = PuzzleCard.SERIES_FOR_EACH_PUZZLE[puzzleIndex];
    const series = PuzzleCard.SERIES_NAMES[seriesIndex];

    for (let tier of PuzzleCard.TIER_NAMES) {
      const isMasterTier = tier === "Master";
      const isVirtualTier = tier === "Virtual" || tier === "Godly";

      const typesRange = isMasterTier ? masterTypes : isVirtualTier ? virtualTypes : standardTypes;

      for (let typeIndex = typesRange.from; typeIndex <= typesRange.to; typeIndex += 1) {
        const type = PuzzleCard.TYPE_NAMES[typeIndex];
        const isArtwork = type === "Artwork";

        const numColors = PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE[typeIndex];
        const numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[typeIndex];
        const variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[typeIndex];

        const color1Choices = numColors < 1 ? ["None"] : PuzzleCard.COLOR_NAMES.slice(1);
        const color2Choices = numColors < 2 ? ["None"] : PuzzleCard.COLOR_NAMES.slice(1);
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
                    name: openSeaTitle(card),
                    description: openSeaDescription(card, PuzzleCard),
                    image: card.imageURL(),
                    animation_url: card.viewURL({ referrer: "animation_url" }),
                    external_url: card.viewURL({ referrer: "external_url" }),
                    attributes: openSeaProperties(card),
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

const openSeaTitle = (card) => {
  let name;

  switch (card.type) {
    case "Player":    name = `Player Card, ${card.tier} Tier`; break;
    case "Crab":      name = `Crab Card, ${card.tier} Tier`; break;
    case "Cloak":     name = `${card.color1} Cloak, ${card.tier} Tier`; break;
    case "Inactive":  name = `Inactive ${card.color1} ${card.variant}, ${card.tier} Tier`; break;
    case "Active":    name = `Active ${card.color1} ${card.variant}, ${card.tier} Tier`; break;
    case "Telescope": name = `${card.color1} ${card.variant} Telescope, ${card.tier} Tier`; break;
    case "Beacon":    name = `${card.color1} Beacon, ${card.tier} Tier`; break;
    case "Map":       name = `Map Card, ${card.tier} Tier`; break
    case "Teleport":  name = `Teleport Card, ${card.tier} Tier`; break;
    case "Eclipse":   name = `Eclipse Card, ${card.tier} Tier`; break;
    case "Door":      name = `Door Card, ${card.tier} Tier`; break;
    case "Hidden":    name = `Hidden Card, ${card.tier} Tier`; break;
    case "Star":      name = `${card.color1} Star, ${card.tier} Tier, ${card.condition} Condition`; break;

    case "Helix":     name = card.color1 === card.color2 ? `Double ${card.color1} Helix, ${card.tier} Tier`
                                                         : `${card.color1} and ${card.color2} Helix, ${card.tier} Tier`; break;

    case "Torch":     name = card.color1 === card.color2 ? `${card.color1} Torch, ${card.tier} Tier`
                                                         : `${card.color1} and ${card.color2} Torch, ${card.tier} Tier`; break;

    case "Glasses":   name = card.color1 === card.color2 ? `${card.color1} Glasses, ${card.tier} Tier`
                                                         : `${card.color1} and ${card.color2} Glasses, ${card.tier} Tier`; break;

    case "Artwork":   name = card.edition === "Standard" ? `${card.puzzle}, ${card.condition} Condition` :
                      name = card.edition === "Signed"   ? `${card.puzzle}, Signed by tuzz` :
                      name = card.edition === "Limited"  ? `${card.puzzle}, Limited Edition` :
                                                           `${card.puzzle}, Master Copy`; break;
  }

  return name;
}

const openSeaDescription = (card, PuzzleCard) => {
  let text = "Click above ^ for fullscreen.\n\n";

  switch (card.edition) {
    case "Standard": text += "This puzzle card can be combined with others as part of an original card game by [Chris Patuzzo](https://twitter.com/chrispatuzzo)."; break;
    case "Signed": text += `This puzzle card is a Signed edition of the '${card.puzzle}' puzzle.`; break;
    case "Limited": text += `This puzzle card is one of ${PuzzleCard.MAX_LIMITED_EDITIONS} Limited Editions of the '${card.puzzle}' puzzle.`; break;
    case "Master Copy": text += `This puzzle card is the Master Copy card of the '${card.puzzle}' puzzle.`; break;
  }

  if (card.type === "Artwork") {
    text += ` It features the '${card.variant}' artwork.`;
  }

  if (card.edition === "Master Copy") {
    text += "\n\nOwnership of this card represents ownership of the **actual puzzle from the video game**.";
    text += " Each puzzle is a discrete piece of artwork that includes all the design, iterative development and testing that goes into making an enjoyable experience.";
  }

  text += "\n\nAll artwork is hand drawn and is from the upcoming video game 'Worship the Sun' releasing in 2022.";
  text += "\n\nYou can play the card game for yourself and mint cards (from just $0.01) by visiting [this website](https://puzzlecards.github.io).";

  text += "\n\nSee 'About Worship the Sun Puzzle Cards' for more details.";

  return text;
};

const openSeaProperties = (card) => {
  const isLimited = card.edition === "Limited" || card.edition === "Master Copy";

  let properties = [
    { trait_type: "0. Card Type", value: card.type },
    { trait_type: "1. Color 1", value: card.color1 },
    { trait_type: "2. Color 2", value: card.color2 },
    { trait_type: "3. Variant", value: card.variant },
    { trait_type: "4. Signature", value: card.edition === "Standard" ? "None" : "Signed by tuzz" },
    { trait_type: "5. Edition", value: isLimited ? "Limited Edition" : "Standard Edition" },
    { trait_type: "6. Condition", value: `${card.conditionIndex() + 1}/5 ${card.condition}` },
    { trait_type: "7. Tier", value: `${card.tierIndex() + 1}/7 ${card.tier} Tier` },
    { trait_type: "8. Puzzle", value: card.puzzle },
    { trait_type: "9. Series", value: card.series },
  ];

  if (card.edition === "Master Copy") {
    properties.push({ trait_type: "x. Exclusivity", value: "Master Copy" });
  }

  return properties.filter(({ trait_type, value }) => (
    value !== "None" || card.type === "Artwork" && trait_type.includes("Signature")
  ));
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
