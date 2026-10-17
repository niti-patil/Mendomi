import { useRef, useEffect } from 'react';

// Enables click-and-drag (mouse) + native touch scrolling on any scrollable element, on all devices.
// Uses window-level listeners during a drag (no setPointerCapture) so child click events still fire.
export function useDragScroll() {
  const ref = useRef(null);
  const state = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  useEffect(() => {
    const onMove = (e) => {
      const el = ref.current;
      if (!el || !state.current.down) return;
      const dx = e.clientX - state.current.startX;
      if (Math.abs(dx) > 4) state.current.moved = true;
      el.scrollLeft = state.current.scrollLeft - dx;
    };
    const onUp = () => { state.current.down = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const onPointerDown = (e) => {
    const el = ref.current;
    if (!el) return;
    state.current.down = true;
    state.current.moved = false;
    state.current.startX = e.clientX;
    state.current.scrollLeft = el.scrollLeft;
  };

  // Prevent a nav click from firing after a drag
  const onClickCapture = (e) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    ref,
    onPointerDown,
    onClickCapture,
    style: { cursor: 'grab', touchAction: 'pan-x' },
  };
}