import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls `onClose` when a mousedown event occurs outside the referenced element.
 * Returns a ref to attach to the container element.
 *
 * The callback is stored in a ref internally so callers don't need to memoize it.
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(onClose: () => void): RefObject<T | null> {
    const containerRef = useRef<T>(null);
    const callbackRef = useRef(onClose);

    useEffect(() => {
        callbackRef.current = onClose;
    });

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                callbackRef.current();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return containerRef;
}
