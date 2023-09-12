import { ExtensionList, IContextInformation } from "../../types/contextInformation";
import { BaseState } from "../baseState";

export interface IExtensionDefinition {
    readonly name: string;
    readonly description?: string;
}

export interface IExtension {
    readonly name: string;
    readonly extension: any;
}

export class Extensions extends BaseState {
    private readonly extensionDefinition: IExtensionDefinition[][];

    public get stateName(): string {
        return "Extensions";
    }

    constructor(options: IContextInformation) {
        super(options);

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
            { name: "WEBGL_compressed_texture_pvrtc", description: "" },
            { name: "WEBGL_compressed_texture_s3tc", description: "" },
            // { name: "WEBGL_debug_renderer_info", description: "" },
            // { name: "WEBGL_debug_shaders", description: "" },
            { name: "WEBGL_depth_texture", description: "" },
            { name: "WEBGL_draw_buffers", description: "" }],
            // ,
            // WebGl2
            [{ name: "EXT_color_buffer_float", description: "" },
            { name: "EXT_disjoint_timer_query", description: "" },
            { name: "EXT_disjoint_timer_query_webgl2", description: "" },
            { name: "EXT_texture_filter_anisotropic", description: "" },

            { name: "OES_texture_float_linear", description: "" },

            { name: "WEBGL_compressed_texture_astc", description: "" },
            { name: "WEBGL_compressed_texture_atc", description: "" },
            { name: "WEBGL_compressed_texture_etc", description: "" },
            { name: "WEBGL_compressed_texture_etc1", description: "" },
            { name: "WEBGL_compressed_texture_pvrtc", description: "" },
            { name: "WEBGL_compressed_texture_s3tc", description: "" },
                // { name: "WEBGL_debug_renderer_info", description: "" },
                // { name: "WEBGL_debug_shaders", description: "" },
            { name: "WEBGL_multi_draw", description: ""},
            { name: "WEBGL_multi_draw_instanced_base_vertex_base_instance", description: ""},
            { name: "WEBGL_draw_instanced_base_vertex_base_instance", description: ""},
            ],
        ];

        this.currentState = this.startCapture(true, this.quickCapture, this.fullCapture);
    }

    public getExtensions(): ExtensionList {
        return this.extensions;
    }

    protected readFromContext(): void {
        const extensionList = this.contextVersion === 1 ? this.extensionDefinition[0] : this.extensionDefinition[1];

        for (const parameter of extensionList) {
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
