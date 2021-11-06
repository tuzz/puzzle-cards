import { useRef, useEffect } from "react";
import ReactSelect from "react-select";
import styles from "./styles.module.scss";

const Dropdown = ({ placeholder, onChange, names, counts, alphabetic, disabled, hidden, alertText, relevanceFn = () => true, ...props }) => {
  const ref = useRef();

  names = names.filter(s => s !== "None");
  if (alphabetic) { names.sort(); }

  const options = names.map(s => ({
    value: s,
    label: (
      <span className={`${!relevanceFn(s) && styles.less_relevant}`}>
        <span className={styles.option_name}>{s}</span>
        <span className={styles.option_count}> ({(counts || {})[s] || 0})</span>
      </span>
    ),
    ...optionColors(s),
  }));

  // Hide the dropdown when it is disabled, but preserve its value so that when
  // it becomes enabled again, it continues to have an effect.
  useEffect(() => {
    if (disabled || hidden) {
      onChange(null);
    } else {
      ref.current && onChange(ref.current.getValue()[0]);
    }
  }, [disabled, hidden]);

  // If the user selects a variant then switches to a different type with
  // variants then clear the filter. Its value is no longer preserved.
  useEffect(() => {
    const value = ref.current && ref.current.getValue()[0];

    if (value && !disabled && !names.find(s => s === value.value)) {
      ref.current.setValue(null);
    }
  }, [names]);

  return (
    <div className={`${styles.full_height} ${hidden && styles.display_none}`}>
      <ReactSelect
        ref={ref}
        placeholder={placeholder}
        onChange={onChange}
        options={options}
        classNamePrefix="dropdown"
        className={`${styles.dropdown} ${disabled && styles.display_none}`}
        styles={customStyles}
        theme={theme}
        isClearable={true}
        maxMenuHeight={1000}
        {...props}
      />

      {disabled && <div className={styles.fake_dropdown} onClick={() => alert(alertText)}>
        <span>{placeholder}</span>
        <span className={styles.na}>(N/A)</span>
      </div>}
    </div>
  );
};

const optionColors = (name) => {
  return {
    "Red":    { selectedForeground: "#f33", selectedBorder: "#f33", optionForeground: "#b00" },
    "Green":  { selectedForeground: "#3d3", selectedBorder: "#3d3", optionForeground: "#070" },
    "Blue":   { selectedForeground: "#68f", selectedBorder: "#68f", optionForeground: "#00f" },
    "Yellow": { selectedForeground: "#ff0", selectedBorder: "#ff0", optionForeground: "#770" },
    "Pink":   { selectedForeground: "#f0e", selectedBorder: "#f0e", optionForeground: "#c0b" },
    "White":  { selectedForeground: "#fff", selectedBorder: "#fff", optionForeground: "#777" },
    "Black":  { selectedForeground: "#fff", selectedBorder: "#97f", optionForeground: "#000", selectedBackground: "#111" },

    "Godly":  { selectedForeground: "#000", selectedBorder: "#ff0", selectedBackground: "#fff" },
    "Master": { selectedForeground: "#fff", selectedBorder: "#97f", selectedBackground: "#111" },

    "Signed": { selectedForeground: "black", optionForeground: "#070", selectedBackground: "white", selectedFont: "Brush Script MT", selectedFontSize: "1.25em" },
    "Limited": { selectedForeground: "#fff", selectedBorder: "#b00", optionForeground: "#c24", selectedBackground: "#111" },
    "Master Copy": { selectedForeground: "#fff", selectedBorder: "#97f", optionForeground: "#53f", selectedBackground: "#111" },
  }[name]  || { selectedForeground: "white", selectedBorder: "orange" };
};

const widths = { "Reasonable": "12rem", "Master Copy": "12.3rem" };

const customStyles = {
  control: (styles, { selectProps }) => ({ ...styles,
    backgroundColor: (selectProps.value || {}).selectedBackground || "#38261b",
    borderColor: (selectProps.value || {}).selectedBorder || "rgba(0, 0, 0, 0.5)",
    borderWidth: "2px",
    width: widths[(selectProps.value || {}).value] || styles.width,
    fontFamily: (selectProps.value || {}).selectedFont || styles.fontFamily,
    fontSize: (selectProps.value || {}).selectedFontSize || styles.fontSize,
  }),
  singleValue: (styles, { selectProps }) => ({ ...styles,
    color: (selectProps.value || {}).selectedForeground || styles.color,
    overflow: "visible",
  }),
  indicatorsContainer: (styles, { selectProps }) => ({ ...styles,
    svg: { fill: "#f22" },
  }),
  dropdownIndicator: (styles, { selectProps }) => ({ ...styles,
    svg: { fill: "#aaa" },
  }),
  option: (styles, { isSelected, data }) => ({ ...styles,
    background: isSelected ? "#aaa" : styles.background,
    color: data.optionForeground || "black",
  }),
  menu: (styles) => ({ ...styles,
    zIndex: 99999,
  }),
};

const theme = (theme) => ({ ...theme,
  colors: { ...theme.colors,
    primary: "#aaa",
    primary75: "#aaa",
    primary50: "#aaa",
    primary25: "#aaa",
    danger: "#aaa",
    dangerLight: "#aaa",
    neutral0: "white",
    neutral5: "#aaa",
    neutral10: "#aaa",
    neutral20: "#aaa",
    neutral30: "#aaa",
    neutral40: "#aaa",
    neutral50: "#aaa",
    neutral60: "#aaa",
    neutral70: "#aaa",
    neutral80: "#aaa",
    neutral90: "#aaa",
  },
});

export default Dropdown;
