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

  let numVariants, variantOffset;

  // Show the variants for the currently selected type. If not type is specified
  // and we're at master tier, only show Artwork variants. Otherwise, show the
  // non-Artwork variants (skipping the 0th element 'None').
  if (typeIndex !== -1) {
    numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[typeIndex];
    variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[typeIndex];
  } else if (filters.filters["tier"] === "Master") {
    const artworkIndex = PuzzleCard.TYPE_NAMES.findIndex(n => n === "Artwork");
    numVariants = PuzzleCard.NUM_VARIANTS_PER_TYPE[artworkIndex];
    variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[artworkIndex]
  } else {
    numVariants = 4;
    variantOffset = 1;
  }

  const variantNames = PuzzleCard.VARIANT_NAMES.slice(variantOffset, variantOffset + numVariants);

  const colorAlert = numColorSlots === 0 ?
    `Not applicable because the '${type}' type does not have color.` :
    `Not applicable because the '${type}' type only has one color.`;

  const variantAlert = `Not applicable because the '${type}' type does not have variants.`;

  return <>
    <div className={`${styles.filter_row} ${styles.top}`}>
      <Dropdown
        placeholder="Type…"
        onChange={handleChange("type")}
        names={PuzzleCard.TYPE_NAMES}
        counts={filters.countsForDropdownOptions["type"]}
        alphabetic={true} />

      <Dropdown
        placeholder="Color 1…"
        onChange={handleChange("color1")}
        names={PuzzleCard.COLOR_NAMES}
        counts={filters.countsForDropdownOptions["color1"]}
        alphabetic={true}
        disabled={numColorSlots < 1}
        alertText={colorAlert} />

      <Dropdown
        placeholder="Color 2…"
        onChange={handleChange("color2")}
        names={PuzzleCard.COLOR_NAMES}
        counts={filters.countsForDropdownOptions["color2"]}
        alphabetic={true}
        disabled={numColorSlots < 2}
        alertText={colorAlert} />
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
        alertText={variantAlert} />
    </div>
  </>;
};

export default FilterRows;
