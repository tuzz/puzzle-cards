import { useContext } from "react";
import AppContext from "../AppRoot/context";
import Dropdown from "./dropdown";
import styles from "./styles.module.scss";

const FilterRows = ({ filters, setFilters }) => {
  const { PuzzleCard } = useContext(AppContext);

  const handleChange = (field) => (option) => {
    setFilters(f => f.set(field, option ? option.value : undefined));
  };

  const type = filters.filters["type"];
  const typeIndex = PuzzleCard.TYPE_NAMES.findIndex(s => s === type);

  const numColorSlots = typeIndex === -1 ? 2 : PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE[typeIndex];

  // If no type is specified, show the Sun, Moon, Open, Closed variants but not those for Artwork.
  const numVariants = typeIndex === -1 ? 4 : PuzzleCard.NUM_VARIANTS_PER_TYPE[typeIndex];
  const variantOffset = typeIndex === -1 ? 1 : PuzzleCard.VARIANT_OFFSET_PER_TYPE[typeIndex];
  const variantNamesForType = PuzzleCard.VARIANT_NAMES.slice(variantOffset, variantOffset + numVariants);

  const colorAlert = numColorSlots === 0 ?
    `Not applicable because the '${type}' type does not have color.` :
    `Not applicable because the '${type}' type only has one color.`;

  const variantAlert = `Not applicable because the '${type}' type does not have variants.`;

  return <>
    <div className={`${styles.filter_row} ${styles.top}`}>
      <Dropdown placeholder="Type…" onChange={handleChange("type")} names={PuzzleCard.TYPE_NAMES} alphabetic={true} />
      <Dropdown placeholder="Color 1…" onChange={handleChange("color1")} names={PuzzleCard.COLOR_NAMES} alphabetic={true} disabled={numColorSlots < 1} alertText={colorAlert} />
      <Dropdown placeholder="Color 2…" onChange={handleChange("color2")} names={PuzzleCard.COLOR_NAMES} alphabetic={true} disabled={numColorSlots < 2} alertText={colorAlert} />
    </div>

    <div className={`${styles.filter_row} ${styles.bottom}`}>
      <Dropdown menuPlacement="top" placeholder="Tier…" onChange={handleChange("tier")} names={PuzzleCard.TIER_NAMES} />
      <Dropdown menuPlacement="top" placeholder="Condition…" onChange={handleChange("condition")} names={PuzzleCard.CONDITION_NAMES} />
      <Dropdown menuPlacement="top" placeholder="Variant…" onChange={handleChange("variant")} names={variantNamesForType} disabled={numVariants === 0} alertText={variantAlert} />
    </div>
  </>;
};

export default FilterRows;
