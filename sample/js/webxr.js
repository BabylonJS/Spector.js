
let createScene = async function (engine) {
    let scene = new BABYLON.Scene(engine);
    let camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(renderCanvas, true);
    let light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    let sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", { segments: 16, diameter: 2 }, scene);
    sphere.position.y = 1;

    const env = scene.createDefaultEnvironment();

    // here we add XR support
    const xr = await scene.createDefaultXRExperienceAsync({
        floorMeshes: [env.ground],
    });

    // we can't access the Spector UI while in WebXR, so we take a capture whenever the trigger
    // is pressed instead.
    let previousTriggerPressed = false;
    xr.input.onControllerAddedObservable.add((controller) => {
        let triggerComponent = controller.gamepadController.components["xr-standard-trigger"];
        triggerComponent.onButtonStateChanged.add((stateObject) => {
            if (stateObject.pressed && !previousTriggerPressed) {
                spector.captureXRContext();
            }
            previousTriggerPressed = stateObject.pressed;
        });
    });

    return scene;
};

function renderMain(renderCanvas) {
    let engine = new BABYLON.Engine(renderCanvas);
    createScene(engine, renderCanvas).then((scene) => {
        engine.runRenderLoop(function () {
            scene.render();
        });
    });
}

var MAIN_THREAD = typeof window === "object";

if (MAIN_THREAD) {
    var renderCanvas = document.getElementById('renderCanvas');
    renderMain(renderCanvas);
} else {
    console.error("This sample is not available in worker");
}

