namespace SPECTOR {
    export type InjectionType =  {
        readonly WebGlObjectNamespace: FunctionIndexer;
        readonly RecorderNamespace: FunctionIndexer;
        readonly CommandNamespace: FunctionIndexer;
        readonly StateNamespace: FunctionIndexer;

        readonly StackTraceCtor: StackTraceConstructor;
        readonly LoggerCtor: LoggerConstructor;
        readonly EventCtor: EventConstructor;
        readonly TimeCtor: TimeConstructor;

        readonly CanvasSpyCtor: CanvasSpyConstructor;    
        readonly CommandSpyCtor: CommandSpyConstructor;
        readonly ContextSpyCtor: ContextSpyConstructor;
        readonly RecorderSpyCtor: RecorderSpyConstructor;    
        readonly StateSpyCtor: StateSpyConstructor;    
        readonly TimeSpyCtor: TimeSpyConstructor;
        readonly WebGlObjectSpyCtor: WebGlObjectSpyConstructor;

        readonly ExtensionsCtor: ExtensionsConstructor;
        readonly CapabilitiesCtor: StateConstructor;
        readonly CompressedTexturesCtor: StateConstructor;

        readonly DefaultCommandCtor: CommandConstructor;

        readonly CaptureMenuConstructor: CaptureMenuConstructor;
        readonly ResultViewConstructor: ResultViewConstructor;
    }
}

namespace SPECTOR.ProvidedInjection  {
    export const DefaultInjection: InjectionType = {
        WebGlObjectNamespace: WebGlObjects,
        RecorderNamespace: Recorders,
        CommandNamespace: Commands,
        StateNamespace: States,

        StackTraceCtor: Utils.StackTrace,
        LoggerCtor: Utils.ConsoleLogger,
        EventCtor: Utils.Event,
        TimeCtor: Utils.Time,

        CanvasSpyCtor: Spies.CanvasSpy,    
        CommandSpyCtor: Spies.CommandSpy,
        ContextSpyCtor: Spies.ContextSpy,
        RecorderSpyCtor: Spies.RecorderSpy,    
        StateSpyCtor: Spies.StateSpy,
        TimeSpyCtor: Spies.TimeSpy,
        WebGlObjectSpyCtor: Spies.WebGlObjectSpy,

        ExtensionsCtor: States.Information.Extensions,
        CapabilitiesCtor: States.Information.Capabilities,
        CompressedTexturesCtor: States.Information.CompressedTextures,

        DefaultCommandCtor: Commands.DefaultCommand,

        CaptureMenuConstructor: EmbeddedFrontend.CaptureMenu,
        ResultViewConstructor: EmbeddedFrontend.ResultView,
    }
}