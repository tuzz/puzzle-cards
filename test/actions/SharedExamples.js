const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("../test_utils/TestUtils");
const card = TestUtils.card;
const PuzzleCard = require("../../contracts/PuzzleCard");

const itBehavesLikeAnAction = (actionName, validCards, validTypes, expectedTier, { skipSameTierTest, skipDegradeTest, skipNoDegradeTest } = {}) => {
  const titleized = actionName[0].toUpperCase() + actionName.slice(1);
  const canAction = `can${titleized}`;
  const numCards = validCards.length;

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
      PuzzleCard.setContract(contract);
    });

    it("can be performed if a valid set of cards are provided", async () => {
      for (const card of validCards) {
        await PuzzleCard.mintExact(card, owner.address);
      }

      const [isAllowed, reasons] = await PuzzleCard[canAction](validCards);

      expect(isAllowed).to.equal(true);
      expect(reasons.filter(s => s !== "")).to.be.empty;
    });

    it("does not care in which order the cards are provided", async () => {
      const reversed = [...validCards].reverse();

      for (const card of reversed) {
        await PuzzleCard.mintExact(card, owner.address);
      }

      const [isAllowed, reasons] = await PuzzleCard[canAction](reversed);

      expect(isAllowed).to.equal(true);
      expect(reasons).to.be.empty;
    });

    it("cannot be performed if the wrong number of cards is provided", async () => {
      const [isAllowed, reasons] = await PuzzleCard[canAction]([]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include(`[${numCards} cards are required]`, reasons);
    });

    it("cannot be performed if the user doesn't own all the cards", async () => {
      for (let i = 0; i < numCards; i += 1) {
        const address = i === 0 ? user1.address : owner.address;
        PuzzleCard.mintExact(validCards[i], address);
      }

      const [isAllowed, reasons] = await PuzzleCard[canAction](validCards);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[user doesn't own all the cards]", reasons);
    });

    if (!skipSameTierTest) {
      it("cannot be performed if the tiers don't match", async () => {
        const cards = [];

        for (let i = 0; i < numCards; i += 1) {
          const tier = i === 0 ? "Mortal" : "Immortal";
          cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...validCards[i], tier }), owner.address));
        }

        const [isAllowed, reasons] = await PuzzleCard[canAction](cards);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[the tiers of the cards don't match]", reasons);
      });
    }

    for (let i = 0; i < numCards; i += 1) {
      it(`cannot be performed if card ${i} has the wrong type`, async () => {
        const wrongTypes = PuzzleCard.TYPE_NAMES.filter(t => !validTypes[i].includes(t));

        for (wrongType of wrongTypes) {
          const cards = [];

          for (let j = 0; j < numCards; j += 1) {
            const type = i === j ? wrongType : validCards[j].type;

            const typeIndex = PuzzleCard.TYPE_NAMES.indexOf(type);
            const variantIndex = PuzzleCard.VARIANT_OFFSET_PER_TYPE[typeIndex];
            const variant = PuzzleCard.VARIANT_NAMES[variantIndex];

            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...validCards[j], type, variant }), owner.address));
          }

          const [isAllowed, reasons] = await PuzzleCard[canAction](cards);
          const typeSpecificReasons = reasons.filter(s => s.match(/.*? cards? .*? required/));

          expect(isAllowed).to.equal(false, `card ${i} shouldn't be allowed to have type ${wrongType}`);
          expect(typeSpecificReasons.length).to.be.above(0, reasons);
        }
      });
    }

    for (let i = 0; i < numCards; i += 1) {
      it(`can be performed if card ${i} has the right type`, async () => {
        for (rightType of validTypes[i]) {
          const cards = [];

          for (let j = 0; j < numCards; j += 1) {
            const type = i === j ? rightType : validCards[j].type;

            const typeIndex = PuzzleCard.TYPE_NAMES.indexOf(type);
            const variantIndex = PuzzleCard.VARIANT_OFFSET_PER_TYPE[typeIndex];
            const variant = PuzzleCard.VARIANT_NAMES[variantIndex];

            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...validCards[j], type, variant }), owner.address));
          }

          const [_isAllowed, reasons] = await PuzzleCard[canAction](cards);
          const typeSpecificReasons = reasons.filter(s => s.match(/an? .*? card is required/));

          // The action might still not be allowed because one of our cards is
          // now invalid, e.g. a cloak card without a color set on it. We can
          // still check that the type-specific reason doesn't occur, though.

          expect(typeSpecificReasons.length).to.be.equal(0, reasons);
        }
      });
    }

    it("decrements the balance by 1 for the provided cards and mints a new card", async () => {
      for (const card of validCards) {
        await PuzzleCard.mintExact(card, owner.address)
      }

      for (const card of validCards) {
        const balance = await contract.balanceOf(owner.address, card.tokenID());
        expect(balance.toNumber()).to.equal(1);
      }

      const mintedCard = await PuzzleCard[actionName](validCards);

      for (const card of validCards) {
        const balance = await contract.balanceOf(owner.address, card.tokenID());
        expect(balance.toNumber()).to.equal(0, `card ${card} wasn't discarded`);
      }

      const balance = await contract.balanceOf(owner.address, mintedCard.tokenID());
      expect(balance.toNumber()).to.equal(1);
    });

    it("does not allow the cards to be used again once discarded", async () => {
      for (const card of validCards) {
        await PuzzleCard.mintExact(card, owner.address);
      }

      await PuzzleCard[actionName](validCards);

      // Call the same action again.
      await expectRevert.unspecified(PuzzleCard[actionName](validCards));
    });

    it("reverts if the action cannot be performed", async () => {
      await expectRevert.unspecified(PuzzleCard[actionName](validCards));
    });

    it("randomly picks a new puzzle for the minted card", async () => {
      const puzzleNames = [];

      for (let i = 0; i < 20; i += 1) {
        for (const card of validCards) {
          await PuzzleCard.mintExact(card, owner.address);
        }

        const mintedCard = await PuzzleCard[actionName](validCards);

        puzzleNames.push(mintedCard.puzzle);
      }

      expect(puzzleNames.length).to.be.above(1);
    });

    it(`sets the tier of the minted card to ${expectedTier}`, async () => {
      for (const card of validCards) {
        await PuzzleCard.mintExact(card, owner.address);
      }

      const mintedCard = await PuzzleCard[actionName](validCards);

      expect(mintedCard.tier).to.equal(expectedTier);
    });

    if (!skipDegradeTest) {
      it("has a chance to degrade the condition of the minted card", async () => {
        const conditionNames = [];

        for (let i = 0; i < 100; i += 1) {
          for (const card of validCards) {
            await PuzzleCard.mintExact(card, owner.address)
          }

          const mintedCard = await PuzzleCard[actionName](validCards);

          conditionNames.push(mintedCard.condition);
        }

        const set = new Set(conditionNames);
        expect(set.size).to.equal(2);

        expect(set.has("Excellent")).to.equal(true);
        expect(set.has("Reasonable")).to.equal(true);

        const numExcellent = conditionNames.filter(s => s === "Excellent").length;
        const numReasonable = conditionNames.filter(s => s === "Reasonable").length;

        expect(numExcellent).to.be.above(numReasonable * 2);
      });
    }

    it("doesn't degrade cards that are already the lowest condition", async () => {
      const conditionNames = new Set();

      for (let i = 0; i < 20; i += 1) {
        const cards = [];

        for (const card of validCards) {
          cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, condition: "Dire" }), owner.address));
        }

        const mintedCard = await PuzzleCard[actionName](cards);

        conditionNames.add(mintedCard.condition);
      }

      expect(conditionNames.size).to.equal(1);
    });

    if (!skipNoDegradeTest) {
      for (const tier of ["Immortal", "Godly"]) {
        it(`doesn't degrade cards at ${tier} tier`, async () => {
          const conditionNames = new Set();

          for (let i = 0; i < 20; i += 1) {
            const cards = [];

            for (const card of validCards) {
              cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, tier }), owner.address));
            }

            const mintedCard = await PuzzleCard[actionName](cards);

            conditionNames.add(mintedCard.condition);
          }

          expect(conditionNames.size).to.equal(1);
        });
      }
    }
  });
};

