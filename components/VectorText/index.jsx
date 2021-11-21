import { useState, useRef, useEffect } from "react";
import styles from "./styles.module.scss";

const VectorText = ({ text, className, referenceText, padSide = "right" }) => {
  const [textSize, setTextSize] = useState("1em");
  const svgRef = useRef();

  const padLeft = padSide === "around" || padSide === "left";
  const padRight = padSide === "around" || padSide === "right";
  const padChar = padSide === "around" ? "\u00A0" : "\u00A0\u00A0";

  // If the text to display is shorter than the reference text, pad it by two
  // non-breaking white space character for every character missing. This keeps
  // the font-size fairly consistent, e.g. for the bottom-right number text.
  let padding = "";
  if (referenceText) {
    const numCharsShorterThanReference = referenceText.length - text.length;
    const uptoNum = [...Array(numCharsShorterThanReference).keys()];

    padding = uptoNum.map(() => padChar).join("");
  }

  useEffect(() => {
    const svg = svgRef.current;
    const text = svg.children[0];

    const { width: svgWidth, height: svgHeight } = svg.getBoundingClientRect();
    const { width: textWidth, height: textHeight } = text.getBoundingClientRect();

    const scale = Math.min(svgWidth / textWidth, svgHeight / textHeight);
    setTextSize(`${scale}em`);
  }, []);

  const xmlns = "http://www.w3.org/2000/svg";
  const classes = [styles.vector_text, className].filter(s => s).join(" ");

  return (
    <svg ref={svgRef} className={classes} xmlns={xmlns}>
      <text x="50%" y="50%" fontSize={textSize}>
        <tspan>{padLeft && padding}{text}{padRight && padding}</tspan>
      </text>
    </svg>
  );
};

export default VectorText;
