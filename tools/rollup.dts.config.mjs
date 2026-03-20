import { dts } from "rollup-plugin-dts";

export default {
    input: ".temp/tsc/spector.d.ts",
    output: {
        file: "dist/spector.d.ts",
        format: "es",
        // UMD global namespace for script-tag / browser usage
        banner: "export as namespace SPECTOR;",
    },
    plugins: [dts()],
    // Ignore SCSS side-effect imports that leak into generated declarations
    external: [/\.scss$/],
};