const itMintsATierStarterCard = (actionName, validCards, tierIncreases) => {
  const numCards = validCards.length;

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
      PuzzleCard.setContract(contract);
      TestUtils.readArrays();
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
          const cards = [];

          for (const card of validCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, tier: before }), owner.address));
          }

          const mintedCard = await PuzzleCard[actionName](cards);

          expect(mintedCard.tier).to.equal(before);
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
          const cards = [];

          for (const card of validCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, tier: before }), owner.address));
          }

          const mintedCard = await PuzzleCard[actionName](cards);

          expect(mintedCard.tier).to.equal(after);
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
          const cards = [];

          for (const card of validCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, tier }), owner.address));
          }

          const mintedCard = await PuzzleCard[actionName](cards);

          typeNames.push(mintedCard.type);
        }

        const frequencies = TestUtils.tallyFrequencies(typeNames);

        expect(frequencies["Player"]).to.be.within(0.25, 0.35);    // 30%
        expect(frequencies["Crab"]).to.be.within(0.05, 0.15);      // 10%
        expect(frequencies["Inactive"]).to.be.within(0.15, 0.25);  // 20%
        expect(frequencies["Active"]).to.be.within(0.05, 0.15);    // 10%
        expect(frequencies["Cloak"]).to.be.within(0.05, 0.15);     // 10%
        expect(frequencies["Telescope"]).to.be.within(0.05, 0.15); // 10%
        // ...
      });
    }

    for (const tier of virtualRulesTiers) {
      it(`mints either a Player, Glasses or Hidden card at ${tier} tier`, async () => {
        const typeNames = [];

        for (let i = 0; i < 1000; i += 1) {
          const cards = [];

          for (const card of validCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, tier }), owner.address));
          }

          const mintedCard = await PuzzleCard[actionName](cards);

          expect(["Player", "Glasses", "Hidden"]).to.include(mintedCard.type);
          expect(mintedCard.variant).to.equal("None");

          const hasColor = mintedCard.type === "Glasses";

          if (hasColor) {
            expect(TestUtils.isRealColor(mintedCard.color1)).to.equal(true);
            expect(TestUtils.isRealColor(mintedCard.color2)).to.equal(true);
          } else {
            expect(mintedCard.color1).to.equal("None");
            expect(mintedCard.color2).to.equal("None");
          }

          typeNames.push(mintedCard.type);
        }

        const frequencies = TestUtils.tallyFrequencies(typeNames);

        expect(frequencies["Player"]).to.be.within(0.233, 0.433);  // 33.3%
        expect(frequencies["Glasses"]).to.be.within(0.233, 0.433); // 33.3%
        expect(frequencies["Hidden"]).to.be.within(0.233, 0.433);  // 33.3%
      });
    }

    for (const tier of masterRulesTiers) {
      it(`mints an Artwork card at ${tier} tier`, async () => {
        const variantNames = [];

        for (let i = 0; i < 1000; i += 1) {
          const cards = [];

          for (const card of validCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, tier }), owner.address));
          }

          const mintedCard = await PuzzleCard[actionName](cards);

          expect(mintedCard.type).to.equal("Artwork");
          expect(mintedCard.color1).to.equal("None");
          expect(mintedCard.color2).to.equal("None");
          expect(mintedCard.edition).to.equal("Standard");

          variantNames.push(mintedCard.variant);
        }

        const frequencies = TestUtils.tallyFrequencies(variantNames);

        expect(frequencies["Art 0"]).to.be.within(0.45, 0.55); // 50%
        expect(frequencies["Art 1"]).to.be.within(0.45, 0.55); // 50%
      });
    }
  });
};

module.exports = { itBehavesLikeAnAction, itMintsATierStarterCard };
