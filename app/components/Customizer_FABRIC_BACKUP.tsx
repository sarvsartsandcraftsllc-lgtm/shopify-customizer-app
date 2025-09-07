// BACKUP OF FABRIC.JS CROP IMPLEMENTATION
// This is the current working Fabric.js approach that we're backing up
// before implementing the HTML5 Canvas approach

const applyCropFabricBackup = () => {
  // SIMPLEST POSSIBLE APPROACH: Use setTimeout to avoid scoping issues
  console.log('Creating cropped image using setTimeout approach...');
  
  setTimeout(() => {
    console.log('Creating cropped image in setTimeout...');
    
    const img = new Image();
    // Use fabric.Image.fromURL instead of new fabric.Image
    fabric.Image.fromURL(croppedDataURL, function(fabricImg) {
      if (!fabricImg) {
        console.error('Failed to create fabric image from URL');
        setIsCropping(false);
        return;
      }
      
      console.log('Fabric image created from URL:', fabricImg);
      console.log('Image source:', croppedDataURL.substring(0, 100) + '...');
      
      // Set properties on the fabric image
      fabricImg.set({
        left: 400, // Center of canvas (800/2)
        top: 500,  // Center of canvas (1000/2)
        originX: 'center',
        originY: 'center',
        scaleX: 2, // Start with 2x scale for visibility
        scaleY: 2, // Start with 2x scale for visibility
        selectable: true,
        evented: true,
        name: 'cropped-image-' + Date.now(),
        stroke: '#ff0000',
        strokeWidth: 3, // Thinner border so it doesn't hide content
        cornerColor: '#ff0000',
        cornerSize: 10, // Smaller corners
        hasBorders: true,
        hasControls: true,
        // Make it more visible
        opacity: 1.0,
        visible: true,
        // NO BACKGROUND - let the image content show through
        backgroundColor: 'transparent'
      });
      
      console.log('Fabric image properties set:', fabricImg);
      
      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      setSelectedObject(fabricImg);
      
      // Force canvas to render
      canvas.renderAll();
      
      console.log('Canvas objects after adding cropped image:', canvas.getObjects().map(obj => ({
        name: obj.name,
        type: obj.type,
        left: obj.left,
        top: obj.top,
        width: obj.width,
        height: obj.height,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY
      })));
      
      // Canvas is working - no test rectangle needed

      // Debug: Check if the image is actually visible (after adding to canvas)
      setTimeout(() => {
        const allObjects = canvas.getObjects();
        const croppedImage = allObjects.find(obj => obj.name && obj.name.startsWith('cropped-image-'));
        if (croppedImage) {
          console.log('CROPPED IMAGE VISIBILITY CHECK:', {
            name: croppedImage.name,
            left: croppedImage.left,
            top: croppedImage.top,
            width: croppedImage.width,
            height: croppedImage.height,
            scaleX: croppedImage.scaleX,
            scaleY: croppedImage.scaleY,
            visible: croppedImage.visible,
            opacity: croppedImage.opacity,
            isSelected: croppedImage === canvas.getActiveObject()
          });
          
          // Check if it's within canvas bounds
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          console.log('Canvas bounds:', { width: canvasWidth, height: canvasHeight });
          console.log('Image bounds:', {
            left: croppedImage.left,
            top: croppedImage.top,
            right: croppedImage.left + (croppedImage.width * croppedImage.scaleX),
            bottom: croppedImage.top + (croppedImage.height * croppedImage.scaleY)
          });
          console.log('✅ CROPPED IMAGE SUCCESSFULLY ADDED TO CANVAS!');
        } else {
          console.error('❌ CROPPED IMAGE NOT FOUND ON CANVAS!');
        }
      }, 50);
      
      setCropMode(false);
      setIsCropping(false);
      setCropOverlay(null);
      setCropRect(null);
      
      console.log('Crop completed in setTimeout');
    };
    
    img.onerror = function() {
      console.error('Image load error in setTimeout');
      setIsCropping(false);
    };
    
    img.src = croppedDataURL;
  }, 100);
};








