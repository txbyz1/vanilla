/**
 * @copyright 2009-2019 Vanilla Forums Inc.
 * @license GPL-2.0-only
 */

/**
 * Register a callback for focusin and focusin out events. The main improvement here over registering
 * the listeners yourself is that the events fire for the whole tree as 1 item instead of as
 * individual notes.
 *
 * This is particularly useful when you want to track focus leaving or enterring a component
 * without caring about the individual contents inside.
 */
export class FocusWatcher {
    /**
     * @param watchedNode - The watched dom node.
     * @param callback - A callback for when the tree focuses and blurs.
     */
    public constructor(private watchedNode: Element, private changeHandler: (hasFocus: boolean) => void) {}

    /**
     * Register the event listeners from this class.
     */
    public start = () => {
        this.watchedNode.addEventListener("focusout", this.handleFocusOut, true);
        this.watchedNode.addEventListener("focusin", this.handleFocusIn, true);
        document.addEventListener("click", this.handleClick);
    };

    /**
     * Remove the event listeners from this class.
     */
    public stop = () => {
        this.watchedNode.removeEventListener("focusout", this.handleFocusOut, true);
        this.watchedNode.removeEventListener("focusin", this.handleFocusIn, true);
        document.removeEventListener("click", this.handleClick);
    };

    /**
     * Handle when an element loses focus.
     */
    private handleFocusOut = (event: FocusEvent) => {
        this.checkDomTreeHasFocus(event, this.changeHandler);
    };

    /**
     * Handle an element gaining focus.
     */
    private handleFocusIn = (event: FocusEvent) => {
        this.checkDomTreeHasFocus(event, this.changeHandler);
    };

    /**
     * Handle an element being clicked.
     */
    private handleClick = (event: MouseEvent) => {
        const triggeringElement = event.target as Element;
        const wasClicked = this.checkDomTreeWasClicked(triggeringElement);
        if (!wasClicked) {
            this.changeHandler(false);
        }
    };

    /**
     * Determine whether or not our DOM tree was clicked.
     */
    private checkDomTreeWasClicked(clickedElement: Element) {
        return (
            this.watchedNode &&
            clickedElement &&
            (this.watchedNode.contains(clickedElement as Element) || this.watchedNode === clickedElement)
        );
    }

    /**
     * Determine if the currently focused element is somewhere inside of (or the same as)
     * a given Element.
     *
     * @param watchedNode - The watched node to look in.
     */
    private checkDomTreeHasFocus(event: FocusEvent, callback: (hasFocus: boolean) => void) {
        setTimeout(() => {
            const possibleTargets = [
                // NEEDS TO COME FIRST, because safari will populate relatedTarget on focusin, and its not what we're looking for.
                document.activeElement, // IE11, Safari.
                event.relatedTarget as Element, // Chrome (The actual standard)
                (event as any).explicitOriginalTarget, // Firefox
            ];

            let activeElement = null;
            for (const target of possibleTargets) {
                if (target && target !== document.body) {
                    activeElement = target;
                    break;
                }
            }

            if (activeElement !== null) {
                const isWatchedInBody = document.body.contains(this.watchedNode);
                const isFocusedInBody = document.body.contains(activeElement);
                const isModal = document.getElementById("modals")?.contains(activeElement);
                const hasFocus =
                    this.watchedNode &&
                    activeElement &&
                    (activeElement === this.watchedNode || this.watchedNode.contains(activeElement));

                // We will only invalidate based on something actually getting focus.
                // Make sure we are still mounted before calling this.
                // It could happen that our flyout is unmounted in between the setTimeout call.
                // We might have focused on a modal which can't be in the watched tree.
                if (isWatchedInBody && isFocusedInBody && !isModal) {
                    callback(!!hasFocus);
                }
            }
        }, 0);
    }
}
