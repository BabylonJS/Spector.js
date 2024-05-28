function start() {
  const canvas = document.getElementById("renderCanvas");
  const r = canvas.getContext("bitmaprenderer");

  const offscreen = new OffscreenCanvas(300,150);
  const gl = offscreen.getContext("webgl2");

  draw();

  function draw(t){
    gl.clearColor(1,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    const bitmap = offscreen.transferToImageBitmap();
    r.transferFromImageBitmap(bitmap);
    
    requestAnimationFrame(draw);
  }
}

start();