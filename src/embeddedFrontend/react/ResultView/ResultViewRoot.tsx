import React from "react";
import { useStore } from "../shared/ExternalStore";
import { useResultView } from "./ResultViewContext";
import { ResultViewMenu } from "./Menu/ResultViewMenu";
import { ResultViewContent } from "./Content/ResultViewContent";
import { CaptureList } from "./CaptureList/CaptureList";
import { VisualStateList } from "./VisualStateList/VisualStateList";
import { VisualStateListItem } from "./VisualStateList/VisualStateListItem";
import { CommandList } from "./CommandList/CommandList";
import { CommandListItem } from "./CommandList/CommandListItem";
import { CommandDetail } from "./CommandList/CommandDetail";
import { InformationColumn } from "./Information/InformationColumn";
import { JSONContent } from "./JSON/JSONContent";
import { SourceCode } from "./SourceCode/SourceCode";
import { JSONRenderTree } from "./JSON/JSONRenderTree";
import { MenuStatus, JSONRenderItem } from "../shared/types";

/**
 * Root component for the React ResultView.
 * Original: src/embeddedFrontend/resultView/resultViewComponent.ts
 *
 * Renders the correct content panel for each tab/menuStatus, matching
 * the exact DOM structure the SCSS expects.
 */
export function ResultViewRoot() {
    const adapter = useResultView();
    const state = useStore(adapter.store);

    return (
        <div className={`resultViewComponent ${state.visible ? "active" : ""}`}>
            <ResultViewMenu />
            <ResultViewContent>
                {state.menuStatus === MenuStatus.Captures && (
                    <CaptureList
                        active={true}
                        captures={state.captures}
                        onCaptureSelected={(i) => { adapter.selectCapture(i); adapter.handleMenuStatusChange(MenuStatus.Commands); }}
                        onSaveRequested={adapter.handleSaveRequested}
                        onCaptureLoaded={adapter.handleCaptureLoaded}
                    />
                )}

                {state.menuStatus === MenuStatus.Commands && (
                    <>
                        <VisualStateList>
                            {state.visualStates.map((vs, i) => (
                                <VisualStateListItem
                                    key={i}
                                    item={vs}
                                    onVisualStateSelected={() => adapter.handleVisualStateSelected(i)}
                                />
                            ))}
                        </VisualStateList>
                        <CommandList>
                            {state.commands.map((cmd, i) => (
                                <CommandListItem
                                    key={i}
                                    command={cmd}
                                    onCommandSelected={() => adapter.handleCommandSelected(i)}
                                    onVertexSelected={() => adapter.handleVertexSelected(i)}
                                    onFragmentSelected={() => adapter.handleFragmentSelected(i)}
                                />
                            ))}
                        </CommandList>
                        <CommandDetail>
                            <JSONRenderTree items={state.commandDetailData} />
                        </CommandDetail>
                    </>
                )}

                {state.menuStatus === MenuStatus.Information && (
                    <>
                        <InformationColumn left={true}>
                            <JSONContent>
                                <JSONRenderTree items={state.informationLeft} />
                            </JSONContent>
                        </InformationColumn>
                        <InformationColumn left={false}>
                            <JSONContent>
                                <JSONRenderTree items={state.informationRight} />
                            </JSONContent>
                        </InformationColumn>
                    </>
                )}

                {state.menuStatus === MenuStatus.InitState && (
                    <JSONContent>
                        <JSONRenderTree items={state.initStateData} />
                    </JSONContent>
                )}

                {state.menuStatus === MenuStatus.EndState && (
                    <JSONContent>
                        <JSONRenderTree items={state.endStateData} />
                    </JSONContent>
                )}

                {state.menuStatus === MenuStatus.SourceCode && state.sourceCodeState && (
                    <>
                        <SourceCode
                            state={state.sourceCodeState}
                            errorMessage={state.sourceCodeError}
                            onVertexSourceClicked={() => adapter.handleSourceCodeTabChange(false, false)}
                            onFragmentSourceClicked={() => adapter.handleSourceCodeTabChange(true, false)}
                            onTranslatedVertexSourceClicked={() => adapter.handleSourceCodeTabChange(false, true)}
                            onTranslatedFragmentSourceClicked={() => adapter.handleSourceCodeTabChange(true, true)}
                            onCloseClicked={adapter.handleSourceCodeClose}
                            onSourceCodeChanged={adapter.handleSourceCodeChanged}
                            onBeautifyChanged={adapter.handleBeautifyChanged}
                            onPreprocessChanged={adapter.handlePreprocessChanged}
                        />
                        <CommandDetail>
                            <JSONRenderTree items={state.commandDetailData} />
                        </CommandDetail>
                    </>
                )}
            </ResultViewContent>
        </div>
    );
}
