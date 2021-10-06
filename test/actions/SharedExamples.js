const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("../test_utils/TestUtils");

const itBehavesLikeAnAction = (actionName, validCards, expectedTier) => {
  const titleized = actionName[0].toUpperCase() + actionName.slice(1);
  const canAction = `can${titleized}`;

  const numCards = validCards.length;
  const tokenIDs = [...Array(numCards).keys()].map(i => i + 1);

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

    it("cannot be performed if the wrong number of cards is provided", async () => {
      const [isAllowed, reasons] = await contract[canAction]([]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include(`[${numCards} cards are required]`, reasons);
    });

    it("cannot be performed if the user doesn't own all the cards", async () => {
      await contract.mintExactByNames(validCards[0], user1.address);

      const [isAllowed, reasons] = await contract[canAction]([1]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[user doesn't own all the cards]", reasons);
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
      it(`cannot be performed if card ${i} is missing`, async () => {
        const replacedCard = { ...validCards[i], type: "Artwork" };
        const presentCards = validCards.filter((_, j) => i !== j);

        await contract.mintExactByNames(replacedCard, owner.address);

        for (card of presentCards) {
            await contract.mintExactByNames(card, owner.address);
        }

        const [isAllowed, reasons] = await contract[canAction](tokenIDs);

        expect(isAllowed).to.equal(false);
        expect(reasons.some(s => s.match(/an? .*? card is required/))).to.equal(true, reasons);
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
        const batchSize = numCards + 1; // Includes the newly minted card.
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
      if (validCards.some(({ condition }) => condition !== "Excellent")) {
        throw new Error("Please set the condition of validCards to Excellent before running this test.");
      }

      const conditionNames = [];

      for (let i = 0; i < 100; i += 1) {
        const batchSize = numCards + 1; // Includes the newly minted card.
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
        const batchSize = numCards + 1; // Includes the newly minted card.
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

    it("doesn't degrade cards at Immortal tier", async () => {
      const conditionNames = new Set();

      for (let i = 0; i < 20; i += 1) {
        const batchSize = numCards + 1; // Includes the newly minted card.
        const batchOffset = i * batchSize;

        for (card of validCards) {
          await contract.mintExactByNames({ ...card, tier: "Immortal" }, owner.address);
        }

        const batchTokenIDs = tokenIDs.map(t => t + batchOffset);
        await contract[actionName](batchTokenIDs);

        const mintedTokenID = batchOffset + batchSize;
        conditionNames.add(await contract.conditionName(mintedTokenID));
      }

      expect(conditionNames.size).to.equal(1);
    });

    it("doesn't degrade cards at Godly tier", async () => {
      const conditionNames = new Set();

      for (let i = 0; i < 20; i += 1) {
        const batchSize = numCards + 1; // Includes the newly minted card.
        const batchOffset = i * batchSize;

        for (card of validCards) {
          await contract.mintExactByNames({ ...card, tier: "Godly" }, owner.address);
        }

        const batchTokenIDs = tokenIDs.map(t => t + batchOffset);
        await contract[actionName](batchTokenIDs);

        const mintedTokenID = batchOffset + batchSize;
        conditionNames.add(await contract.conditionName(mintedTokenID));
      }

      expect(conditionNames.size).to.equal(1);
    });
  });
};

module.exports = { itBehavesLikeAnAction };