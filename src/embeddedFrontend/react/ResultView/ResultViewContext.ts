import { createContext, useContext } from "react";
import type { ReactResultView } from "./ReactResultView";

export const ResultViewContext = createContext<ReactResultView | null>(null);

export function useResultView(): ReactResultView {
    const ctx = useContext(ResultViewContext);
    if (!ctx) {
        throw new Error("ResultViewContext not provided — ResultViewRoot must be rendered inside ResultViewContext.Provider");
    }
    return ctx;
}
