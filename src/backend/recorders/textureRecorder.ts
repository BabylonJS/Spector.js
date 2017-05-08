// namespace SPECTOR.Recorders {
//     namespace SPECTOR.Recorders {

//         @Decorators.recorder("Texture")
//         export class TextureRecorder extends BaseRecorder {
//             private currentTarget: number = null;

//             public create(functionInformation: IFunctionInformation): RecordId {
//                 return undefined;
//             }

//             public update(functionInformation: IFunctionInformation): RecordId {
//                 return undefined;
//             }

//             public delete(functionInformation: IFunctionInformation): RecordId {
//                 return undefined;
//             }

//             protected getCreateCommandNames(): string[] {
//                 return ["createTexture"];
//             }

//             protected getBindCommandNames(): string[] {
//                 return ["bindTexture"];
//             }

//             protected getUpdateCommandNames(): string[] {
//                 return ["texImage2D"];
//             }

//             protected getDeleteCommandNames(): string[] {
//                 return ["deleteTexture"];
//             }

//             protected create(functionInformation: IFunctionInformation): object {
//                 return undefined;
//             }
//             protected update(functionInformation: IFunctionInformation): object {
//                 getParameter(finctionInformation.argiuments[0] ? "2d" : "cube")...

//                 this.currentTexture.tag.version++;
//                 this.records[tag] = data;
//                 ... ioter clientInformation.
//                 // add memory.
//             }
//             protected delete(functionInformation: IFunctionInformation): object {
//                 delete this.records[tag];
//                 //remove memory/
//             }
//         }
//     }
