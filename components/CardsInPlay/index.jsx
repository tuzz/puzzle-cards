import { useContext, useState, useRef, useEffect } from "react";
import AppContext from "../DeckLoader/context";
import DragContext from "../DragRegion/context";
import CardStack from "../CardStack";
import layout from "./layout";
import styles from "./styles.module.scss";

const CardsInPlay = ({ onStackMoved = () => {}, transactState, chosenStacks, filters, setFilters, channel }) => {
  const { address, decks } = useContext(AppContext);
  const { maxZIndex } = useContext(DragContext);

  const [loadedAddress, setLoadedAddress] = useState(address);
  const [resizeListener, setResizeListener] = useState();
  const [releasePoller, setReleasePoller] = useState();
  const [draggedTokenIDs, setDraggedTokenIDs] = useState([]);
  const [stackPositions, _setStackPositions] = useState(withBatchTokenIDs([]));
  const setStackPositions = (array) => _setStackPositions(withBatchTokenIDs(array));

  useEffect(() => {
    if (!address) { return; }
    if (!decks[address].fetched) { clearEntireArea(); return; }

    const alreadyLoaded = address === loadedAddress;

    if (alreadyLoaded) { // The change was caused by new cards being minted.
      updateTopArea(decks[address], 50);
    } else {
      setLoadedAddress(address);
      updateMainArea();
      filters.exclusions = {}; // Clear the top area when changing accounts.
    }

    // Don't propagate changes so that the main area doesn't re-render when the
    // deck changes, e.g. when a new card is minted or cards or combined.
    setFilters(f => f.setDeck(decks[address], !alreadyLoaded));
  }, [address, decks]);

  // If the filters change, update the main area but leave the top alone.
  useEffect(() => address === loadedAddress && updateMainArea(), [filters]);

  useEffect(() => {
    setResizeListener(previous => {
      removeEventListener("resize", previous);
      addEventListener("resize", updateMainArea);

      return updateMainArea;
    });

    return () => removeEventListener("resize", resizeListener);
  }, [loadedAddress, filters]);

  useEffect(() => {
    setStackPositions(stackPositions => {
      const newStackPositions = [...stackPositions];
      newStackPositions.batchTokenIDs = stackPositions.batchTokenIDs;

      if (transactState.requesting()) {
        // Reset batchTokenIDs so that a new card fan is created for newly minted cards.
        newStackPositions.batchTokenIDs = new Set();
      } else if (transactState.processing()) {
        flipOntoCardOutline(newStackPositions);
      } else if (transactState.allFailed()) {
        flipToFaceForwardAgain(newStackPositions, -1);
      }

      return newStackPositions;
    });

    setReleasePoller(i => { i && clearInterval(i); return setInterval(() => checkForRelease(true), 0); });
    checkForRelease(false);
  }, [transactState]);

  const clearEntireArea = () => {
    stackPositions.forEach(p => onStackMoved({ cardStack: p.cardStack, movedTo: null }));
    setLoadedAddress();
    setStackPositions([]);
  };

  channel.alignStacks = (cardStacks) => {
    if (cardStacks.length === 0) { return; }

    const tokenIDs = {};
    cardStacks.forEach(s => tokenIDs[s.tokenID] = true);

    setStackPositions(stackPositions => {
      const newStackPositions = [...stackPositions];
      newStackPositions.batchTokenIDs = stackPositions.batchTokenIDs;

      for (let stackPosition of newStackPositions) {
        if (tokenIDs[stackPosition.cardStack.tokenID]) {
          stackPosition.withinY = layout.slidersYBounds();
          stackPosition.flipped = true;
          stackPosition.flipDirection = -1;

          const rotation = stackPosition.startPosition.rotation;

          // If the card is part of a card fan, rotate it back to 0 degrees so
          // that it doesn't poke out from beneath the wooden sliders.
          if (rotation && Math.abs(rotation.initial) > 4) {
            stackPosition.startPosition.rotation = { degrees: 0 };
          }
        }
      }

      return newStackPositions;
    });
  };

  // The caller is responsible for ensuring hourglassStacks and chosenStacks are updated.
  channel.clearStacks = (cardStacks) => {
    if (cardStacks.length === 0) { return; }

    const tokenIDs = {};
    cardStacks.forEach(s => tokenIDs[s.tokenID] = true);

    setStackPositions(stackPositions => {
      const newStackPositions = stackPositions.filter(p => !tokenIDs[p.cardStack.tokenID]);
      newStackPositions.batchTokenIDs = stackPositions.batchTokenIDs;

      return newStackPositions;
    });

    for (let cardStack of cardStacks) {
      onStackMoved({ cardStack, movedTo: null });
      setFilters(f => f.include(cardStack));
    }

    setFilters(f => f.shallowCopy());
  };

  const updateMainArea = () => {
    if (address !== loadedAddress) { return; }

    const pageOffset = Math.max(0, filters.pageOffset);

    const numColumns = layout.numColumnsBasedOnPageWidth();
    const numCards = filters.filteredDeck.length - pageOffset;

    const [positions, maxPageSize] = layout.evenPositions(numColumns, numCards);

    // It's possible that a few cards might be skipped when paging forwards/backwards
    // if the browser's width changes before the new pageSize is set. For the most
    // likely case when going from small -> large and paging forwards it works fine.
    setFilters(f => f.setPageSize(maxPageSize));

    setStackPositions(stackPositions => {
      const newStackPositions = stackPositions.filter(p => filters.exclusions[p.cardStack.tokenID]);
      newStackPositions.batchTokenIDs = stackPositions.batchTokenIDs;

      // Note: we don't need to call onStackMoved here because changing card
      // stacks in the main area won't affect chosenStacks or hourglassStacks.

      for (let i = 0; i < positions.length; i += 1) {
        const cardStack = filters.filteredDeck[pageOffset + i];
        if (!cardStack) { break; } // In case it changed before the async call.

        const startPosition = positions[i];
        const flipDirection = filters.dealForwards ? 1 : -1;
        const dealDelay = (filters.dealForwards ? i : (positions.length - i - 1)) * 100;

        const existing = stackPositions.find(p => p.cardStack.tokenID === cardStack.tokenID);
        let generation = (existing || {}).generation || 0;

        // If the stack has been dragged by the user and it continues to be visible
        // in the main area of the page, force it to re-render. Otherwise, React
        // should slide the stack over to its new position, e.g. when filtering.
        if (draggedTokenIDs[cardStack.tokenID]) { generation += 1; }

        newStackPositions.push({ cardStack, startPosition, flipDirection, dealDelay, generation, fadeIn: true });
      }

      return newStackPositions;
    });

    setDraggedTokenIDs({});
  }

  const flipOntoCardOutline = (stackPositions) => {
    for (let chosenStack of chosenStacks) {
      const stackPosition = stackPositions.find(p => p.cardStack.tokenID === chosenStack.tokenID);
      if (!stackPosition) { continue; }

      stackPosition.position = layout.outlinePosition();
      stackPosition.flipped = true;
      stackPosition.flipDirection = 1;
    }
  };

  const flipToFaceForwardAgain = (stackPositions, flipDirection, holdInPosition) => {
    for (let stackPosition of stackPositions) {
      if (!holdInPosition) { stackPosition.position = null; }

      stackPosition.flipped = false;
      stackPosition.flipDirection = flipDirection;
    }
  };

  const checkForRelease = (currentlyFlippingCards) => {
    if (transactState.processing()) { return; }
    if (stackPositions.some(p => p.flipped)) { return; }

    // If currentlyFlippingCards is true, it means we reached here from inside
    // the interval and not as a result of a transactState change.
    //
    // Therefore, delay releasing the cards and sliding them until the flip has
    // finished so that it's easier to understand what's going on.
    if (currentlyFlippingCards) {
      setTimeout(releaseHeldPosition, 1500);
    } else {
      releaseHeldPosition();
    }

    setReleasePoller(i => clearInterval(i));
  };

  const releaseHeldPosition = () => {
    setStackPositions(stackPositions => {
      const newStackPositions = [...stackPositions];
      newStackPositions.batchTokenIDs = stackPositions.batchTokenIDs;

      for (let stackPosition of newStackPositions) {
        stackPosition.position = null; // Hand control back to Draggable.
      }

      return newStackPositions;
    });
  };

  const updateTopArea = (deck, maxNumAtTop) => {
    setStackPositions(stackPositions => {
      const newStackPositions = [...stackPositions];
      newStackPositions.batchTokenIDs = stackPositions.batchTokenIDs;

      // Update quantities. If a stack is depleted, remove its stackPosition and
      // inform the parent that it has 'moved' so the parent can remove it too.
      for (let i = 0; i < maxNumAtTop; i += 1) {
        const cardStack = deck.justChanged[i];
        if (!cardStack) { break; }

        const index = newStackPositions.findIndex(p => p.cardStack.tokenID === cardStack.tokenID);
        const visible = index !== -1;

        if (visible && cardStack.quantity === 0) {
          newStackPositions.splice(index, 1);
          setTimeout(() => onStackMoved({ cardStack, movedTo: null }), 0); // The void.
        } else if (visible) {
          // This change seems to be visible to the parent component which is good.
          newStackPositions[index].cardStack.quantity = cardStack.quantity;
        }

        // If a card was added, make the stack appear over the CardOutline. If the
        // stack is already visible, force a re-render by changing its key.
        if (cardStack.quantity > 0 && cardStack.lastDelta > 0) {
          const startPosition = layout.cardFanPosition(cardStack.tokenID, newStackPositions.batchTokenIDs, maxZIndex);
          if (!startPosition) { continue; } // The card stack is already positioned in the card fan.

          // Flip the combining cards back over at the same time as the newly minted card.
          // Hold it in position to keep it behind the stack of cards being minted.
          flipToFaceForwardAgain(newStackPositions, 1, true);

          // Hold the position unless the change arrives after the card was minted.
          const position = transactState.requesting() || transactState.processing() ? startPosition : null;

          if (visible) {
            const existing = newStackPositions[index];

            existing.startPosition = startPosition;
            existing.position = position;
            existing.generation = (existing.generation || 0) + 1;
            existing.fadeIn = false;
          } else {
            newStackPositions.splice(0, 0, { cardStack, startPosition, position, fadeIn: false });
          }

          setTimeout(() => onStackMoved({ cardStack, movedTo: { cardOutline: true } }), 0);
          newStackPositions.batchTokenIDs.add(cardStack.tokenID);
        }
      }

      return newStackPositions;
    });

    // Update the counts in the dropdown options by the cardStack.lastDelta amounts.
    for (let cardStack of deck.justChanged) {
      filters.updateCounts(filters.matchObject(cardStack), cardStack);
    }

    // Update the main area if we've exceeded a maximum, otherwise we'd
    // overwhelm the browser by trying to load 500 CardStack iframes.
    if (deck.justChanged.length > maxNumAtTop) { setTimeout(updateMainArea, 1000); }
  };

  const handleStackMovedByDragging = ({ cardStack, movedTo }) => {
    setDraggedTokenIDs(o => ({ ...o, [cardStack.tokenID]: true }));
    onStackMoved({ cardStack, movedTo });
  };

  const key = (stackPosition) => `${stackPosition.cardStack.tokenID}-${stackPosition.generation}`;

  return (
    <div className={styles.cards_in_play}>
      {stackPositions.map(p => (
        <CardStack key={key(p)} {...p} onMoved={handleStackMovedByDragging} />
      ))}
    </div>
  );
};

const withBatchTokenIDs = (array) => {
  if (!array.batchTokenIDs) {
    array.batchTokenIDs = new Set();
  }

  return array;
}

export default CardsInPlay;
