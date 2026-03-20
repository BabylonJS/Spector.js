import React from "react";
import { JSONRenderItem } from "../../shared/types";
import { JSONGroup } from "./JSONGroup";
import { JSONItem } from "./JSONItem";
import { JSONImageItem } from "./JSONImageItem";
import { JSONHelpItem } from "./JSONHelpItem";
import { JSONVisualStateItem } from "./JSONVisualStateItem";

/**
 * Recursively renders a JSONRenderItem[] tree.
 * This bridges the pure data structures built by the adapter
 * into the React component tree that matches the original MVX DOM.
 */
export interface JSONRenderTreeProps {
    items: JSONRenderItem[];
}

export function JSONRenderTree({ items }: JSONRenderTreeProps) {
    if (!items || items.length === 0) return null;

    return (
        <>
            {items.map((item, i) => {
                switch (item.type) {
                    case "group":
                        return (
                            <JSONGroup key={i} title={item.title}>
                                <JSONRenderTree items={item.children} />
                            </JSONGroup>
                        );
                    case "item":
                        return <JSONItem key={i} itemKey={item.key} value={item.value} />;
                    case "image":
                        return <JSONImageItem key={i} itemKey={item.key} value={item.value} pixelated={item.pixelated} />;
                    case "help":
                        return <JSONHelpItem key={i} itemKey={item.key} value={item.value} help={item.help} />;
                    case "visualState":
                        return <JSONVisualStateItem key={i} visualState={item.visualState} />;
                    default:
                        return null;
                }
            })}
        </>
    );
}
