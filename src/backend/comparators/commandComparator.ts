import { ICommandCapture } from "../../shared/capture/commandCapture";
import { ICommandCaptureComparison, GroupComparisonResult, CaptureComparisonStatus, PropertyComparisonResult } from "../../shared/capture/captureComparison";

type AlreadyProcessed = { [key: string]: boolean };

export class CommandComparator {

    public compare(commandA: ICommandCapture, commandB: ICommandCapture): ICommandCaptureComparison {
        const result: ICommandCaptureComparison = {
            groups: [],
            properties: [],
        };

        const comparison = this.compareGroups("Command", commandA, commandB);
        const mainGroup = comparison.groups[0];
        result.groups = mainGroup.groups;
        result.properties = mainGroup.properties;

        return result;
    }

    private compareGroups(name: string, groupA: any, groupB: any): GroupComparisonResult {
        // Prepare cache and result.
        const processed: AlreadyProcessed = {};
        const groupResult: GroupComparisonResult = {
            name,
            groups: [],
            properties: [],
            status: CaptureComparisonStatus.Equal,
        };

        // Check A against B.
        for (const keyA in groupA) {
            if (groupA.hasOwnProperty(keyA)) {
                const valueA = groupA[keyA];
                if (groupB.hasOwnProperty(keyA)) {
                    const valueB = groupB[keyA];
                    if (typeof valueA === "object") {
                        const comparison = this.compareGroups(keyA, valueA, valueB);
                        if (comparison.status !== CaptureComparisonStatus.Equal) {
                            groupResult.status = CaptureComparisonStatus.Different;
                        }
                        groupResult.groups.push(comparison);
                    }
                    else {
                        const comparison = this.compareProperties(keyA, valueA, valueB);
                        if (comparison.status !== CaptureComparisonStatus.Equal) {
                            groupResult.status = CaptureComparisonStatus.Different;
                        }
                        groupResult.properties.push(comparison);
                    }
                }
                else {
                    groupResult.status = CaptureComparisonStatus.Different;
                    if (typeof valueA === "object") {
                        const comparison: GroupComparisonResult = {
                            name,
                            status: CaptureComparisonStatus.OnlyInA,
                            groups: [],
                            properties: [],
                        };
                        groupResult.groups.push(comparison);
                    }
                    else {
                        const comparison: PropertyComparisonResult = {
                            name,
                            status: CaptureComparisonStatus.OnlyInA,
                            valueA,
                            valueB: null,
                        };
                        groupResult.properties.push(comparison);
                    }
                }
                processed[keyA] = true;
            }
        }

        // Checks the B leftOver.
        for (const keyB in groupB) {
            if (groupB.hasOwnProperty(keyB)) {
                if (!processed[keyB]) {
                    groupResult.status = CaptureComparisonStatus.Different;
                    const valueB = groupB[keyB];
                    if (typeof valueB === "object") {
                        const comparison: GroupComparisonResult = {
                            name,
                            status: CaptureComparisonStatus.OnlyInB,
                            groups: [],
                            properties: [],
                        };
                        groupResult.groups.push(comparison);
                    }
                    else {
                        const comparison: PropertyComparisonResult = {
                            name,
                            status: CaptureComparisonStatus.OnlyInB,
                            valueA: null,
                            valueB,
                        };
                        groupResult.properties.push(comparison);
                    }
                }
            }
        }

        return groupResult;
    }

    private compareProperties(name: string, valueA: any, valueB: any): PropertyComparisonResult {
        return {
            name,
            status: (valueA === valueB) ? CaptureComparisonStatus.Equal : CaptureComparisonStatus.Different,
            valueA,
            valueB,
        };
    }
}
