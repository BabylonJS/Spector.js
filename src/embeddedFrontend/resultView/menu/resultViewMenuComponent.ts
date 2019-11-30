import { BaseComponent, IStateEvent } from "../../mvx/baseComponent";

export const enum MenuStatus {
    Captures = 0,
    Information = 10,
    InitState = 20,
    EndState = 30,
    Commands = 40,
}

export interface IResultViewMenuState {
    status: MenuStatus;
    searchText: string;
    commandCount: number;
}

export class ResultViewMenuComponent extends BaseComponent<IResultViewMenuState> {
    public onCapturesClicked: IStateEvent<IResultViewMenuState>;
    public onCommandsClicked: IStateEvent<IResultViewMenuState>;
    public onInformationClicked: IStateEvent<IResultViewMenuState>;
    public onInitStateClicked: IStateEvent<IResultViewMenuState>;
    public onEndStateClicked: IStateEvent<IResultViewMenuState>;
    public onCloseClicked: IStateEvent<IResultViewMenuState>;
    public onSearchTextChanged: IStateEvent<IResultViewMenuState>;
    public onSearchTextCleared: IStateEvent<IResultViewMenuState>;

    constructor() {
        super();
        this.onCapturesClicked = this.createEvent("onCapturesClicked");
        this.onCommandsClicked = this.createEvent("onCommandsClicked");
        this.onInformationClicked = this.createEvent("onInformationClicked");
        this.onInitStateClicked = this.createEvent("onInitStateClicked");
        this.onEndStateClicked = this.createEvent("onEndStateClicked");
        this.onCloseClicked = this.createEvent("onCloseClicked");
        this.onSearchTextChanged = this.createEvent("onSearchTextChanged");
        this.onSearchTextCleared = this.createEvent("onSearchTextCleared");
    }

    public render(state: IResultViewMenuState, stateId: number): Element {

        const htmlString = this.htmlTemplate`<ul class="resultViewMenuComponent">
                <li class="resultViewMenuOpen resultViewMenuSmall"><a href="#" role="button">Menu</a></li>

                <li class="searchContainer">
                    <input type="text" placeHolder="Search..." value="${state.searchText}" commandName="onSearchTextChanged" commandEventBinding="change">
                    <a class="clearSearch" stoppropagation="true" CommandName="onSearchTextCleared">X</a>
                </li>
                <li><a class="${state.status === MenuStatus.Captures ? "active" : ""} href="#" role="button" commandName="onCapturesClicked">Captures</a></li>
                <li><a class="${state.status === MenuStatus.Information ? "active" : ""} href="#" role="button" commandName="onInformationClicked">Information</a></li>
                <li><a class="${state.status === MenuStatus.InitState ? "active" : ""} href="#" role="button" commandName="onInitStateClicked">Init State</a></li>
                <li>
                    <a class="${state.status === MenuStatus.Commands ? "active" : ""} href="#" role="button" commandName="onCommandsClicked">
                        Commands${state.commandCount > 0 ? " (" + state.commandCount + ")" : ""}
                    </a>
                </li>
                <li><a class="${state.status === MenuStatus.EndState ? "active" : ""} href="#" role="button" commandName="onEndStateClicked">End State</a></li>
                <li><a role="button" commandName="onCloseClicked" stoppropagation="true">Close</a></li>
            </ul>`;

        const element = this.renderElementFromTemplate(htmlString, state, stateId);
        const openButton = element.querySelector(".resultViewMenuOpen");
        const lis = element.querySelectorAll("li:not(.resultViewMenuSmall)");
        openButton.addEventListener("click", (_) => {
            if (openButton.getAttribute("open") === "true") {
                openButton.setAttribute("open", "false");
                for (let i = 0; i < lis.length; i++) {
                    (lis[i] as HTMLElement).style.display = "none";
                    (lis[i] as HTMLElement).style.visibility = "hidden";
                }
            }
            else {
                openButton.setAttribute("open", "true");
                for (let i = 0; i < lis.length; i++) {
                    (lis[i] as HTMLElement).style.display = "block";
                    (lis[i] as HTMLElement).style.visibility = "visible";
                }
            }
        });
        return element;
    }
}
