import { ICapture } from '../../../src/shared/capture/capture';
import { CommandCaptureStatus } from '../../../src/shared/capture/commandCapture';

/**
 * Creates a mock ICapture for testing.
 * Provides realistic structure with minimal data.
 * All required fields from ICapture are populated with sensible defaults.
 */
export function createMockCapture(overrides: Partial<ICapture> = {}): ICapture {
    return {
        canvas: {
            width: 800,
            height: 600,
            clientWidth: 800,
            clientHeight: 600,
            browserAgent: 'test-agent',
        },
        context: {
            version: 2,
            contextAttributes: {},
            capabilities: {},
            extensions: {},
            compressedTextures: {},
        },
        initState: {},
        commands: [
            {
                name: 'clearColor',
                commandArguments: { 0: 0, 1: 0, 2: 0, 3: 1, length: 4 } as unknown as IArguments,
                result: undefined,
                startTime: 0,
                commandEndTime: 0.5,
                endTime: 1,
                marker: '',
                id: 0,
                stackTrace: [],
                status: CommandCaptureStatus.Valid,
                text: 'clearColor(0, 0, 0, 1)',
            },
            {
                name: 'clear',
                commandArguments: { 0: 16384, length: 1 } as unknown as IArguments,
                result: undefined,
                startTime: 1,
                commandEndTime: 1.5,
                endTime: 2,
                marker: '',
                id: 1,
                stackTrace: [],
                status: CommandCaptureStatus.Valid,
                text: 'clear(16384)',
            },
        ],
        endState: {},
        startTime: 0,
        listenCommandsStartTime: 0,
        listenCommandsEndTime: 16,
        endTime: 16,
        analyses: [],
        frameMemory: {},
        memory: {},
        ...overrides,
    } as ICapture;
}
