var createScene = function (engine, canvas) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0.4, 1.2, 20, new BABYLON.Vector3(-10, 0, 0), scene);

    camera.attachControl(canvas, true);

    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 100.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/sample/assets/textures/TropicalSunnyDay", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    return scene;
};

function renderMain(renderCanvas) {
    var engine = new BABYLON.Engine(renderCanvas);
    var scene = createScene(engine, renderCanvas);

    engine.runRenderLoop(function() {
        scene.render();
    });
}

var MAIN_THREAD = typeof window === "object";

if (MAIN_THREAD) {
    var renderCanvas = document.getElementById('renderCanvas');
    renderMain(renderCanvas);
} else {
    console.error("This sample is not available in worker");
}
