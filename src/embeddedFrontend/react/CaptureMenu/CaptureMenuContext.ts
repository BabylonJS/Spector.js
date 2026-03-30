import { createContext, useContext } from "react";
import type { ReactCaptureMenu } from "./ReactCaptureMenu";

export const CaptureMenuContext = createContext<ReactCaptureMenu | null>(null);

export function useCaptureMenu(): ReactCaptureMenu {
    const ctx = useContext(CaptureMenuContext);
    if (!ctx) {
        throw new Error("CaptureMenuContext not provided — CaptureMenuRoot must be rendered inside CaptureMenuContext.Provider");
    }
    return ctx;
}
