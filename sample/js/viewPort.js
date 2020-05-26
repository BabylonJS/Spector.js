var createScene = function (engine, canvas) {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates and positions a free camera (non-mesh)
    var camera2 = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera2.setTarget(BABYLON.Vector3.Zero());

    camera2.viewport = new BABYLON.Viewport(0.5, 0.5, 0.5, 0.5);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape.
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

    var rtt = new BABYLON.RenderTargetTexture("", 1024, scene);
    rtt.renderList.push(sphere);
    rtt.activeCamera = camera2;

    scene.removeMesh(sphere);

    scene.customRenderTargets.push(rtt);

    var mat = new BABYLON.StandardMaterial("", scene);
    mat.disableLighting = true;
    // mat.emissiveColor = BABYLON.Color3.White();
    mat.emissiveTexture = rtt;

    ground.material = mat;

    return scene;

};

var renderCanvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(renderCanvas);
var scene = createScene(engine, renderCanvas);

engine.runRenderLoop(function () {
    scene.render();
});