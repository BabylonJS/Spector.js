namespace SPECTOR {
    export interface IExtensions extends IState {
        getExtensions(): ExtensionList;
    }

    export type ExtensionsConstructor = {
        new (options: IStateOptions, logger: ILogger): IExtensions;
    };
}

namespace SPECTOR.States.Information {
    export interface IExtensionDefinition {
        readonly name: string;
        readonly description?: string;
    }

    export interface IExtension {
        readonly name: string;
        readonly extension: any;
    }

    export class Extensions extends BaseState implements IExtensions {

        private readonly extensionDefinition: IExtensionDefinition[][];

        constructor(options: IStateOptions, logger: ILogger) {
            super(options, logger);

            this.extensionDefinition = [
                [{ name: "ANGLE_instanced_arrays", description: "" },
                { name: "EXT_blend_minmax", description: "" },
                { name: "EXT_color_buffer_float", description: "" },
                { name: "EXT_color_buffer_half_float", description: "" },

                { name: "EXT_disjoint_timer_query", description: "" },

                { name: "EXT_frag_depth", description: "" },
                { name: "EXT_sRGB", description: "" },
                { name: "EXT_shader_texture_lod", description: "" },
                { name: "EXT_texture_filter_anisotropic", description: "" },
                { name: "OES_element_index_uint", description: "" },
                { name: "OES_standard_derivatives", description: "" },
                { name: "OES_texture_float", description: "" },

                { name: "OES_texture_float_linear", description: "" },
                { name: "OES_texture_half_float", description: "" },
                { name: "OES_texture_half_float_linear", description: "" },
                { name: "OES_vertex_array_object", description: "" },
                { name: "WEBGL_color_buffer_float", description: "" },
                { name: "WEBGL_compressed_texture_astc", description: "" },
                { name: "WEBGL_compressed_texture_atc", description: "" },
                { name: "WEBGL_compressed_texture_etc", description: "" },
                { name: "WEBGL_compressed_texture_etc1", description: "" },
                { name: "WEBGL_compressed_texture_s3tc", description: "" },
                // { name: "WEBGL_debug_renderer_info", description: "" },
                // { name: "WEBGL_debug_shaders", description: "" },
                { name: "WEBGL_depth_texture", description: "" },
                { name: "WEBGL_draw_buffers", description: "" }],
                // ,
                // WebGl2
                // []
            ];

            this.currentState = this.startCapture();
        }

        public getExtensions(): ExtensionList {
            return this.extensions;
        }

        protected readFromContext(): void {
            for (let version = 1; version <= this.contextVersion; version++) {
                if (version > this.extensionDefinition.length) {
                    break;
                }

                for (const parameter of this.extensionDefinition[version - 1]) {
                    const value = this.context.getExtension(parameter.name);
                    if (value) {
                        this.currentState[parameter.name] = true;
                        this.extensions[parameter.name] = value;
                    }
                    else {
                        this.currentState[parameter.name] = false;
                    }
                }
            }
        }
    }
}
