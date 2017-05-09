var createScene = function (engine, canvas) {
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 10, BABYLON.Vector3.Zero(), scene);

    camera.setPosition(new BABYLON.Vector3(0, 5, -10));
    camera.attachControl(canvas, true);

    camera.upperBetaLimit = Math.PI / 2;
    camera.lowerRadiusLimit = 4;

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    var knot = BABYLON.Mesh.CreateTorusKnot("knot", 1, 0.4, 128, 64, 2, 3, scene);

    var yellowSphere = BABYLON.Mesh.CreateSphere("yellowSphere", 16, 1.5, scene);
    yellowSphere.setPivotMatrix(BABYLON.Matrix.Translation(3, 0, 0));

    var blueSphere = BABYLON.Mesh.CreateSphere("blueSphere", 16, 1.5, scene);
    blueSphere.setPivotMatrix(BABYLON.Matrix.Translation(-1, 3, 0));

    var greenSphere = BABYLON.Mesh.CreateSphere("greenSphere", 16, 1.5, scene);
    greenSphere.setPivotMatrix(BABYLON.Matrix.Translation(0, 0, 3));

    var generateSatelliteMaterial = function (root, color, others) {
        var material = new BABYLON.StandardMaterial("satelliteMat" + root.name, scene);
        material.diffuseColor = color;

        var probe = new BABYLON.ReflectionProbe("satelliteProbe" + root.name, 512, scene);
        for (var index = 0; index < others.length; index++) {
            probe.renderList.push(others[index]);
        }

        material.reflectionTexture = probe.cubeTexture;

        material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
        material.reflectionFresnelParameters.bias = 0.02;

        root.material = material;
        probe.attachToMesh(root);
    }

    // Mirror
    var mirror = BABYLON.Mesh.CreateBox("Mirror", 1.0, scene);
    mirror.scaling = new BABYLON.Vector3(100.0, 0.01, 100.0);
    mirror.material = new BABYLON.StandardMaterial("mirror", scene);
    mirror.material.diffuseTexture = new BABYLON.Texture("assets/textures/amiga.jpg", scene);
    mirror.material.diffuseTexture.uScale = 10;
    mirror.material.diffuseTexture.vScale = 10;
    mirror.material.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    mirror.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -2.0);
    mirror.material.reflectionTexture.renderList = [greenSphere, yellowSphere, blueSphere, knot];
    mirror.material.reflectionTexture.level = 0.5;
    mirror.position = new BABYLON.Vector3(0, -2, 0);

    // Main material	
    var mainMaterial = new BABYLON.StandardMaterial("main", scene);
    knot.material = mainMaterial;

    var probe = new BABYLON.ReflectionProbe("main", 512, scene);
    probe.renderList.push(yellowSphere);
    probe.renderList.push(greenSphere);
    probe.renderList.push(blueSphere);
    probe.renderList.push(mirror);
    mainMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5);
    mainMaterial.reflectionTexture = probe.cubeTexture;
    mainMaterial.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    mainMaterial.reflectionFresnelParameters.bias = 0.02;

    // Satellite
    generateSatelliteMaterial(yellowSphere, BABYLON.Color3.Yellow(), [greenSphere, blueSphere, knot, mirror]);
    generateSatelliteMaterial(greenSphere, BABYLON.Color3.Green(), [yellowSphere, blueSphere, knot, mirror]);
    generateSatelliteMaterial(blueSphere, BABYLON.Color3.Blue(), [greenSphere, yellowSphere, knot, mirror]);

    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = scene.clearColor;
    scene.fogStart = 20.0;
    scene.fogEnd = 50.0;

    // Animations
    scene.registerBeforeRender(function () {
        yellowSphere.rotation.y += 0.01;
        greenSphere.rotation.y += 0.01;
        blueSphere.rotation.y += 0.01;
    });

    return scene;
};

var renderCanvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(renderCanvas);
var scene = createScene(engine, renderCanvas);

engine.runRenderLoop(function () {
    scene.render();
});