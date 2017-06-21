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
	
	// Mirror
    var mirror = BABYLON.Mesh.CreateBox("Mirror", 1.0, scene);
    mirror.scaling = new BABYLON.Vector3(100.0, 0.01, 100.0);
    mirror.material = new BABYLON.StandardMaterial("mirror", scene);
    mirror.material.reflectionTexture = new BABYLON.MirrorTexture("mirror", 512, scene, true);
    mirror.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -2.0);
    mirror.material.reflectionTexture.renderList = [knot];
    mirror.material.reflectionTexture.level = 1.0;
	mirror.material.reflectionTexture.samples = 8;
    mirror.position = new BABYLON.Vector3(0, -2, 0);
	
	// Main material	
	var mainMaterial = new BABYLON.StandardMaterial("main", scene);
	knot.material = mainMaterial;
	mainMaterial.diffuseTexture = new BABYLON.Texture("assets/textures/amiga.jpg", scene);

    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = scene.clearColor;
    scene.fogStart = 20.0;
    scene.fogEnd = 50.0;
	
	return scene;
};

var renderCanvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(renderCanvas);
var scene = createScene(engine, renderCanvas);

engine.runRenderLoop(function () {
    scene.render();
});