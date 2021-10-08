const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("../test_utils/TestUtils");

const itBehavesLikeAnAction = (actionName, validCards, validTypes, expectedTier) => {
  const titleized = actionName[0].toUpperCase() + actionName.slice(1);
  const canAction = `can${titleized}`;

  const numCards = validCards.length;
  const batchSize = numCards + 1; // Includes the newly minted card.

  const tokenIDs = [...Array(numCards).keys()].map(i => i + 1);

  if (validCards.some(({ condition }) => condition !== "Excellent")) {
    throw new Error("Please set the condition of validCards to Excellent before running these tests.");
  }

  describe("it behaves like an action", () => {
    let factory, contract, owner, user1;

    before(async () => {
      factory = await ethers.getContractFactory("TestUtils");
      [owner, user1] = await ethers.getSigners();
    });

    beforeEach(async () => {
      contract = await factory.deploy(constants.ZERO_ADDRESS);
      TestUtils.addHelpfulMethodsTo(contract);
    });

    it("can be performed if a valid set of cards are provided", async () => {
      for (card of validCards) {
        await contract.mintExactByNames(card, owner.address);
      }

      const [isAllowed, reasons] = await contract[canAction](tokenIDs);

      expect(isAllowed).to.equal(true);
      expect(reasons.filter(s => s !== "")).to.be.empty;
    });

    it("does not care in which order the cards are provided", async () => {
      for (let i = validCards.length - 1; i >= 0; i -= 1) {
        await contract.mintExactByNames(validCards[i], owner.address);
      }

      const [isAllowed, reasons] = await contract[canAction](tokenIDs);

      expect(isAllowed).to.equal(true);
      expect(reasons.filter(s => s !== "")).to.be.empty;
    });

    it("cannot be performed if the wrong number of cards is provided", async () => {
      const [isAllowed, reasons] = await contract[canAction]([]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include(`[${numCards} cards are required]`, reasons);
    });

    it("cannot be performed if the user doesn't own all the cards", async () => {
      for (let i = 0; i < validCards.length; i += 1) {
        const thisCard = validCards[i];
        const otherCards = validCards.filter((_, j) => i !== j);

        await contract.mintExactByNames(thisCard, user1.address);

        for (card of otherCards) {
          await contract.mintExactByNames(card, owner.address);
        }

        const batchOffset = i * numCards;
        const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

        const [isAllowed, reasons] = await contract[canAction](batchTokenIDs);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[user doesn't own all the cards]", reasons);
      }
    });

    it("cannot be performed if the tiers don't match", async () => {
      for (let i = 0; i < numCards; i += 1) {
        const batchOffset = i * numCards;
        const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

        for (let j = 0; j < numCards; j += 1) {
          const tier = i === j ? "Mortal" : "Immortal";
          await contract.mintExactByNames({ ...validCards[j], tier }, owner.address);
        }

        const [isAllowed, reasons] = await contract[canAction](batchTokenIDs);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[the tiers of the cards don't match]", reasons);
      }
    });

    for (let i = 0; i < numCards; i += 1) {
      it(`cannot be performed if card ${i} has the wrong type`, async () => {
        const thisCard = validCards[i];
        const otherCards = validCards.filter((_, j) => i !== j);

        const wrongTypes = TestUtils.typeNames.filter(t => !validTypes[i].includes(t));

        for (let j = 0; j < wrongTypes.length; j += 1) {
          const type = wrongTypes[j];
          await contract.mintExactByNames({ ...thisCard, type, puzzle: 0, variant: 0 }, owner.address);

          for (card of otherCards) {
              await contract.mintExactByNames(card, owner.address);
          }

          const batchOffset = j * numCards;
          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

          const [isAllowed, reasons] = await contract[canAction](batchTokenIDs);
          const typeSpecificReasons = reasons.filter(s => s.match(/an? .*? card is required/));

          expect(isAllowed).to.equal(false, `card ${i} shouldn't be allowed to have type ${type}`);
          expect(typeSpecificReasons.length).to.be.above(0, reasons);
        }
      });
    }

    for (let i = 0; i < numCards; i += 1) {
      it(`can be performed if card ${i} has the right type`, async () => {
        const thisCard = validCards[i];
        const otherCards = validCards.filter((_, j) => i !== j);

        const rightTypes = validTypes[i];

        for (let j = 0; j < rightTypes.length; j += 1) {
          const type = rightTypes[j];
          await contract.mintExactByNames({ ...thisCard, type, puzzle: 0, variant: 0 }, owner.address);

          for (card of otherCards) {
              await contract.mintExactByNames(card, owner.address);
          }

          const batchOffset = j * numCards;
          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

          const [_isAllowed, reasons] = await contract[canAction](batchTokenIDs);
          const typeSpecificReasons = reasons.filter(s => s.match(/an? .*? card is required/));

          // The action might still not be allowed because one of our cards is
          // now invalid, e.g. a cloak card without a color set on it. We can
          // still check that the type-specific reason doesn't occur, though.

          expect(typeSpecificReasons.length).to.be.equal(0, reasons);
        }
      });
    }

    it("discards the provided cards and mints a new one", async () => {
      for (card of validCards) {
        await contract.mintExactByNames(card, owner.address);
      }

      await contract[actionName](tokenIDs);

      for (tokenID of tokenIDs) {
        expect(await contract.isDiscarded(tokenID)).to.equal(true, `card ${tokenID} wasn't discarded`);
      }

      expect(await contract.isDiscarded(numCards + 1)).to.equal(false, `a new card wasn't minted`);
    });

    it("reverts if the action cannot be performed", async () => {
      await expectRevert.unspecified(contract[actionName]([]));
    });

    it("randomly picks a new puzzle for the minted card", async () => {
      const puzzleNames = [];

      for (let i = 0; i < 20; i += 1) {
        const batchOffset = i * batchSize;

        for (card of validCards) {
          await contract.mintExactByNames(card, owner.address);
        }

        const batchTokenIDs = tokenIDs.map(t => t + batchOffset);
        await contract[actionName](batchTokenIDs);

        const mintedTokenID = batchTokenIDs[batchTokenIDs.length - 1];
        puzzleNames.push(await contract.puzzleName(mintedTokenID));
      }

      expect(puzzleNames.length).to.be.above(1);
    });

    it(`sets the tier of the minted card to ${expectedTier}`, async () => {
        for (card of validCards) {
          await contract.mintExactByNames(card, owner.address);
        }

        await contract[actionName](tokenIDs);
        const mintedTokenID = numCards + 1;

        expect(await contract.tierName(mintedTokenID)).to.equal(expectedTier);
    });

    it("has a chance to degrade the condition of the minted card", async () => {
      const conditionNames = [];

      for (let i = 0; i < 100; i += 1) {
        const batchOffset = i * batchSize;

        for (card of validCards) {
          await contract.mintExactByNames(card, owner.address);
        }

        const batchTokenIDs = tokenIDs.map(t => t + batchOffset);
        await contract[actionName](batchTokenIDs);

        const mintedTokenID = batchOffset + batchSize;
        conditionNames.push(await contract.conditionName(mintedTokenID));
      }

      const set = new Set(conditionNames);
      expect(set.size).to.equal(2);

      expect(set.has("Excellent")).to.equal(true);
      expect(set.has("Reasonable")).to.equal(true);

      const numExcellent = conditionNames.filter(s => s === "Excellent").length;
      const numReasonable = conditionNames.filter(s => s === "Reasonable").length;

      expect(numExcellent).to.be.above(numReasonable * 2);
    });

    it("doesn't degrade cards that are already the lowest condition", async () => {
      const conditionNames = new Set();

      for (let i = 0; i < 20; i += 1) {
        const batchOffset = i * batchSize;

        for (card of validCards) {
          await contract.mintExactByNames({ ...card, condition: "Dire" }, owner.address);
        }

        const batchTokenIDs = tokenIDs.map(t => t + batchOffset);
        await contract[actionName](batchTokenIDs);

        const mintedTokenID = batchOffset + batchSize;
        conditionNames.add(await contract.conditionName(mintedTokenID));
      }

      expect(conditionNames.size).to.equal(1);
    });

    for (const tier of ["Immortal", "Godly"]) {
      it(`doesn't degrade cards at ${tier} tier`, async () => {
        const conditionNames = new Set();

        for (let i = 0; i < 20; i += 1) {
          const batchOffset = i * batchSize;

          for (card of validCards) {
            await contract.mintExactByNames({ ...card, tier }, owner.address);
          }

          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);
          await contract[actionName](batchTokenIDs);

          const mintedTokenID = batchOffset + batchSize;
          conditionNames.add(await contract.conditionName(mintedTokenID));
        }

        expect(conditionNames.size).to.equal(1);
      });
    }
  });
};

const itMintsATierStarterCard = (actionName, validCards, tierIncreases) => {
  const numCards = validCards.length;
  const batchSize = numCards + 1; // Includes the newly minted card.

  const tokenIDs = [...Array(numCards).keys()].map(i => i + 1);

  if (validCards.some(({ condition }) => condition !== "Excellent")) {
    throw new Error("Please set the condition of validCards to Excellent before running these tests.");
  }

  const description = tierIncreases ? "tier above" : "same tier";

  describe(`it mints a starter card for the ${description}`, () => {
    let factory, contract, owner, user1;

    before(async () => {
      factory = await ethers.getContractFactory("TestUtils");
      [owner, user1] = await ethers.getSigners();
    });

    beforeEach(async () => {
      contract = await factory.deploy(constants.ZERO_ADDRESS);
      TestUtils.addHelpfulMethodsTo(contract);
    });

    const allTiers = [
      ["Mortal", "Immortal"],
      ["Immortal", "Ethereal"],
      ["Ethereal", "Virtual"],
      ["Virtual", "Celestial"],
      ["Celestial", "Godly"],
      ["Godly", "Master"],
    ];

    let standardRulesTiers, virtualRulesTiers, masterRulesTiers;

    if (!tierIncreases) {
      it("has the same tier as the provided cards", async () => {
        for (let i = 0; i < allTiers.length; i += 1) {
          const [before, after] = allTiers[i];

          for (card of validCards) {
            await contract.mintExactByNames({ ...card, tier: before }, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

          await contract[actionName](batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          expect(await contract.tierName(mintedTokenID)).to.equal(before);
        }
      });

      virtualRulesTiers = ["Virtual", "Godly"];
      masterRulesTiers = ["Master"];
      standardRulesTiers = ["Mortal", "Immortal", "Ethereal"];
    }

    if (tierIncreases) {
      it("increases the tier by 1", async () => {
        for (let i = 0; i < allTiers.length; i += 1) {
          const [before, after] = allTiers[i];

          for (card of validCards) {
            await contract.mintExactByNames({ ...card, tier: before }, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

          await contract[actionName](batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          expect(await contract.tierName(mintedTokenID)).to.equal(after);
        }
      });

      // These are one tier below what they normally are because the current
      // action promotes up to the tier above which has the special rules.
      virtualRulesTiers = ["Ethereal", "Celestial"];
      masterRulesTiers = ["Godly"];
      standardRulesTiers = ["Mortal", "Immortal", "Virtual"];
    }

    for (const tier of standardRulesTiers) {
      it(`mints using the standard type probabilities at ${tier} tier`, async () => {
        const typeNames = [];

        for (let i = 0; i < 1000; i += 1) {
          for (card of validCards) {
            await contract.mintExactByNames({ ...card, tier }, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

          await contract[actionName](batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          typeNames.push(await contract.typeName(mintedTokenID));
        }

        const frequencies = TestUtils.tallyFrequencies(typeNames);

        expect(frequencies["Player"]).to.be.within(0.25, 0.35);    // 30%
        expect(frequencies["Crab"]).to.be.within(0.05, 0.15);      // 10%
        expect(frequencies["Inactive"]).to.be.within(0.15, 0.25);  // 20%
        expect(frequencies["Active"]).to.be.within(0.05, 0.15);    // 10%
        expect(frequencies["Cloak"]).to.be.within(0.05, 0.15);     // 10%
        expect(frequencies["Telescope"]).to.be.within(0.05, 0.15); // 10%
        // ...
      }).timeout(120000);
    }

    for (const tier of virtualRulesTiers) {
      it(`mints either a Player, Glasses or Hidden card at ${tier} tier`, async () => {
        const typeNames = [];

        for (let i = 0; i < 1000; i += 1) {
          for (card of validCards) {
            await contract.mintExactByNames({ ...card, tier }, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

          await contract[actionName](batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          const type = await contract.typeName(mintedTokenID);
          const color1 = await contract.color1Name(mintedTokenID);
          const color2 = await contract.color2Name(mintedTokenID);
          const variant = await contract.variantName(mintedTokenID);

          expect(["Player", "Glasses", "Hidden"]).to.include(type);
          expect(variant).to.equal("None");

          const hasColor = type === "Glasses";

          if (hasColor) {
            expect(TestUtils.isRealColor(color1)).to.equal(true);
            expect(TestUtils.isRealColor(color2)).to.equal(true);
          } else {
            expect(color1).to.equal("None");
            expect(color2).to.equal("None");
          }

          typeNames.push(type);
        }

        const frequencies = TestUtils.tallyFrequencies(typeNames);

        expect(frequencies["Player"]).to.be.within(0.233, 0.433);  // 33.3%
        expect(frequencies["Glasses"]).to.be.within(0.233, 0.433); // 33.3%
        expect(frequencies["Hidden"]).to.be.within(0.233, 0.433);  // 33.3%
      }).timeout(120000);
    }

    for (const tier of masterRulesTiers) {
      it(`mints either a Player, Eclipse or Star card at ${tier} tier`, async () => {
        const typeNames = [];

        for (let i = 0; i < 1000; i += 1) {
          for (card of validCards) {
            await contract.mintExactByNames({ ...card, tier }, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = tokenIDs.map(t => t + batchOffset);

          await contract[actionName](batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          const type = await contract.typeName(mintedTokenID);
          const color1 = await contract.color1Name(mintedTokenID);
          const color2 = await contract.color2Name(mintedTokenID);
          const variant = await contract.variantName(mintedTokenID);

          expect(["Player", "Eclipse", "Star"]).to.include(type);
          expect(variant).to.equal("None");
          expect(color2).to.equal("None");

          const hasColor = type === "Star";

          if (hasColor) {
            expect(TestUtils.isRealColor(color1)).to.equal(true);
          } else {
            expect(color1).to.equal("None");
          }

          typeNames.push(type);
        }

        const frequencies = TestUtils.tallyFrequencies(typeNames);

        expect(frequencies["Player"]).to.be.within(0.45, 0.55);  // 50%
        expect(frequencies["Eclipse"]).to.be.within(0.35, 0.45); // 40%
        expect(frequencies["Star"]).to.be.within(0.05, 0.15);    // 10%
      }).timeout(120000);
    }
  });
};

module.exports = { itBehavesLikeAnAction, itMintsATierStarterCard };
