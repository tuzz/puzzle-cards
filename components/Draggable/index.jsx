// A wrapper for react-draggable that fixes this issue:
// https://github.com/react-grid-layout/react-draggable/issues/363

import { useRef, useState, useEffect } from "react";
import ReactDraggable from "react-draggable";

const Draggable = ({ children, ...props }) => {
  const ref = useRef();
  const [startCoords, setStartCoords] = useState();

  useEffect(() => {
    const listener = () => {
      triggerMouseEvent(ref.current, "mouseover");
      triggerMouseEvent(ref.current, "mousedown");
      triggerMouseEvent(document, "mousemove");
      triggerMouseEvent(ref.current, "mouseup");
      triggerMouseEvent(ref.current, "click");
    };

    addEventListener("resize", listener);
    return () => removeEventListener("resize", listener);
  }, []);

  const triggerMouseEvent = (element, eventType) => {
    const mouseEvent = document.createEvent("MouseEvents");

    mouseEvent.initEvent(eventType, true, true);
    mouseEvent.causedByResize = true;

    element.dispatchEvent(mouseEvent);
  };

  const handleStart = (event) => {
    props.handleStart && props.handleStart(event);
    if (event.causedByResize) { return; }

    setStartCoords({ x: event.clientX, y: event.clientY });
  };

  const handleStop = (event) => {
    props.handleStop && props.handleStop(event);
    if (event.causedByResize) { return; }

    if (!startCoords) { return; }

    const deltaX = (event.clientX - startCoords.x);
    const deltaY = (event.clientY - startCoords.y);

    const distance = Math.sqrt((deltaX ** 2) + (deltaY ** 2));
    if (distance < 20) { props.onClick(event); }
  };

  const detectClicks = props.onClick ? { onStart: handleStart, onStop: handleStop } : {};

  return (
    <ReactDraggable {...props} {...detectClicks}>
      <div style={{ display: "inline-block" }} ref={ref}>
        {children}
      </div>
    </ReactDraggable>
  )
};

export default Draggable;
