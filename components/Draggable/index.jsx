// A wrapper for react-draggable that fixes this issue:
// https://github.com/react-grid-layout/react-draggable/issues/363

import { useContext, useState, useRef, useEffect } from "react";
import ReactDraggable from "react-draggable";
import DragContext from "../DragRegion/context";

const Draggable = ({ children, ...props }) => {
  const dragContext = useContext(DragContext);
  const [dragObject, setDragObject] = useState();
  const ref = useRef();

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
    props.onStart && props.onStart(event);
    if (event.causedByResize) { return; }

    setDragObject({ x: event.clientX, y: event.clientY, distance: 0 });
  };

  const handleDrag = (event) => {
    props.onDrag && props.onDrag(event);
    if (event.causedByResize || !dragObject) { return; }

    setDragObject(previous => {
      const [x, y] = [event.clientX, event.clientY];

      const deltaX = (event.clientX - previous.x);
      const deltaY = (event.clientY - previous.y);

      const distance = previous.distance + Math.sqrt((deltaX ** 2) + (deltaY ** 2));

      return { x, y, distance };
    });
  };

  const handleStop = (event) => {
    props.onStop && props.onStop(event);
    if (event.causedByResize || !dragObject) { return; }

    if (dragObject.distance < 20) { props.onClick(event); }
  };

  const detectClicks = props.onClick ? { onStart: handleStart, onStop: handleStop, onDrag: handleDrag } : {};

  return (
    <ReactDraggable {...props} {...detectClicks}>
      <div style={{ display: "inline-block" }} ref={ref}>
        {children}
      </div>
    </ReactDraggable>
  )
};

export default Draggable;
