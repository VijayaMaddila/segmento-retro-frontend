import { useEffect } from "react";

/**
 * Listens for mousedown outside the given ref(s) and calls the callback.
 * @param {React.RefObject|React.RefObject[]} refOrRefs - Single ref or array of refs to check
 * @param {function(Event): void} onClickOutside - Callback when click is outside
 * @param {boolean} [enabled=true] - Whether the listener is active
 */
export function useClickOutside(refOrRefs, onClickOutside, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleClick(e) {
      const refs = Array.isArray(refOrRefs) ? refOrRefs : [refOrRefs];
      const isOutside = refs.every(
        (ref) => !ref?.current || !ref.current.contains(e.target)
      );
      if (isOutside) onClickOutside(e);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [refOrRefs, onClickOutside, enabled]);
}
