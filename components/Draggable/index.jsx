// A wrapper for react-draggable that fixes this issue:
// https://github.com/react-grid-layout/react-draggable/issues/363

import { useRef, useEffect } from "react";
import ReactDraggable from "react-draggable";

const Draggable = ({ children, ...props }) => {
  const ref = useRef();

  useEffect(() => {
    const listener = addEventListener("resize", () => {
      triggerMouseEvent(ref.current, "mouseover");
      triggerMouseEvent(ref.current, "mousedown");
      triggerMouseEvent(document, "mousemove");
      triggerMouseEvent(ref.current, "mouseup");
      triggerMouseEvent(ref.current, "click");
    });

    return () => removeEventListener("resize", listener);
  }, []);

  const triggerMouseEvent = (element, eventType) => {
    const mouseEvent = document.createEvent("MouseEvents");

    mouseEvent.initEvent(eventType, true, true);
    element.dispatchEvent(mouseEvent);
  };

  return (
    <ReactDraggable {...props}>
      <div style={{ display: "inline-block" }} ref={ref}>
        {children}
      </div>
    </ReactDraggable>
  )
};

export default Draggable;
