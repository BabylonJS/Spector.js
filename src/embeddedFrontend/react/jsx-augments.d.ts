/**
 * Augment React's JSX intrinsic elements to allow the `commandName` attribute
 * on any HTML element. The SCSS styles in captureMenu.scss use
 * [commandName=onCaptureRequested] etc. as selectors, so React components must
 * output this attribute on the DOM.
 *
 * React passes unknown attributes through to the DOM on lowercase elements,
 * but TypeScript needs this declaration to accept them in JSX.
 */
import "react";

declare module "react" {
    interface HTMLAttributes<T> {
        commandName?: string;
        commandEventBinding?: string;
    }
}
