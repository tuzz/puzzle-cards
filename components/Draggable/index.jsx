// A wrapper for react-draggable that:
//
// - Fixes: https://github.com/react-grid-layout/react-draggable/issues/363
// - Adds support for onClick
// - Moves the draggable on top of others when dragged

import { useContext, useState, useRef, useEffect } from "react";
import ReactDraggable from "react-draggable";
import DragContext from "../DragRegion/context";
import styles from "./styles.module.scss";

const Draggable = ({ startPosition, position, zoomed, disabled, className, children, ...props }) => {
  startPosition = startPosition || { left: 0, top: 0 };

  const { maxZIndex, setMaxZIndex } = useContext(DragContext);
  const initialZIndex = startPosition.zIndex || maxZIndex + 1;

  const [currentZIndex, setCurrentZIndex] = useState(initialZIndex);
  const [dragObject, setDragObject] = useState();
  const [prevZoomed, setPrevZoomed] = useState(false);

  const ref = useRef();

  useEffect(() => {
    setMaxZIndex(z => Math.max(z, initialZIndex));

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

  useEffect(() => {
    const zoomedOut = prevZoomed && !zoomed;
    if (zoomedOut) { moveOnTopOfOtherDraggables(); }
    setPrevZoomed(zoomed);
  }, [zoomed]);

  const triggerMouseEvent = (element, eventType) => {
    const mouseEvent = document.createEvent("MouseEvents");

    mouseEvent.initEvent(eventType, true, true);
    mouseEvent.causedByResize = true;

    element.dispatchEvent(mouseEvent);
  };

  const moveOnTopOfOtherDraggables = () => {
    setCurrentZIndex(maxZIndex + 1);
    setMaxZIndex(maxZIndex + 1);
  };

  const handleStart = (event) => {
    moveOnTopOfOtherDraggables();

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

    if (dragObject.distance < 30) { props.onClick(event); }
  };

  const detectClicks = props.onClick ? { onStart: handleStart, onStop: handleStop, onDrag: handleDrag } : {};
  const zIndex = zoomed ? 999999 : currentZIndex;

  return (
    <ReactDraggable {...props} disabled={disabled || !!position} {...detectClicks}>
      <div ref={ref} className={`${styles.inner} ${className} ${position && styles.controlled}`} style={{ ...startPosition, zIndex, ...(position || {}) }}>
        {children}
      </div>
    </ReactDraggable>
  )
};

export default Draggable;
