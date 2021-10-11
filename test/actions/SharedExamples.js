const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

const itBehavesLikeAnAction = (actionName, validCards, validTypes, expectedTier, { skipSameTierTest, skipDegradeTest } = {}) => {
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
      TestUtils.addHelpfulMethodsTo(contract);
    });

    it("can be performed if a valid set of cards are provided", async () => {
      const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
        contract.mintExactByNames(card, owner.address)
      ));

      const [isAllowed, reasons] = await contract[canAction](tokenIDs);

      expect(isAllowed).to.equal(true);
      expect(reasons.filter(s => s !== "")).to.be.empty;
    });

    it("does not care in which order the cards are provided", async () => {
      const reversedCards = [...validCards];
      reversedCards.reverse();

      const tokenIDs = await TestUtils.tokenIDs(reversedCards, card => (
        contract.mintExactByNames(card, owner.address)
      ));

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
        const tokenIDs = await TestUtils.tokenIDs(validCards, (card, i) => {
          const address = i === 0 ? user1.address : owner.address;
          return contract.mintExactByNames(card, address);
        });

        const [isAllowed, reasons] = await contract[canAction](tokenIDs);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[user doesn't own all the cards]", reasons);
      }
    });

    if (!skipSameTierTest) {
      it("cannot be performed if the tiers don't match", async () => {
        for (let i = 0; i < numCards; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, (card, j) => {
            const tier = i === j ? "Mortal" : "Immortal";
            return contract.mintExactByNames({ ...card, tier }, owner.address);
          });

          const [isAllowed, reasons] = await contract[canAction](tokenIDs);

          expect(isAllowed).to.equal(false);
          expect(reasons).to.deep.include("[the tiers of the cards don't match]", reasons);
        }
      });
    }

    for (let i = 0; i < numCards; i += 1) {
      it(`cannot be performed if card ${i} has the wrong type`, async () => {
        const wrongTypes = TestUtils.typeNames.filter(t => !validTypes[i].includes(t));

        for (wrongType of wrongTypes) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, (card, j) => {
            const type = i === j ? wrongType : card.type;
            return contract.mintExactByNames({ ...card, type, puzzle: 0, variant: 0 }, owner.address);
          });

          const [isAllowed, reasons] = await contract[canAction](tokenIDs);
          const typeSpecificReasons = reasons.filter(s => s.match(/.*? cards? .*? required/));

          expect(isAllowed).to.equal(false, `card ${i} shouldn't be allowed to have type ${wrongType}`);
          expect(typeSpecificReasons.length).to.be.above(0, reasons);
        }
      });
    }

    for (let i = 0; i < numCards; i += 1) {
      it(`can be performed if card ${i} has the right type`, async () => {
        for (rightType of validTypes[i]) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, (card, j) => {
            const type = i === j ? rightType : card.type;
            return contract.mintExactByNames({ ...card, type, puzzle: 0, variant: 0 }, owner.address);
          });

          const [_isAllowed, reasons] = await contract[canAction](tokenIDs);
          const typeSpecificReasons = reasons.filter(s => s.match(/an? .*? card is required/));

          // The action might still not be allowed because one of our cards is
          // now invalid, e.g. a cloak card without a color set on it. We can
          // still check that the type-specific reason doesn't occur, though.

          expect(typeSpecificReasons.length).to.be.equal(0, reasons);
        }
      });
    }

    it("decrements the balance by 1 for the provided cards and mints a new card", async () => {
      const tokenIDs = await TestUtils.tokenIDs(validCards, (card) => (
        contract.mintExactByNames(card, owner.address)
      ));

      for (const tokenID of tokenIDs) {
        const balance = await contract.balanceOf(owner.address, tokenID);
        expect(balance.toNumber()).to.equal(1);
      }

      const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

      for (const tokenID of tokenIDs) {
        const balance = await contract.balanceOf(owner.address, tokenID);
        expect(balance.toNumber()).to.equal(0, `card ${tokenID} wasn't discarded`);
      }

      const balance = await contract.balanceOf(owner.address, mintedTokenID);
      expect(balance.toNumber()).to.equal(1);
    });

    it("does not allow the cards to be used again once discarded", async () => {
      const tokenIDs = await TestUtils.tokenIDs(validCards, (card) => (
        contract.mintExactByNames(card, owner.address)
      ));

      await contract[actionName](tokenIDs);

      // Call the same action again.
      await expectRevert.unspecified(contract[actionName](tokenIDs));
    });

    it("reverts if the action cannot be performed", async () => {
      await expectRevert.unspecified(contract[actionName]([]));
    });

    it("randomly picks a new puzzle for the minted card", async () => {
      const puzzleNames = [];

      for (let i = 0; i < 20; i += 1) {
        const tokenIDs = await TestUtils.tokenIDs(validCards, (card) => (
          contract.mintExactByNames(card, owner.address)
        ));

        const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

        puzzleNames.push(await contract.puzzleName(mintedTokenID));
      }

      expect(puzzleNames.length).to.be.above(1);
    });

    it(`sets the tier of the minted card to ${expectedTier}`, async () => {
      const tokenIDs = await TestUtils.tokenIDs(validCards, (card) => (
        contract.mintExactByNames(card, owner.address)
      ));

      const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

      expect(await contract.tierName(mintedTokenID)).to.equal(expectedTier);
    });

    if (!skipDegradeTest) {
      it("has a chance to degrade the condition of the minted card", async () => {
        const conditionNames = [];

        for (let i = 0; i < 100; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, (card) => (
            contract.mintExactByNames(card, owner.address)
          ));

          const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

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
    }

    it("doesn't degrade cards that are already the lowest condition", async () => {
      const conditionNames = new Set();

      for (let i = 0; i < 20; i += 1) {
        const tokenIDs = await TestUtils.tokenIDs(validCards, (card) => (
          contract.mintExactByNames({ ...card, condition: "Dire" }, owner.address)
        ));

        const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

        conditionNames.add(await contract.conditionName(mintedTokenID));
      }

      expect(conditionNames.size).to.equal(1);
    });

    for (const tier of ["Immortal", "Godly"]) {
      it(`doesn't degrade cards at ${tier} tier`, async () => {
        const conditionNames = new Set();

        for (let i = 0; i < 20; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, (card) => (
            contract.mintExactByNames({ ...card, tier }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

          conditionNames.add(await contract.conditionName(mintedTokenID));
        }

        expect(conditionNames.size).to.equal(1);
      });
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

          const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
            contract.mintExactByNames({ ...card, tier: before }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

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

          const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
            contract.mintExactByNames({ ...card, tier: before }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

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
          const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
            contract.mintExactByNames({ ...card, tier }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

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
      });
    }

    for (const tier of virtualRulesTiers) {
      it(`mints either a Player, Glasses or Hidden card at ${tier} tier`, async () => {
        const typeNames = [];

        for (let i = 0; i < 1000; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
            contract.mintExactByNames({ ...card, tier }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

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
      });
    }

    for (const tier of masterRulesTiers) {
      it(`mints an Artwork card at ${tier} tier`, async () => {
        const variantNames = [];

        for (let i = 0; i < 1000; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
            contract.mintExactByNames({ ...card, tier }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract[actionName](tokenIDs));

          const type = await contract.typeName(mintedTokenID);
          const color1 = await contract.color1Name(mintedTokenID);
          const color2 = await contract.color2Name(mintedTokenID);
          const variant = await contract.variantName(mintedTokenID);
          const edition = await contract.editionName(mintedTokenID);

          expect(type).to.equal("Artwork");
          expect(color1).to.equal("None");
          expect(color2).to.equal("None");
          expect(edition).to.equal("Standard");

          variantNames.push(variant);
        }

        const frequencies = TestUtils.tallyFrequencies(variantNames);

        expect(frequencies["Art1"]).to.be.within(0.45, 0.55); // 50%
        expect(frequencies["Art2"]).to.be.within(0.45, 0.55); // 50%
      });
    }
  });
};

module.exports = { itBehavesLikeAnAction, itMintsATierStarterCard };
