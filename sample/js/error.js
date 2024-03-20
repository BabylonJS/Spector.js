const canvas = document.getElementById("renderCanvas");
const gl = canvas.getContext("webgl");

function loop() {
    gl.clearColor(0.3, 0.3, 0.3, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    console.log(gl.getError(), "before")
    gl.clear(0xFFFF)
    console.log(gl.getError(), "after")

    window.requestAnimationFrame(function() {
        loop();
  });
}
loop();
