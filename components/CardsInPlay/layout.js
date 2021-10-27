const numRows = 2;
const oneRem = 16;
const stackWidth = 15 * oneRem; // As per the CardStack css rules.
const stackHeight = 21 * oneRem; // As per the CardStack css rules.
const stackMargin = 5 * oneRem; // The minimum margin between card stacks.
const pagePadding = 8 * oneRem; // The horizontal page padding on the left/right.
const outlineTop = 11.2 * oneRem;
const playAreaTop = outlineTop + stackHeight + 4 * oneRem;

module.exports.numColumnsBasedOnPageWidth = () => {
  if (typeof document === "undefined") { return 0; }

  const pageWidth = document.body.clientWidth;
  const playAreaWidth = pageWidth - 2 * pagePadding;
  const perPlaceWidth = stackWidth + stackMargin;
  const numColumns = Math.floor(playAreaWidth / perPlaceWidth);

  return numColumns;
}

module.exports.evenPositions = (numColumns, numCards) => {
  if (typeof document === "undefined") { return []; }

  const pageWidth = document.body.clientWidth;
  const perPlaceWidth = stackWidth + stackMargin;
  const perPlaceHeight = stackHeight + stackMargin;
  const equalPerRow = Math.ceil(numCards / numRows);
  const softMaxCardsPerRow = Math.max(3, Math.min(numColumns, equalPerRow));
  const compressedMode = softMaxCardsPerRow > numColumns;
  const maxCardsPerRow = compressedMode && numCards <= 4 ? 2 : softMaxCardsPerRow;
  const positions = [];

  for (let row = 0; row < numRows; row += 1) {
    const remainingCards = numCards - row * maxCardsPerRow;
    const cardsInRow = Math.min(remainingCards, maxCardsPerRow);

    if (compressedMode) {
      const reducedPadding = pagePadding / 3;
      const availableWidth = pageWidth - reducedPadding * 2 - stackWidth;
      const perPlaceOffset = availableWidth / (cardsInRow - 1);

      for (let column = 0; column < cardsInRow; column += 1) {
        let left, base;

        if (cardsInRow > 1) {
          left = reducedPadding + perPlaceOffset * column;
          base = column / (cardsInRow - 1) * 8 - 4;
        } else {
          left = reducedPadding + availableWidth / 2;
          base = 0;
        }

        const top = playAreaTop + row * perPlaceHeight;
        positions.push({ left, top, rotation: { base, random: 0 } });
      }
    } else {
      const cardsWidth = cardsInRow * perPlaceWidth;
      const leftPadding = (pageWidth - cardsWidth + stackMargin) / 2;

      for (let column = 0; column < cardsInRow; column += 1) {
        const left = leftPadding + perPlaceWidth * column;
        const top = playAreaTop + row * perPlaceHeight;

        positions.push({ left, top });
      }
    }
  }

  const maxPageSize = numRows * Math.max(3, numColumns);

  return [positions, maxPageSize];
};

module.exports.cardFanPosition = (tokenID, tokenIDsInCardFan, maxZIndex, degreesPerCard = 1.5, offsetPerCard = 3, maxOffsetFromRight = 50) => {
  if (tokenIDsInCardFan.has(tokenID)) { return null; } // Don't change it.

  const indexFromBack = tokenIDsInCardFan.size;

  const fanAngle = indexFromBack * degreesPerCard;
  const fanOffset = Math.min(indexFromBack * offsetPerCard, stackWidth - maxOffsetFromRight);
  const zIndex = maxZIndex + 1 + indexFromBack;

  const pageMiddle = document.body.clientWidth / 2;
  const left = pageMiddle - stackWidth / 2;
  const top = outlineTop;

  const rotation = { base: 0, random: 4, initial: fanAngle };
  const position = { left: left + fanOffset, top, rotation, zIndex };

  return position;
};

module.exports.outlinePosition = () => {
  const pageMiddle = document.body.clientWidth / 2;
  const left = pageMiddle - stackWidth / 2;
  const top = outlineTop;

  return { left, top, rotation: { degrees: 0 } };
};
