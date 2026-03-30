import React, { useCallback, useRef } from "react";
import { useStore } from "../../shared/ExternalStore";
import { useResultView } from "../ResultViewContext";
import { MenuStatus } from "../../shared/types";

/**
 * Result view tab menu bar.
 * Original: src/embeddedFrontend/resultView/menu/resultViewMenuComponent.ts
 *
 * DOM structure (matching original exactly):
 * <ul class="resultViewMenuComponent">
 *   <li class="resultViewMenuOpen resultViewMenuSmall"><a href="#" role="button">Menu</a></li>
 *   <li class="searchContainer">
 *     <input ... commandName="onSearchTextChanged" commandEventBinding="change">
 *     <a class="clearSearch" ...>X</a>
 *   </li>
 *   <li><a class="[active?]" href="#" role="button" commandName="onCapturesClicked">Captures</a></li>
 *   ... (Information, Init State, Commands, End State)
 *   <li><a role="button" commandName="onCloseClicked">Close</a></li>
 * </ul>
 */
export function ResultViewMenu() {
    const adapter = useResultView();
    const state = useStore(adapter.store);
    const lisRef = useRef<HTMLUListElement>(null);

    const handleMenuToggle = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const openButton = (e.currentTarget.parentElement as HTMLLIElement);
        const ul = openButton.parentElement;
        if (!ul) { return; }
        const lis = ul.querySelectorAll("li:not(.resultViewMenuSmall)");

        if (openButton.getAttribute("open") === "true") {
            openButton.setAttribute("open", "false");
            for (let i = 0; i < lis.length; i++) {
                (lis[i] as HTMLElement).style.display = "none";
                (lis[i] as HTMLElement).style.visibility = "hidden";
            }
        } else {
            openButton.setAttribute("open", "true");
            for (let i = 0; i < lis.length; i++) {
                (lis[i] as HTMLElement).style.display = "block";
                (lis[i] as HTMLElement).style.visibility = "visible";
            }
        }
    }, []);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        adapter.handleSearchTextChange(e.target.value);
    }, [adapter]);

    const handleClearSearch = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        adapter.handleSearchTextChange("");
    }, [adapter]);

    const handleTab = useCallback((status: MenuStatus) => (e: React.MouseEvent) => {
        e.preventDefault();
        adapter.handleMenuStatusChange(status);
    }, [adapter]);

    const handleClose = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        adapter.handleClose();
    }, [adapter]);

    return (
        <ul className="resultViewMenuComponent" ref={lisRef}>
            <li className="resultViewMenuOpen resultViewMenuSmall">
                <a href="#" role="button" onClick={handleMenuToggle}>Menu</a>
            </li>

            <li className="searchContainer">
                <input
                    type="text"
                    placeholder="Search..."
                    value={state.searchText}
                    commandName="onSearchTextChanged"
                    commandEventBinding="change"
                    onChange={handleSearch}
                />
                <a className="clearSearch" commandName="onSearchTextCleared" onClick={handleClearSearch}>X</a>
            </li>
            <li>
                <a
                    className={state.menuStatus === MenuStatus.Captures ? "active" : ""}
                    href="#"
                    role="button"
                    commandName="onCapturesClicked"
                    onClick={handleTab(MenuStatus.Captures)}
                >Captures</a>
            </li>
            <li>
                <a
                    className={state.menuStatus === MenuStatus.Information ? "active" : ""}
                    href="#"
                    role="button"
                    commandName="onInformationClicked"
                    onClick={handleTab(MenuStatus.Information)}
                >Information</a>
            </li>
            <li>
                <a
                    className={state.menuStatus === MenuStatus.InitState ? "active" : ""}
                    href="#"
                    role="button"
                    commandName="onInitStateClicked"
                    onClick={handleTab(MenuStatus.InitState)}
                >Init State</a>
            </li>
            <li>
                <a
                    className={state.menuStatus === MenuStatus.Commands ? "active" : ""}
                    href="#"
                    role="button"
                    commandName="onCommandsClicked"
                    onClick={handleTab(MenuStatus.Commands)}
                >{`Commands${state.commandCount > 0 ? " (" + state.commandCount + ")" : ""}`}</a>
            </li>
            <li>
                <a
                    className={state.menuStatus === MenuStatus.EndState ? "active" : ""}
                    href="#"
                    role="button"
                    commandName="onEndStateClicked"
                    onClick={handleTab(MenuStatus.EndState)}
                >End State</a>
            </li>
            <li>
                <a
                    role="button"
                    commandName="onCloseClicked"
                    onClick={handleClose}
                >Close</a>
            </li>
        </ul>
    );
}
