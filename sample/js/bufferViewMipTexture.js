// Create the scene displayed.
var createScene = function (engine, canvas) {

    // Creates and initializes the scene's clear color.
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = BABYLON.Color3.Black();

    // Creates a camera targeting the origin of the scene linked to the user inputs.
    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 100,
        new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, false);

    // Loads a nice looking glass bunny.
    loadBunny(scene, (bunny) => {
        var highlightLayer = new BABYLON.HighlightLayer("highlightLayer", scene, { mainTextureFixedSize: 256 });
        highlightLayer.addMesh(bunny, new BABYLON.Color3(0.0, 1.0, 1.0));
    });

    return scene;
}

// Load a stanford bunny in the scene from the obj model.
function loadBunny(scene, callback) {

    // Creates an HDR environment.
    var environmentTexture = new BABYLON.HDRCubeTexture("assets/textures/environment.babylon.hdr", scene);

    // Create a PBR material setup as glass.
    var glassMaterial = new BABYLON.PBRMaterial("glassMaterial", scene);
    glassMaterial.linkRefractionWithTransparency = true;
    glassMaterial.indexOfRefraction = 0.52;
    glassMaterial.alpha = 0;
    glassMaterial.cameraContrast = 1.6;
    glassMaterial.microSurface = 1.0;
    glassMaterial.reflectivityColor = new BABYLON.Color3(0.25, 0.25, 0.25);
    glassMaterial.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95);
    glassMaterial.refractionTexture = environmentTexture;
    glassMaterial.reflectionTexture = environmentTexture;

    // Load a standford bunny and apply the material to it.
    BABYLON.SceneLoader.ImportMesh(null, "assets/models/", "stanfordBunny.obj", scene, function (meshes) {
        var bunny = meshes[0];
        bunny.scaling.x = bunny.scaling.y = bunny.scaling.z = 300;
        bunny.position.x = 8;
        bunny.position.y = -28;
        bunny.position.z = -20;

        bunny.material = glassMaterial;

        var positions = bunny.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        var indices = bunny.getIndices();
        var normals = bunny.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        bunny.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true, true);

        // Once all done, notify the create scene function.
        callback(bunny);
    });
}

var renderCanvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(renderCanvas);
var scene = createScene(engine, renderCanvas);

engine.runRenderLoop(function () {
    scene.render();
});
