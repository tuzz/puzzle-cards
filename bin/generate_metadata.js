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
                  const filename = `public_s3/metadata_api/${card.metadataID()}.json`;

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

  console.log(`${cardCombinations} card combinations written to public_s3/metadata_api/`);

  writeContractMetadata();
  console.log(`contract metadata written to public_s3/metadata_api/contract.json`);
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

const openSeaDescription = (card) => {
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
    text += "\n\nOwnership of this card represents **ownership of the actual puzzle from the video game**.";
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

const writeContractMetadata = () => {
  const filename = `public_s3/metadata_api/contract.json`;

  const metadata = {
    name: "Worship the Sun Puzzle Cards",
    description: [
      `Worship the Sun is an upcoming puzzle/platformer by [Chris Patuzzo](https://twitter.com/chrispatuzzo). These Puzzle Cards were created to help fund the video game and to celebrate all of the intricately designed puzzles and hand drawn artwork from the game. By playing the card game, you are directly supporting its creator.`,
      `The card game uses many unique mechanics from the video game. For example, there are recipes such as 'LookThroughTelescope' and 'ShineTorchOnBasePair' that correspond to actions from the game. However, the card game is entirely self-contained and plays separately from the video game.`,
      `I've tried to keep prices as low as possible so that lots of people can play and get a glimpse at some of the puzzles. Cards can be minted from just $0.01, rising to $1 at the highest tier. To avoid spoilers, the videos featured on the cards do not show the solutions to puzzles - only a general sense of them.`,
      `At the $1 tier, cards can be combined to produce Signed, Limited Edition and Master Copy cards. This endgame is optional and is for people who want to own a significant piece of the video game itself as these cards are limited in supply and represent ownership over portions of the game.`,
      `There will only ever be ${PuzzleCard.MAX_LIMITED_EDITIONS} Limited Edition cards for each puzzle and one of these will be randomly chosen as the Master Copy. Ownership of this card represents ownership of the puzzle itself, as a discrete piece of artwork– all of the design, iterative development and testing that goes into making an enjoyable puzzle.`,
      `When the game launches, my hope is that all puzzles are owned by the community because 1) that will have helped support me during its development and 2) a number of people will feel a stronger connection to the game and appreciate it more– stumbling upon the puzzle they own at some point during that experience.`,
      `Going forwards, I plan to update the card game to include new puzzles and artwork from the video game as it is developed. Eventually, I might introduce cards that allow early access to the video game or free copies of it, but I haven't figured out the details yet. I'd also like to introduce a 'PuzzléDex' and a global leaderboard so that you can exhibit your deck, compare it to others' and hunt down cards you're missing.`,
      `It is important to me that the rules of the game remain fixed so that you can trust I won't dillute the rarity or value of cards later. This is enforced by the contract which only allows a small sert of things to change, e.g. to add new puzzles and artwork. Everything else, e.g. the number of limited editions, cannot change. All of the code is on GitHub (the contract, the website... everything) so you're welcome to verify it yourself.`,
      `Thanks for checking out Puzzle Cards. I really appreciate it.`,
    ].join("\n\n"),
    image: "https://openseacreatures.io/image.png", // TODO
    external_link: "https://puzzlecards.github.io",
    seller_fee_basis_points: 500,
    fee_recipient: PuzzleCard.CONTRACT_OWNER,
  };

  fs.writeFileSync(filename, JSON.stringify(metadata, null, 2) + "\n");
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
