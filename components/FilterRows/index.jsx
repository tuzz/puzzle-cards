import { useContext, useState } from "react";
import AppContext from "../AppRoot/context";
import Dropdown from "./dropdown";
import styles from "./styles.module.scss";

const FilterRows = ({ filters, setFilters }) => {
  const [showingFilters, setShowingFilters] = useState(false);
  const { PuzzleCard, address, decks } = useContext(AppContext);

  const unnecessary = !address || decks[address].length <= 6;
  if (!showingFilters && unnecessary) { return null; }

  if (!showingFilters) {
    return (
      <div className={`${styles.filter_row} ${styles.bottom}`}>
        <button className={styles.show_filters} onClick={() => setShowingFilters(true)}>Show filters</button>
      </div>
    );
  }

  const handleChange = (field) => (option) => {
    setFilters(f => f.set(field, option ? option.value : undefined));
  };

  const type = filters.filters["type"];
  const typeIndex = PuzzleCard.TYPE_NAMES.findIndex(s => s === type);

  const numColorSlots = typeIndex === -1 ? 2 : PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE[typeIndex];
  const isMasterTier = filters.filters["tier"] === "Master";

  let numVariants, variantOffset;

  // Filter the variant options based type.
  if (typeIndex !== -1) {
    numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[typeIndex];
    variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[typeIndex];

  // Otherwise, infer the Star type at Master tier if a color is selected.
  } else if (isMasterTier && filters.filters["color1"]) {
    const starIndex = PuzzleCard.TYPE_NAMES.findIndex(n => n === "Star");
    numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[starIndex];
    variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[starIndex];

  // Otherwise, infer Helix, Torch, Glasses if a second color is selected. None of these types have variants.
  } else if (filters.filters["color2"]) {
    numVariants = 0;
    variantOffset = 0;

  // Otherwise, infer the Artwork type at Master tier if no color is selected.
  } else if (isMasterTier) {
    const artworkIndex = PuzzleCard.TYPE_NAMES.findIndex(n => n === "Artwork");
    numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[artworkIndex];
    variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[artworkIndex]

  // At non-Master tiers, infer Active, Inactive if a color is selected. They have the same variants.
  } else if (filters.filters["color1"]) {
    const activeIndex = PuzzleCard.TYPE_NAMES.findIndex(n => n === "Active");
    numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[activeIndex];
    variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[activeIndex]

  // At non-Master tiers, fallback to showing the non-Artwork variants to reduce noise.
  } else {
    numVariants = 4;
    variantOffset = 1;
  }

  const variantNames = PuzzleCard.VARIANT_NAMES.slice(variantOffset, variantOffset + numVariants);

  // Figure out which types the currently selected variant (if any) is for.
  const typesOfSelectedVariant = {};
  const variantIndex = PuzzleCard.VARIANT_NAMES.findIndex(s => s === filters.filters["variant"]);

  for (let i = 0; i < PuzzleCard.TYPE_NAMES.length && variantIndex !== -1; i += 1) {
    const offset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[i];
    const numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[i];

    if (variantIndex >= offset && variantIndex < offset + numVariants) {
      typesOfSelectedVariant[PuzzleCard.TYPE_NAMES[i]] = true;
    }
  }

  const masterTierTypes = { Artwork: true, Star: true };

  const typeRelevanceBasedOnCurrentFilters = (type) => {
    const typeIndex = PuzzleCard.TYPE_NAMES.findIndex(s => s === type);
    const colorSlots = PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE[typeIndex];

    if (filters.filters["color1"] && colorSlots < 1) { return false; }
    if (filters.filters["color2"] && colorSlots < 2) { return false; }

    if (filters.filters["variant"] && !typesOfSelectedVariant[type]) { return false; }
    if (isMasterTier && !masterTierTypes[type]) { return false; }

    return true;
  };

  const isDoorVariant = typesOfSelectedVariant["Door"];

  const colorAlert = isDoorVariant ?
    `Not applicable because the 'Door' type does not have color.` :
    numColorSlots === 0 ?
      `Not applicable because the '${type}' type does not have color.` :
      `Not applicable because the '${type}' type only has one color.`;

  const variantAlert = filters.filters["type"] ?
    `Not applicable because the '${type}' type does not have variants.` :
    filters.filters["color2"] ?
      `Not applicable because types with two colors do not have variants.` :
      `Not applicable because the 'Star' type does not have variants.`;

  const variantMenuWidth = filters.filters["type"] === "Player" ? "wide" :
                           filters.filters["type"] === "Map" ? "verywide" : "default";

  return <>
    <div className={`${styles.filter_row} ${styles.top}`}>
      <Dropdown
        placeholder="Type…"
        onChange={handleChange("type")}
        names={PuzzleCard.TYPE_NAMES}
        counts={filters.countsForDropdownOptions["type"]}
        relevanceFn={typeRelevanceBasedOnCurrentFilters}
        alphabetic={true} />

      <Dropdown
        placeholder="Color 1…"
        onChange={handleChange("color1")}
        names={PuzzleCard.COLOR_NAMES}
        counts={filters.countsForDropdownOptions["color1"]}
        alphabetic={true}
        disabled={numColorSlots < 1 || isDoorVariant}
        hidden={type === "Artwork"}
        alertText={colorAlert} />

      <Dropdown
        placeholder="Edition…"
        onChange={handleChange("edition")}
        names={PuzzleCard.EDITION_NAMES}
        counts={filters.countsForDropdownOptions["edition"]}
        hidden={type !== "Artwork"} />

      <Dropdown
        placeholder="Color 2…"
        onChange={handleChange("color2")}
        names={PuzzleCard.COLOR_NAMES}
        counts={filters.countsForDropdownOptions["color2"]}
        alphabetic={true}
        disabled={numColorSlots < 2 || isDoorVariant}
        hidden={isMasterTier}
        alertText={colorAlert} />

      <Dropdown
        placeholder="Puzzle…"
        onChange={handleChange("puzzle")}
        names={PuzzleCard.PUZZLE_NAMES}
        counts={filters.countsForDropdownOptions["puzzle"]}
        hidden={!isMasterTier} />
    </div>

    <div className={`${styles.filter_row} ${styles.bottom}`}>
      <Dropdown
        menuPlacement="top"
        placeholder="Tier…"
        onChange={handleChange("tier")}
        counts={filters.countsForDropdownOptions["tier"]}
        names={PuzzleCard.TIER_NAMES} />

      <Dropdown
        menuPlacement="top"
        placeholder="Condition…"
        onChange={handleChange("condition")}
        counts={filters.countsForDropdownOptions["condition"]}
        names={PuzzleCard.CONDITION_NAMES} />

      <Dropdown
        menuPlacement="top"
        placeholder="Variant…"
        onChange={handleChange("variant")}
        counts={filters.countsForDropdownOptions["variant"]}
        names={variantNames}
        disabled={numVariants === 0}
        alertText={variantAlert}
        menuWidth={variantMenuWidth}
      />
    </div>
  </>;
};

export default FilterRows;
