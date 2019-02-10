export enum CaptureComparisonStatus {
    Equal,
    Different,
    OnlyInA,
    OnlyInB,
}

export type PropertyComparisonResult = {
    name: string,
    status: CaptureComparisonStatus,
    valueA: any,
    valueB: any,
};

export type GroupComparisonResult = {
    name: string,
    groups: GroupComparisonResult[],
    properties: PropertyComparisonResult[],
    status: CaptureComparisonStatus,
};

export interface ICommandCaptureComparison {
    groups: GroupComparisonResult[];
    properties: PropertyComparisonResult[];
}
