var createScene = function (engine, canvas) {
    var scene = new BABYLON.Scene(engine);

    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(10, 50, 50), scene);
    var camera = new BABYLON.ArcRotateCamera("Camera", 1.45, 1.5, 20, new BABYLON.Vector3(-10, 5, 0), scene);

    camera.attachControl(canvas, true);
	camera.maxZ = 100000;
	
	//HIGHLIGHT LAYER
	var hl = new BABYLON.HighlightLayer("hl", scene);

    var material1 = new BABYLON.StandardMaterial("mat1", scene);
    material1.diffuseColor = new BABYLON.Color3(1, 1, 0);

    for (var i = 0; i < 200; i++) {
        var box = BABYLON.Mesh.CreateBox("Box"+i.toString(), 5.0, scene);
        box.material = material1;
        box.position = new BABYLON.Vector3(-20, 0, -i * 20);
		
		//Apply Highlight layer to boxes
		hl.addMesh(box, BABYLON.Color3.White());
    };

    // Skyboxes
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
	
    var skybox1 = BABYLON.Mesh.CreateBox("skyBox1", 20, scene);
    skybox1.material = skyboxMaterial;
	skybox1.visibility = 0.5;	
    skybox1.enableEdgesRendering();
    skybox1.edgesWidth = 2;
	
	//EXCLUDE Meshes from HiglightLayer
	hl.addExcludedMesh(skybox1);

    return scene;
};

var renderCanvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(renderCanvas);
var scene = createScene(engine, renderCanvas);

engine.runRenderLoop(function() {
    scene.render();
});