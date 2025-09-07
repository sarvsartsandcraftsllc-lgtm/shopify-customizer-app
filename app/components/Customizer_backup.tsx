import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { Button, TextField, Select, Card, Text, Badge, Spinner, Modal, ButtonGroup, BlockStack, InlineStack, ButtonGroup as PolarisButtonGroup } from '@shopify/polaris';

interface CustomizerProps {
  productId: string;
  variantId: string;
  productTitle: string;
}

interface DesignData {
  design_id: string;
  preview_url: string;
  print_url: string;
}

const Customizer: React.FC<CustomizerProps> = ({ productId, variantId, productTitle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [textValue, setTextValue] = useState('');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#000000');
  const [isLoading, setIsLoading] = useState(false);
  const [designData, setDesignData] = useState<DesignData | null>(null);
  const [notes, setNotes] = useState('');
  const [showImageLimitModal, setShowImageLimitModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [selectedProduct, setSelectedProduct] = useState('t-shirt');
  const [isClient, setIsClient] = useState(false);
  const [frontImages, setFrontImages] = useState<any[]>([]);
  const [backImages, setBackImages] = useState<any[]>([]);
  const [isEnhancingQuality, setIsEnhancingQuality] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [cropOverlay, setCropOverlay] = useState<fabric.Rect | null>(null);

  // Canvas dimensions (smaller for testing)
  const CANVAS_WIDTH = 800; // Smaller canvas for testing
  const CANVAS_HEIGHT = 1000; // Smaller canvas for testing
  const PREVIEW_SCALE = 0.5; // Scale for preview
  const MAX_IMAGES = 2; // Maximum number of images allowed

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Product options
  const productOptions = [
    { label: 'T-Shirt', value: 't-shirt' },
    { label: 'Mug', value: 'mug' },
    { label: 'Tumbler', value: 'tumbler' },
    { label: 'Hoodie', value: 'hoodie' },
    { label: 'Collar T-Shirt', value: 'collar-t-shirt' },
    { label: 'Tank Top', value: 'tank-top' },
    { label: 'Long Sleeve', value: 'long-sleeve' },
    { label: 'Sweatshirt', value: 'sweatshirt' },
  ];

  // Load t-shirt background image
  const loadTShirtBackground = useCallback((view: 'front' | 'back') => {
    if (!canvas) return;

    const imageUrl = view === 'front' ? '/Front White Tshirt.png' : '/Back White Tshirt.png';
    
    console.log('Loading t-shirt background:', imageUrl);
    
    // Remove existing t-shirt background first
    const existingBackground = canvas.getObjects().find(obj => obj.name === 'tshirt-background');
    if (existingBackground) {
      canvas.remove(existingBackground);
    }

    // Try a different approach - create image element first
    console.log('=== IMAGE LOADING DEBUG START ===');
    console.log('Loading image with alternative method...');
    console.log('Image URL:', imageUrl);
    console.log('Canvas exists:', !!canvas);
    console.log('Canvas dimensions:', canvas?.getWidth(), 'x', canvas?.getHeight());
    
    // Create a new Image element
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('=== IMAGE LOADED SUCCESSFULLY ===');
      console.log('Image loaded, dimensions:', img.width, 'x', img.height);
      
      if (!canvas) {
        console.error('Canvas is null when trying to add image');
        return;
      }

      // Create Fabric image from the loaded image element
      const fabricImg = new fabric.Image(img, {
        left: CANVAS_WIDTH / 2,
        top: CANVAS_HEIGHT / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        name: 'tshirt-background'
      });

      // Scale image to fit canvas while maintaining aspect ratio
      const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
      const imgAspect = img.width / img.height;
      
      let scale;
      if (imgAspect > canvasAspect) {
        scale = CANVAS_WIDTH / img.width;
      } else {
        scale = CANVAS_HEIGHT / img.height;
      }

      console.log('Scaling image by factor:', scale);
      fabricImg.scale(scale);

      console.log('About to add image to canvas...');
      canvas.add(fabricImg);
      canvas.renderAll();
      
      console.log('T-shirt background added to canvas, total objects:', canvas.getObjects().length);
      console.log('Canvas objects:', canvas.getObjects().map(obj => ({ name: obj.name, type: obj.type })));
      console.log('=== IMAGE LOADING DEBUG END ===');
    };
    
    img.onerror = (error) => {
      console.error('=== IMAGE LOADING ERROR ===');
      console.error('Error loading image:', error);
      console.log('Adding fallback rectangle...');
      
      // Add fallback rectangle
      const fallbackRect = new fabric.Rect({
        left: CANVAS_WIDTH / 2,
        top: CANVAS_HEIGHT / 2,
        width: CANVAS_WIDTH * 0.8,
        height: CANVAS_HEIGHT * 0.8,
        fill: '#f0f0f0',
        stroke: '#ccc',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        name: 'tshirt-background-fallback'
      });
      
      canvas.add(fallbackRect);
      canvas.sendToBack(fallbackRect);
      canvas.renderAll();
      console.log('Added fallback rectangle for t-shirt background');
      console.log('=== IMAGE LOADING DEBUG END ===');
    };
    
    // Start loading the image
    console.log('Starting image load...');
    img.src = imageUrl;
  }, [canvas]);

  // Load user images for specific view
  const loadUserImagesForView = useCallback((view: 'front' | 'back') => {
    if (!canvas) return;

    // Remove existing user images
    const existingUserImages = canvas.getObjects().filter(obj => 
      obj.type === 'image' && obj.name !== 'tshirt-background' && obj.name !== 'printable-area'
    );
    existingUserImages.forEach(img => canvas.remove(img));

    // Add images for current view
    const imagesToLoad = view === 'front' ? frontImages : backImages;
    imagesToLoad.forEach(imageData => {
      // Create a new Image element from stored data
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const fabricImg = new fabric.Image(img, {
          left: imageData.left,
          top: imageData.top,
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true,
          name: imageData.name,
          // Enhanced border styling - always visible
          stroke: '#0070f3',
          strokeWidth: 3,
          cornerColor: '#0070f3',
          cornerSize: 12,
          cornerStyle: 'circle',
          transparentCorners: false,
          borderColor: '#0070f3',
          borderScaleFactor: 2,
          borderOpacityWhenMoving: 0.8,
          // Make borders always visible
          hasBorders: true,
          hasControls: true,
          // Add a subtle background to make borders more visible
          backgroundColor: 'rgba(0, 112, 243, 0.1)'
        });
        
        fabricImg.scale(imageData.scale);
        canvas.add(fabricImg);
        canvas.renderAll();
      };
      
      img.onerror = (error) => {
        console.error('Error loading stored image:', error);
      };
      
      img.src = imageData.src;
    });

    canvas.renderAll();
  }, [canvas, frontImages, backImages]);

  // Initialize fabric.js canvas
  useEffect(() => {
    console.log('Canvas initialization effect running, isClient:', isClient, 'canvasRef.current:', canvasRef.current, 'fabricCanvasRef.current:', fabricCanvasRef.current);
    
    if (isClient && canvasRef.current && !fabricCanvasRef.current) {
      console.log('=== CANVAS INITIALIZATION DEBUG ===');
      console.log('Creating new fabric canvas...');
      console.log('Canvas dimensions:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);
      console.log('Canvas element:', canvasRef.current);
      
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectBlockStacking: true,
      });

      console.log('Fabric canvas created:', fabricCanvas);
      console.log('Canvas width:', fabricCanvas.getWidth());
      console.log('Canvas height:', fabricCanvas.getHeight());

      // Set canvas properties
      fabricCanvas.setDimensions({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });

      console.log('Canvas dimensions set');

      // Enable object selection
      fabricCanvas.on('selection:created', (e) => {
        setSelectedObject(e.selected?.[0] || null);
      });

      fabricCanvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected?.[0] || null);
      });

      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      fabricCanvasRef.current = fabricCanvas;
      setCanvas(fabricCanvas);
      
      console.log('Canvas state set, canvas:', fabricCanvas);

      // Add printable area indicator
      const printableArea = new fabric.Rect({
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        fill: 'transparent',
        stroke: '#ddd',
        strokeWidth: 2,
        strokeDashArray: [10, 5],
        selectable: false,
        evented: false,
        name: 'printable-area'
      });
      fabricCanvas.add(printableArea);
      fabricCanvas.renderAll();
      
      console.log('Printable area added and canvas rendered');

      // Load initial t-shirt background after canvas is ready
      setTimeout(() => {
        console.log('Loading initial t-shirt background...');
        loadTShirtBackground('front');
      }, 500);
    } else {
      console.log('Canvas initialization skipped - conditions not met:', {
        isClient,
        canvasRefExists: !!canvasRef.current,
        fabricCanvasExists: !!fabricCanvasRef.current
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isClient]);

  // Load t-shirt background when view changes
  useEffect(() => {
    if (canvas && isClient) {
      loadTShirtBackground(currentView);
    }
  }, [canvas, currentView, isClient, loadTShirtBackground]);

  // Load user images when view changes
  useEffect(() => {
    if (canvas && isClient) {
      loadUserImagesForView(currentView);
    }
  }, [canvas, currentView, isClient, loadUserImagesForView]);

  // Count images for current view
  const countImages = useCallback(() => {
    return currentView === 'front' ? frontImages.length : backImages.length;
  }, [currentView, frontImages, backImages]);

  // Update image count when canvas changes
  useEffect(() => {
    if (canvas) {
      const count = countImages();
      setImageCount(count);
    }
  }, [canvas, countImages]);

  // Handle image upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    if (!canvas || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const currentImageCount = countImages();

    console.log('Current image count:', currentImageCount, 'Max images:', MAX_IMAGES);

    // Check if we've reached the maximum number of images
    if (currentImageCount >= MAX_IMAGES) {
      setPendingImageFile(file);
      setShowImageLimitModal(true);
      return;
    }

    addImageToCanvas(file);
  }, [canvas, countImages]);

  // Add image to canvas
  const addImageToCanvas = useCallback((file: File) => {
    if (!canvas) return;

    console.log('Adding image to canvas:', file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      
      // Create a new Image element (same approach as background)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('User image loaded, dimensions:', img.width, 'x', img.height);
        
        if (!canvas) return;

        // Create Fabric image from the loaded image element
        const fabricImg = new fabric.Image(img, {
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true,
          name: `user-image-${Date.now()}`,
          // Enhanced border styling - always visible
          stroke: '#0070f3',
          strokeWidth: 3,
          cornerColor: '#0070f3',
          cornerSize: 12,
          cornerStyle: 'circle',
          transparentCorners: false,
          borderColor: '#0070f3',
          borderScaleFactor: 2,
          borderOpacityWhenMoving: 0.8,
          // Make borders always visible
          hasBorders: true,
          hasControls: true,
          // Add a subtle background to make borders more visible
          backgroundColor: 'rgba(0, 112, 243, 0.1)'
        });

        // Scale image to fit within printable area (max 50% of canvas)
        const maxWidth = CANVAS_WIDTH * 0.5;
        const maxHeight = CANVAS_HEIGHT * 0.5;
        const scale = Math.min(
          maxWidth / img.width,
          maxHeight / img.height,
          1
        );

        console.log('Scaling user image by factor:', scale);
        fabricImg.scale(scale);

        // Add to canvas
        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        setSelectedObject(fabricImg);

        // Save image data to appropriate view array
        const imageData = {
          src: dataURL,
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          scale: scale,
          name: `user-image-${Date.now()}`
        };
        
        if (currentView === 'front') {
          setFrontImages(prev => [...prev, imageData]);
        } else {
          setBackImages(prev => [...prev, imageData]);
        }

        canvas.renderAll();
        console.log('User image added to canvas successfully');
      };
      
      img.onerror = (error) => {
        console.error('Error loading user image:', error);
      };
      
      img.src = dataURL;
    };

    reader.readAsDataURL(file);
  }, [canvas, currentView]);

  // Handle modal actions
  const handleReplaceImage = useCallback(() => {
    if (!canvas || !pendingImageFile) return;

    // Clear current view's images
    if (currentView === 'front') {
      setFrontImages([]);
    } else {
      setBackImages([]);
    }

    // Remove all user images from canvas
    const images = canvas.getObjects().filter(obj => 
      obj.type === 'image' && obj.name !== 'tshirt-background' && obj.name !== 'printable-area'
    );
    images.forEach(img => canvas.remove(img));

    // Add the new image
    addImageToCanvas(pendingImageFile);

    setShowImageLimitModal(false);
    setPendingImageFile(null);
  }, [canvas, pendingImageFile, addImageToCanvas, currentView]);

  const handleAddAnotherImage = useCallback(() => {
    if (!canvas || !pendingImageFile) return;

    // Add the new image
    addImageToCanvas(pendingImageFile);

    setShowImageLimitModal(false);
    setPendingImageFile(null);
  }, [canvas, pendingImageFile, addImageToCanvas]);

  const handleCancelImageUpload = useCallback(() => {
    setShowImageLimitModal(false);
    setPendingImageFile(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg'],
    },
    maxSize: 30 * 1024 * 1024, // 30MB
  });

  // Add text to canvas
  const addText = useCallback(() => {
    if (!canvas || !textValue.trim()) return;

    const text = new fabric.Text(textValue, {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      fontFamily,
      fontSize,
      fill: textColor,
      selectable: true,
      evented: true,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setSelectedObject(text);
    setTextValue('');
  }, [canvas, textValue, fontFamily, fontSize, textColor]);

  // Update selected object properties
  const updateSelectedObject = useCallback((updates: Partial<fabric.Object>) => {
    if (!canvas || !selectedObject) return;

    selectedObject.set(updates);
    canvas.renderAll();
  }, [canvas, selectedObject]);

  // Delete selected object
  const deleteSelectedObject = useCallback(() => {
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    canvas.renderAll();
    setSelectedObject(null);
  }, [canvas, selectedObject]);

  // Bring selected object to front
  const bringToFront = useCallback(() => {
    if (!canvas || !selectedObject) return;

    canvas.bringToFront(selectedObject);
    canvas.renderAll();
  }, [canvas, selectedObject]);

  // Send selected object to back
  const sendToBack = useCallback(() => {
    if (!canvas || !selectedObject) return;

    canvas.sendToBack(selectedObject);
    canvas.renderAll();
  }, [canvas, selectedObject]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!canvas) return;

    // Clear the appropriate view's images
    if (currentView === 'front') {
      setFrontImages([]);
    } else {
      setBackImages([]);
    }

    // Remove all user images from canvas
    const objectsToRemove = canvas.getObjects().filter(obj => 
      obj.name !== 'tshirt-background' && obj.name !== 'printable-area'
    );
    
    objectsToRemove.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    setSelectedObject(null);
  }, [canvas, currentView]);

  // Enhance image quality to 300 DPI
  const enhanceImageQuality = useCallback(async () => {
    if (!selectedObject || selectedObject.type !== 'image') {
      console.log('No image selected for quality enhancement');
      return;
    }

    setIsEnhancingQuality(true);
    
    try {
      // Get the current image data
      const imgElement = selectedObject._element;
      if (!imgElement) {
        throw new Error('Image element not found');
      }

      // Create a canvas to enhance the image
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Calculate new dimensions for 300 DPI
      const currentDPI = 72; // Standard web DPI
      const targetDPI = 300;
      const scaleFactor = targetDPI / currentDPI;
      
      const newWidth = imgElement.width * scaleFactor;
      const newHeight = imgElement.height * scaleFactor;
      
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;

      // Use high-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgElement, 0, 0, newWidth, newHeight);

      // Convert back to data URL
      const enhancedDataURL = tempCanvas.toDataURL('image/png', 1.0);
      
      // Create new image element with enhanced quality
      const enhancedImg = new Image();
      enhancedImg.crossOrigin = 'anonymous';
      
      enhancedImg.onload = () => {
        // Create new Fabric image with enhanced quality
        const enhancedFabricImg = new fabric.Image(enhancedImg, {
          left: selectedObject.left,
          top: selectedObject.top,
          originX: selectedObject.originX,
          originY: selectedObject.originY,
          selectable: true,
          evented: true,
          name: selectedObject.name + '-enhanced',
          // Enhanced border styling - always visible
          stroke: '#0070f3',
          strokeWidth: 3,
          cornerColor: '#0070f3',
          cornerSize: 12,
          cornerStyle: 'circle',
          transparentCorners: false,
          borderColor: '#0070f3',
          borderScaleFactor: 2,
          borderOpacityWhenMoving: 0.8,
          // Make borders always visible
          hasBorders: true,
          hasControls: true,
          // Add a subtle background to make borders more visible
          backgroundColor: 'rgba(0, 112, 243, 0.1)'
        });

        // Scale to match original size
        const scaleX = selectedObject.scaleX || 1;
        const scaleY = selectedObject.scaleY || 1;
        enhancedFabricImg.scaleX = scaleX;
        enhancedFabricImg.scaleY = scaleY;

        // Replace the original image
        canvas.remove(selectedObject);
        canvas.add(enhancedFabricImg);
        canvas.setActiveObject(enhancedFabricImg);
        setSelectedObject(enhancedFabricImg);
        canvas.renderAll();

        console.log('Image quality enhanced to 300 DPI');
        setIsEnhancingQuality(false);
      };

      enhancedImg.onerror = (error) => {
        console.error('Error loading enhanced image:', error);
        setIsEnhancingQuality(false);
      };

      enhancedImg.src = enhancedDataURL;

    } catch (error) {
      console.error('Error enhancing image quality:', error);
      setIsEnhancingQuality(false);
    }
  }, [selectedObject, canvas]);

  // Crop image functionality
  const startCropMode = useCallback(() => {
    if (!selectedObject || selectedObject.type !== 'image') {
      console.log('No image selected for cropping');
      return;
    }
    
    if (cropMode) {
      console.log('Already in crop mode');
      return;
    }
    
    setCropMode(true);
    setIsCropping(false);
    
    // Disable the image object during crop mode
    selectedObject.set({
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false
    });
    
    // Create a crop overlay rectangle that starts smaller than the image
    const imageBounds = selectedObject.getBoundingRect();
    console.log('Image bounds for crop:', imageBounds);
    
    // Make crop area smaller and more precise
    const cropWidth = imageBounds.width * 0.5; // Start with 50% of image width
    const cropHeight = imageBounds.height * 0.5; // Start with 50% of image height
    const cropLeft = imageBounds.left + (imageBounds.width - cropWidth) / 2; // Center horizontally
    const cropTop = imageBounds.top + (imageBounds.height - cropHeight) / 2; // Center vertically
    
    console.log('Crop overlay initial position:', { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight });
    
    const cropOverlayRect = new fabric.Rect({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
      fill: 'rgba(0, 0, 0, 0.1)', // Lighter fill to see image better
      stroke: '#ff6b35',
      strokeWidth: 4, // Thicker border
      cornerColor: '#ff6b35',
      cornerSize: 15, // Larger corners
      cornerStyle: 'circle',
      transparentCorners: false,
      selectable: true,
      evented: true,
      name: 'crop-overlay',
      // Make it obvious this is the crop area
      borderColor: '#ff6b35',
      borderScaleFactor: 2,
      // Constrain the crop overlay to stay within image bounds
      lockMovementX: false,
      lockMovementY: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: true,
      // Add a subtle shadow to make it stand out
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 5,
        offsetX: 2,
        offsetY: 2
      })
    });

    // Add event listeners to constrain the crop overlay within image bounds
    cropOverlayRect.on('moving', function(e) {
      if (!e || !e.target) return;
      
      const rect = e.target;
      if (!rect || typeof rect.left === 'undefined' || typeof rect.top === 'undefined') return;
      
      const newLeft = Math.max(imageBounds.left, Math.min(rect.left, imageBounds.left + imageBounds.width - rect.width));
      const newTop = Math.max(imageBounds.top, Math.min(rect.top, imageBounds.top + imageBounds.height - rect.height));
      
      if (rect.left !== newLeft || rect.top !== newTop) {
        rect.set({ left: newLeft, top: newTop });
        canvas.renderAll();
      }
    });

    cropOverlayRect.on('scaling', function(e) {
      if (!e || !e.target) return;
      
      const rect = e.target;
      if (!rect || typeof rect.left === 'undefined' || typeof rect.top === 'undefined') return;
      
      const newLeft = Math.max(imageBounds.left, rect.left);
      const newTop = Math.max(imageBounds.top, rect.top);
      const newWidth = Math.min(rect.width, imageBounds.left + imageBounds.width - newLeft);
      const newHeight = Math.min(rect.height, imageBounds.top + imageBounds.height - newTop);
      
      rect.set({
        left: newLeft,
        top: newTop,
        width: newWidth,
        height: newHeight
      });
      canvas.renderAll();
    });
    
    // Add the crop overlay to canvas
    canvas.add(cropOverlayRect);
    canvas.setActiveObject(cropOverlayRect);
    setCropOverlay(cropOverlayRect);
    canvas.renderAll();
    
    console.log('Crop mode enabled - drag the orange rectangle to select crop area, then click Apply Crop');
    console.log('Image bounds:', imageBounds);
    console.log('Initial crop area:', { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight });
    
    // Add a visual indicator that crop mode is active
    const cropIndicator = new fabric.Text('CROP MODE - Drag orange rectangle to select area', {
      left: 10,
      top: 10,
      fontSize: 18,
      fill: '#ff6b35',
      fontWeight: 'bold',
      selectable: false,
      evented: false,
      name: 'crop-indicator',
      shadow: new fabric.Shadow({
        color: 'rgba(255,255,255,0.8)',
        blur: 3,
        offsetX: 1,
        offsetY: 1
      })
    });
    canvas.add(cropIndicator);
    
    // Add a semi-transparent overlay over the entire image to make crop area more obvious
    const imageOverlay = new fabric.Rect({
      left: imageBounds.left,
      top: imageBounds.top,
      width: imageBounds.width,
      height: imageBounds.height,
      fill: 'rgba(0, 0, 0, 0.3)',
      selectable: false,
      evented: false,
      name: 'crop-image-overlay'
    });
    canvas.add(imageOverlay);
    canvas.bringToBack(imageOverlay);
    
    canvas.renderAll();
  }, [selectedObject, canvas, cropMode]);

  const applyCrop = useCallback(async () => {
    if (!selectedObject || !cropMode || isCropping || !cropOverlay) {
      console.log('Cannot apply crop - invalid state');
      return;
    }
    
    setIsCropping(true);
    
    try {
      // Get the crop overlay bounds
      const cropBounds = cropOverlay.getBoundingRect();
      const imageBounds = selectedObject.getBoundingRect();
      
      console.log('=== CROP DEBUG START ===');
      console.log('Image bounds:', imageBounds);
      console.log('Crop bounds:', cropBounds);

      // Calculate the crop area relative to the image bounds
      const cropX = Math.max(0, cropBounds.left - imageBounds.left);
      const cropY = Math.max(0, cropBounds.top - imageBounds.top);
      const cropWidth = Math.min(cropBounds.width, imageBounds.width - cropX);
      const cropHeight = Math.min(cropBounds.height, imageBounds.height - cropY);

      console.log('Calculated crop area:', cropX, cropY, cropWidth, cropHeight);
      console.log('Crop area as percentage of image:', {
        x: (cropX / imageBounds.width * 100).toFixed(1) + '%',
        y: (cropY / imageBounds.height * 100).toFixed(1) + '%',
        width: (cropWidth / imageBounds.width * 100).toFixed(1) + '%',
        height: (cropHeight / imageBounds.height * 100).toFixed(1) + '%'
      });

      // Validate dimensions
      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error('Invalid crop dimensions');
      }

      // Check if crop area is meaningful (at least 10% of image)
      const cropAreaPercentage = (cropWidth * cropHeight) / (imageBounds.width * imageBounds.height);
      console.log('Crop area percentage:', (cropAreaPercentage * 100).toFixed(1) + '%');
      
      if (cropAreaPercentage < 0.1) {
        console.warn('Crop area is very small, proceeding anyway...');
      }

      // Export the image to get its data
      const imageDataURL = selectedObject.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });

      console.log('Image data URL created, length:', imageDataURL.length);

      // Create an image from the data URL
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      
      tempImg.onload = () => {
        console.log('Temporary image loaded, dimensions:', tempImg.width, 'x', tempImg.height);

        // Create a canvas for cropping
        const cropCanvas = document.createElement('canvas');
        const ctx = cropCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get crop canvas context');
        }

        // Set canvas size to the cropped dimensions
        cropCanvas.width = Math.max(1, Math.round(cropWidth));
        cropCanvas.height = Math.max(1, Math.round(cropHeight));

        console.log('Crop canvas dimensions set to:', cropCanvas.width, 'x', cropCanvas.height);

        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Calculate the source coordinates in the original image
        const scaleX = tempImg.width / imageBounds.width;
        const scaleY = tempImg.height / imageBounds.height;
        
        const sourceX = cropX * scaleX;
        const sourceY = cropY * scaleY;
        const sourceWidth = cropWidth * scaleX;
        const sourceHeight = cropHeight * scaleY;

        console.log('Scale factors:', scaleX, scaleY);
        console.log('Source crop area:', sourceX, sourceY, sourceWidth, sourceHeight);

        // Draw the cropped portion of the image
        ctx.drawImage(
          tempImg,
          sourceX, sourceY, sourceWidth, sourceHeight, // Source: cropped area
          0, 0, cropCanvas.width, cropCanvas.height    // Destination: full canvas
        );

        console.log('Image drawn to crop canvas');

        // Convert to data URL with high quality
        const croppedDataURL = cropCanvas.toDataURL('image/png', 1.0);
        
        console.log('Cropped data URL created, length:', croppedDataURL.length);
        
        // Create new image with cropped data
        const croppedImg = new Image();
        croppedImg.crossOrigin = 'anonymous';
        
        croppedImg.onload = () => {
          console.log('Cropped image loaded successfully');
          
          // Remove the original image and crop overlay FIRST
          canvas.remove(selectedObject);
          if (cropOverlay) {
            canvas.remove(cropOverlay);
          }
          
          // Remove crop indicator
          const cropIndicator = canvas.getObjects().find(obj => obj.name === 'crop-indicator');
          if (cropIndicator) {
            canvas.remove(cropIndicator);
          }
          
          // Remove image overlay
          const imageOverlay = canvas.getObjects().find(obj => obj.name === 'crop-image-overlay');
          if (imageOverlay) {
            canvas.remove(imageOverlay);
          }
          
          // Create new Fabric image with cropped data
          const croppedFabricImg = new fabric.Image(croppedImg, {
            left: cropBounds.left + cropBounds.width / 2, // Center the cropped image
            top: cropBounds.top + cropBounds.height / 2,  // Center the cropped image
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
            name: selectedObject.name + '-cropped',
            // Enhanced border styling - always visible
            stroke: '#0070f3',
            strokeWidth: 3,
            cornerColor: '#0070f3',
            cornerSize: 12,
            cornerStyle: 'circle',
            transparentCorners: false,
            borderColor: '#0070f3',
            borderScaleFactor: 2,
            borderOpacityWhenMoving: 0.8,
            // Make borders always visible
            hasBorders: true,
            hasControls: true,
            // Add a subtle background to make borders more visible
            backgroundColor: 'rgba(0, 112, 243, 0.1)'
          });

          // Add the cropped image
          canvas.add(croppedFabricImg);
          canvas.setActiveObject(croppedFabricImg);
          setSelectedObject(croppedFabricImg);
          setCropOverlay(null);
          canvas.renderAll();

          console.log('Image cropped successfully to dimensions:', cropCanvas.width, 'x', cropCanvas.height);
          console.log('=== CROP DEBUG END ===');
          setCropMode(false);
          setIsCropping(false);
          setCropRect(null);
        };

        croppedImg.onerror = (error) => {
          console.error('Error loading cropped image:', error);
          console.error('Data URL length:', croppedDataURL.length);
          
          // Fallback: Keep the original image and just exit crop mode
          console.log('Crop failed, keeping original image');
          setCropMode(false);
          setIsCropping(false);
          setCropRect(null);
          
          // Re-enable the original image
          selectedObject.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            stroke: '#0070f3',
            borderColor: '#0070f3',
            cornerColor: '#0070f3'
          });
          
          // Remove crop overlay
          if (cropOverlay) {
            canvas.remove(cropOverlay);
            setCropOverlay(null);
          }
          
          canvas.renderAll();
        };

        croppedImg.src = croppedDataURL;
      };

      tempImg.onerror = (error) => {
        console.error('Error loading temporary image:', error);
        setIsCropping(false);
        setCropMode(false);
        setCropRect(null);
      };

      tempImg.src = imageDataURL;

    } catch (error) {
      console.error('Error cropping image:', error);
      setIsCropping(false);
      setCropMode(false);
      setCropRect(null);
    }
  }, [selectedObject, canvas, cropMode, isCropping, cropOverlay]);

  const cancelCrop = useCallback(() => {
    if (selectedObject && cropMode) {
      // Re-enable the original image
      selectedObject.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        stroke: '#0070f3',
        borderColor: '#0070f3',
        cornerColor: '#0070f3'
      });
      
      // Remove crop overlay if it exists
      if (cropOverlay) {
        canvas.remove(cropOverlay);
        setCropOverlay(null);
      }
      
      // Remove crop indicator
      const cropIndicator = canvas.getObjects().find(obj => obj.name === 'crop-indicator');
      if (cropIndicator) {
        canvas.remove(cropIndicator);
      }
      
      // Remove image overlay
      const imageOverlay = canvas.getObjects().find(obj => obj.name === 'crop-image-overlay');
      if (imageOverlay) {
        canvas.remove(imageOverlay);
      }
      
      canvas.renderAll();
    }
    
    setCropMode(false);
    setIsCropping(false);
    setCropRect(null);
    console.log('Crop mode cancelled');
  }, [selectedObject, canvas, cropMode, cropOverlay]);

  // Export preview (small PNG)
  const exportPreview = useCallback(async (): Promise<string> => {
    if (!canvas) throw new Error('Canvas not initialized');

    return new Promise((resolve) => {
      canvas.setDimensions({
        width: CANVAS_WIDTH * PREVIEW_SCALE,
        height: CANVAS_HEIGHT * PREVIEW_SCALE,
      });

      canvas.renderAll();
      
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1,
      });

      resolve(dataURL);
    });
  }, [canvas]);

  // Export print file (full resolution PNG @ 300 DPI)
  const exportPrintFile = useCallback(async (): Promise<string> => {
    if (!canvas) throw new Error('Canvas not initialized');

    return new Promise((resolve) => {
      // Temporarily set to full resolution
      canvas.setDimensions({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });

      canvas.renderAll();
      
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 1,
      });

      // Reset to preview scale
      canvas.setDimensions({
        width: CANVAS_WIDTH * PREVIEW_SCALE,
        height: CANVAS_HEIGHT * PREVIEW_SCALE,
      });

      canvas.renderAll();
      resolve(dataURL);
    });
  }, [canvas]);

  // Preview design
  const previewDesign = useCallback(async () => {
    if (!canvas) return;

    try {
      const previewDataUrl = await exportPreview();
      // Open preview in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Design Preview</title></head>
            <body style="margin:0; padding:20px; text-align:center; background:#f5f5f5;">
              <h2>Design Preview</h2>
              <img src="${previewDataUrl}" style="max-width:100%; border:1px solid #ddd; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  }, [canvas, exportPreview]);

  // Download print file
  const downloadPrintFile = useCallback(async () => {
    if (!canvas) return;

    try {
      const printDataUrl = await exportPrintFile();
      const link = document.createElement('a');
      link.download = `design-${Date.now()}.png`;
      link.href = printDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [canvas, exportPrintFile]);

  // Upload files to Supabase
  const uploadToSupabase = useCallback(async (previewDataUrl: string, printDataUrl: string): Promise<DesignData> => {
    try {
      // Convert data URLs to blobs
      const previewBlob = await fetch(previewDataUrl).then(r => r.blob());
      const printBlob = await fetch(printDataUrl).then(r => r.blob());

      // Get signed URLs from API
      const response = await fetch('/api/sign-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: 'png',
          fileSize: printBlob.size,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get signed URLs');
      }

      const { previewUrl, printUrl } = await response.json();

      // Upload files
      await fetch(previewUrl, {
        method: 'PUT',
        body: previewBlob,
        headers: {
          'Content-Type': 'image/png',
        },
      });

      await fetch(printUrl, {
        method: 'PUT',
        body: printBlob,
        headers: {
          'Content-Type': 'image/png',
        },
      });

      const design_id = uuidv4();
      
      return {
        design_id,
        preview_url: previewUrl.split('?')[0], // Remove query params
        print_url: printUrl.split('?')[0],
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }, []);

  // Save design and prepare for cart
  const saveDesign = useCallback(async () => {
    if (!canvas) return;

    setIsLoading(true);
    try {
      const previewDataUrl = await exportPreview();
      const printDataUrl = await exportPrintFile();
      
      const designData = await uploadToSupabase(previewDataUrl, printDataUrl);
      setDesignData(designData);
      
      // Dispatch event for cart integration
      window.dispatchEvent(new CustomEvent('designSaved', {
        detail: {
          design_id: designData.design_id,
          preview_url: designData.preview_url,
          print_url: designData.print_url,
          notes,
          productId,
          variantId,
        },
      }));
    } catch (error) {
      console.error('Failed to save design:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canvas, exportPreview, exportPrintFile, uploadToSupabase, notes, productId, variantId]);

  // Font options
  const fontOptions = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Courier New', value: 'Courier New' },
  ];

  return (
    <div className="customizer-container">
      {/* Simple Test Section */}
      <div style={{ padding: '20px', background: 'lightblue', margin: '10px' }}>
        <Text variant="headingMd" as="h2">Customizer Component Loaded!</Text>
        <Text variant="bodyMd" as="p">Canvas State: {canvas ? 'Initialized' : 'Not Initialized'}</Text>
        <Text variant="bodyMd" as="p">Client State: {isClient ? 'Client Side' : 'Server Side'}</Text>
        <Text variant="bodyMd" as="p">Current View: {currentView}</Text>
        
        <Button onClick={() => {
          console.log('Simple test button clicked');
          alert('Button clicked! Canvas: ' + (canvas ? 'Yes' : 'No'));
        }} size="large">
          Simple Test Button
        </Button>
      </div>

      {/* Product Selector */}
      <div className="product-selector">
        <Text variant="bodyMd" as="span">Product:</Text>
        <Select
          options={productOptions}
          value={selectedProduct}
          onChange={setSelectedProduct}
        />
        <Button onClick={() => {
          console.log('Test button clicked, canvas:', canvas, 'currentView:', currentView);
          if (canvas) {
            loadTShirtBackground(currentView);
          } else {
            console.error('Canvas not initialized yet');
          }
        }} size="slim">
          Test Load Background
        </Button>
        <Button onClick={() => {
          console.log('Test canvas button clicked, canvas:', canvas);
          if (canvas) {
            const testRect = new fabric.Rect({
              left: 100,
              top: 100,
              width: 100,
              height: 100,
              fill: 'red',
              selectable: true,
              evented: true
            });
            canvas.add(testRect);
            canvas.renderAll();
            console.log('Test rectangle added to canvas');
          } else {
            console.error('Canvas not available for test');
          }
        }} size="slim">
          Test Canvas
        </Button>
      </div>

      {/* View Selector - Only render on client to avoid hydration issues */}
      {isClient && (
        <div className="view-selector">
          <Text variant="bodyMd" as="span">View:</Text>
          <PolarisButtonGroup>
            <Button 
              pressed={currentView === 'front'} 
              onClick={() => setCurrentView('front')}
              size="slim"
            >
              Front
            </Button>
            <Button 
              pressed={currentView === 'back'} 
              onClick={() => setCurrentView('back')}
              size="slim"
            >
              Back
            </Button>
          </PolarisButtonGroup>
        </div>
      )}

      {/* Main Canvas Area - Only render on client to avoid hydration issues */}
      {isClient && (
        <div className="canvas-section">
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className="design-canvas"
            />
          </div>
          <div className="printable-area-info">
            <Text variant="bodySm" as="p">Printable Area: 12" x 14"</Text>
            <Text variant="bodySm" as="p" color="subdued">Click and drag to position your design</Text>
          </div>
        </div>
      )}

      {/* Control Panels */}
      <div className="control-panels">
        {/* Upload Images Card */}
        <Card>
          <div className="control-card">
            <Text variant="headingSm" as="h3">Upload Images</Text>
            <div {...getRootProps()} className="upload-button">
              <input {...getInputProps()} />
              <Button size="large" icon="folder">
                Upload Image
              </Button>
            </div>
            <Text variant="bodySm" as="p" color="subdued">
              PNG, JPG, SVG up to 30MB
            </Text>
            <Text variant="bodySm" as="p" color="subdued">
              Images: {imageCount}/{MAX_IMAGES}
            </Text>
          </div>
        </Card>

        {/* Add Text Card */}
        <Card>
          <div className="control-card">
            <Text variant="headingSm" as="h3">Add Text</Text>
            <BlockStack gap="300">
              <TextField
                value={textValue}
                onChange={setTextValue}
                placeholder="Enter your text..."
                autoComplete="off"
              />
              <InlineStack gap="200">
                <Select
                  options={fontOptions}
                  value={fontFamily}
                  onChange={setFontFamily}
                />
                <TextField
                  type="number"
                  value={fontSize.toString()}
                  onChange={(value) => setFontSize(parseInt(value) || 24)}
                  min={8}
                  max={200}
                  suffix="px"
                />
                <div className="color-picker">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                  />
                </div>
              </InlineStack>
              <Button 
                onClick={addText} 
                disabled={!textValue.trim()}
                icon="pencil"
                size="large"
              >
                Add Text
              </Button>
            </BlockStack>
          </div>
        </Card>

        {/* Object Controls Card */}
        <Card>
          <div className="control-card">
            <Text variant="headingSm" as="h3">Object Controls</Text>
            <BlockStack gap="200">
              <Button 
                onClick={bringToFront} 
                disabled={!selectedObject}
                icon="arrowUp"
                size="large"
              >
                Bring to Front
              </Button>
              <Button 
                onClick={sendToBack} 
                disabled={!selectedObject}
                icon="arrowDown"
                size="large"
              >
                Send to Back
              </Button>
              <Button 
                onClick={deleteSelectedObject}
                disabled={!selectedObject}
                icon="delete"
                size="large"
              >
                Delete Selected
              </Button>
              <Button 
                onClick={enhanceImageQuality}
                disabled={!selectedObject || selectedObject?.type !== 'image' || isEnhancingQuality}
                icon="refresh"
                size="large"
                loading={isEnhancingQuality}
              >
                {isEnhancingQuality ? 'Enhancing...' : 'Enhance to 300 DPI'}
              </Button>
              {!cropMode ? (
                <Button 
                  onClick={startCropMode}
                  disabled={!selectedObject || selectedObject?.type !== 'image'}
                  icon="crop"
                  size="large"
                >
                  Crop Image
                </Button>
              ) : (
                <BlockStack gap="100">
                  <Button 
                    onClick={applyCrop}
                    disabled={isCropping}
                    icon="checkmark"
                    size="large"
                    loading={isCropping}
                  >
                    {isCropping ? 'Applying...' : 'Apply Crop'}
                  </Button>
                  <Button 
                    onClick={cancelCrop}
                    disabled={isCropping}
                    icon="cancel"
                    size="large"
                  >
                    Cancel
                  </Button>
                </BlockStack>
              )}
              <Button 
                onClick={clearCanvas}
                icon="checkmark"
                size="large"
              >
                Clear All
              </Button>
            </BlockStack>
          </div>
        </Card>

        {/* Export & Save Card */}
        <Card>
          <div className="control-card">
            <Text variant="headingSm" as="h3">Export & Save</Text>
            <BlockStack gap="200">
              <Button 
                onClick={previewDesign}
                icon="view"
                size="large"
              >
                Preview
              </Button>
              <Button 
                onClick={downloadPrintFile}
                icon="print"
                size="large"
              >
                Print File
              </Button>
              <Button 
                onClick={saveDesign}
                disabled={isLoading}
                primary
                icon="save"
                size="large"
              >
                {isLoading ? <Spinner size="small" /> : 'Save Design'}
              </Button>
            </BlockStack>
          </div>
        </Card>
      </div>

      {/* Design Data Display */}
      {designData && (
        <Card>
          <div className="design-data">
            <Badge status="success">Design Saved!</Badge>
            <Text variant="bodySm" as="p">
              Design ID: {designData.design_id}
            </Text>
            <Text variant="bodySm" as="p">
              Preview: <a href={designData.preview_url} target="_blank" rel="noopener noreferrer">View</a>
            </Text>
            <Text variant="bodySm" as="p">
              Print File: <a href={designData.print_url} target="_blank" rel="noopener noreferrer">Download</a>
            </Text>
          </div>
        </Card>
      )}

      {/* Image Limit Modal */}
      <Modal
        open={showImageLimitModal}
        onClose={handleCancelImageUpload}
        title="Image Limit Reached"
        primaryAction={{
          content: 'Replace All Images',
          onAction: handleReplaceImage,
        }}
        secondaryActions={[
          {
            content: 'Add Another Image',
            onAction: handleAddAnotherImage,
            disabled: imageCount >= MAX_IMAGES,
          },
          {
            content: 'Cancel',
            onAction: handleCancelImageUpload,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="500">
            <Text variant="bodyMd" as="p">
              You've reached the maximum limit of {MAX_IMAGES} images on the front of the t-shirt.
            </Text>
            <Text variant="bodyMd" as="p">
              What would you like to do?
            </Text>
            <BlockStack gap="200">
              <Text variant="bodyMd" as="p">
                • <strong>Replace All Images:</strong> Remove all current images and add the new one
              </Text>
              <Text variant="bodyMd" as="p">
                • <strong>Add Another Image:</strong> Add the new image alongside existing ones (if under limit)
              </Text>
              <Text variant="bodyMd" as="p">
                • <strong>Cancel:</strong> Keep your current design unchanged
              </Text>
            </BlockStack>
            {imageCount >= MAX_IMAGES && (
              <Text variant="bodySm" as="p" color="critical">
                Note: You cannot add more than {MAX_IMAGES} images. Choose "Replace All Images" to add this new image.
              </Text>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .customizer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .product-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .view-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .canvas-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .canvas-container {
          display: flex;
          justify-content: center;
          margin-bottom: 15px;
        }

        .design-canvas {
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          cursor: crosshair;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .printable-area-info {
          text-align: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e1e1e1;
        }

        .control-panels {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .control-card {
          padding: 20px;
        }

        .control-card h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .upload-button {
          margin-bottom: 10px;
        }

        .color-picker input[type="color"] {
          width: 40px;
          height: 40px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .design-data {
          padding: 20px;
          background: #f0f8f0;
          border-radius: 8px;
          border: 1px solid #d0e8d0;
        }

        .design-data p {
          margin: 5px 0;
        }

        .design-data a {
          color: #008060;
          text-decoration: none;
        }

        .design-data a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .control-panels {
            grid-template-columns: 1fr;
          }
          
          .customizer-container {
            padding: 10px;
          }
        }
        `
      }} />
    </div>
  );
};

export default Customizer;



