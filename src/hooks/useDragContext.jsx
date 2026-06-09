import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const DragContext = createContext(null);

export function DragProvider({ children }) {
  const [dragging, setDragging] = useState(null);
  // Use a ref so slot mouseup handlers can read current dragging without stale closure
  const draggingRef   = useRef(null);
  const dropConsumed  = useRef(false);

  const startDrag = useCallback((student, e, source = null) => {
    e.preventDefault();
    dropConsumed.current  = false;
    const d = { student, source, x: e.clientX, y: e.clientY };
    draggingRef.current   = d;
    setDragging(d);
  }, []);

  // Slots call this to signal they accepted the drop
  const consumeDrop = useCallback(() => {
    dropConsumed.current = true;
  }, []);

  // Slots call this after handling the drop
  const endDrag = useCallback(() => {
    draggingRef.current  = null;
    dropConsumed.current = false;
    setDragging(null);
  }, []);

  // getCurrentDrag: slots use this ref so they always see live value even during mouseup
  const getCurrentDrag = useCallback(() => draggingRef.current, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) =>
      setDragging(d => {
        if (!d) return null;
        const next = { ...d, x: e.clientX, y: e.clientY };
        draggingRef.current = next;
        return next;
      });
    // Window mouseup fires AFTER element mouseup (bubbling order).
    // So by the time this fires, any slot's onMouseUp has already run.
    const onUp = () => {
      draggingRef.current  = null;
      dropConsumed.current = false;
      setDragging(null);
    };
    window.addEventListener("mousemove", onMove);
    // Use capture:false so element handlers (bubbling) fire first
    window.addEventListener("mouseup", onUp, false);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp, false);
    };
  }, [dragging]);

  return (
    <DragContext.Provider value={{ dragging, draggingRef, startDrag, endDrag, consumeDrop, getCurrentDrag }}>
      {children}
      {dragging && (
        <div className="drag-ghost" style={{ left: dragging.x, top: dragging.y }}>
          <img
            src={`https://schaledb.com/images/student/collection/${dragging.student.id}.webp`}
            alt={dragging.student.name}
          />
        </div>
      )}
    </DragContext.Provider>
  );
}

export function useDrag() {
  return useContext(DragContext);
}
