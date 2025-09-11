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

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 1000;
  const PREVIEW_SCALE = 0.5;
  const MAX_IMAGES = 2;

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    console.log('Canvas initialization effect running, isClient:', isClient);
    console.log('canvasRef.current:', canvasRef.current);
    console.log('fabricCanvasRef.current:', fabricCanvasRef.current);

    if (fabricCanvasRef.current) {
      console.log('Canvas already initialized, skipping...');
      return;
    }

    console.log('Creating new fabric canvas...');
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff'
    });

    console.log('Fabric canvas created:', fabricCanvas);
    fabricCanvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    // Add printable area indicator
    const printableArea = new fabric.Rect({
      left: 50,
      top: 50,
      width: CANVAS_WIDTH - 100,
      height: CANVAS_HEIGHT - 100,
      fill: 'transparent',
      stroke: '#cccccc',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      name: 'printable-area'
    });

    fabricCanvas.add(printableArea);
    console.log('Canvas dimensions set');
    console.log('Canvas state set, canvas:', fabricCanvas);
    console.log('Printable area added and canvas rendered');

    // Load t-shirt background
    loadTShirtBackground(fabricCanvas);

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isClient]);

  // Load t-shirt background
  const loadTShirtBackground = useCallback(async (canvas: fabric.Canvas) => {
    try {
      console.log('Loading t-shirt background:', currentView === 'front' ? '/Front White Tshirt.png' : '/Back White Tshirt.png');
      
      const imageUrl = currentView === 'front' ? '/Front White Tshirt.png' : '/Back White Tshirt.png';
      
      // Load image directly with Fabric.js
      console.log('Loading image directly with Fabric.js...');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('=== IMAGE LOADED SUCCESSFULLY ===');
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        
        // Calculate scaling to fit canvas
        const scaleX = CANVAS_WIDTH / img.width;
        const scaleY = CANVAS_HEIGHT / img.height;
        const scale = Math.min(scaleX, scaleY) * 0.8; // 80% of canvas size
        
        console.log('Scaling image by factor:', scale);
        console.log('About to add image to canvas...');
        
        const fabricImg = new fabric.Image(img, {
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          name: 't-shirt-background'
        });
        
        canvas.add(fabricImg);
        canvas.renderAll();
        console.log('Loading initial t-shirt background...');
      };
      
      img.onerror = (error) => {
        console.error('Error loading t-shirt image:', error);
      };
      
      img.src = imageUrl;
      
    } catch (error) {
      console.error('Error loading t-shirt background:', error);
    }
  }, [currentView]);

  // Simple crop functionality
  const startCropMode = useCallback(() => {
    if (!selectedObject || selectedObject.type !== 'image') {
      console.log('No image selected for cropping');
      return;
    }
    
    if (cropMode) {
      console.log('Already in crop mode');
      return;
    }
    
    console.log('Starting crop mode...');
    setCropMode(true);
    setIsCropping(false);
    
    // Disable the image object during crop mode
    selectedObject.set({
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false
    });
    
    // Get image bounds
    const imageBounds = selectedObject.getBoundingRect();
    console.log('Image bounds:', imageBounds);
    
    // Create a simple crop rectangle that covers most of the image
    const cropWidth = imageBounds.width * 0.8;
    const cropHeight = imageBounds.height * 0.8;
    const cropLeft = imageBounds.left + (imageBounds.width - cropWidth) / 2;
    const cropTop = imageBounds.top + (imageBounds.height - cropHeight) / 2;
    
    console.log('Crop rectangle:', { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight });
    
    const cropRect = new fabric.Rect({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
      fill: 'rgba(255, 0, 0, 0.2)',
      stroke: 'red',
      strokeWidth: 3,
      cornerColor: 'red',
      cornerSize: 10,
      cornerStyle: 'circle',
      transparentCorners: false,
      selectable: true,
      evented: true,
      name: 'crop-overlay'
    });
    
    // Simple constraint: keep crop rectangle within image bounds
    cropRect.on('moving', function(e) {
      if (!e || !e.target) return;
      
      const rect = e.target;
      const rectWidth = rect.width * (rect.scaleX || 1);
      const rectHeight = rect.height * (rect.scaleY || 1);
      
      // Keep within image bounds
      const newLeft = Math.max(imageBounds.left, Math.min(rect.left, imageBounds.left + imageBounds.width - rectWidth));
      const newTop = Math.max(imageBounds.top, Math.min(rect.top, imageBounds.top + imageBounds.height - rectHeight));
      
      if (rect.left !== newLeft || rect.top !== newTop) {
        rect.set({ left: newLeft, top: newTop });
        canvas.renderAll();
      }
    });
    
    // Add to canvas
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    setCropOverlay(cropRect);
    
    // Add instruction text
    const instructionText = new fabric.Text('Drag the red rectangle to select crop area', {
      left: cropLeft + cropWidth / 2,
      top: cropTop - 40,
      originX: 'center',
      originY: 'center',
      fontSize: 14,
      fill: 'red',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      name: 'crop-instruction'
    });
    canvas.add(instructionText);
    
    canvas.renderAll();
    console.log('Crop mode enabled');
  }, [selectedObject, canvas, cropMode]);

  // Simple apply crop
  const applyCrop = useCallback(async () => {
    if (!selectedObject || !cropMode || isCropping || !cropOverlay) {
      console.log('Cannot apply crop - invalid state');
      return;
    }
    
    console.log('Applying crop...');
    setIsCropping(true);
    
    try {
      // Get bounds
      const cropBounds = cropOverlay.getBoundingRect();
      const imageBounds = selectedObject.getBoundingRect();
      
      console.log('Crop bounds:', cropBounds);
      console.log('Image bounds:', imageBounds);
      
      // Calculate crop area
      const cropX = Math.max(0, cropBounds.left - imageBounds.left);
      const cropY = Math.max(0, cropBounds.top - imageBounds.top);
      const cropWidth = Math.min(cropBounds.width, imageBounds.width - cropX);
      const cropHeight = Math.min(cropBounds.height, imageBounds.height - cropY);
      
      console.log('Crop area:', { cropX, cropY, cropWidth, cropHeight });
      
      // Export image
      const imageDataURL = selectedObject.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      // Create temporary image
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      
      tempImg.onload = () => {
        // Create crop canvas
        const cropCanvas = document.createElement('canvas');
        const ctx = cropCanvas.getContext('2d');
        if (!ctx) return;
        
        cropCanvas.width = Math.max(1, Math.round(cropWidth));
        cropCanvas.height = Math.max(1, Math.round(cropHeight));
        
        // Calculate source coordinates
        const scaleX = tempImg.width / imageBounds.width;
        const scaleY = tempImg.height / imageBounds.height;
        
        const sourceX = cropX * scaleX;
        const sourceY = cropY * scaleY;
        const sourceWidth = cropWidth * scaleX;
        const sourceHeight = cropHeight * scaleY;
        
        // Draw cropped image
        ctx.drawImage(
          tempImg,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, cropCanvas.width, cropCanvas.height
        );
        
        // Create new image
        const croppedDataURL = cropCanvas.toDataURL('image/png', 1.0);
        const croppedImg = new Image();
        croppedImg.crossOrigin = 'anonymous';
        
        croppedImg.onload = () => {
          // Remove old objects
          canvas.remove(selectedObject);
          canvas.remove(cropOverlay);
          
          // Remove instruction text
          const instructionText = canvas.getObjects().find(obj => obj.name === 'crop-instruction');
          if (instructionText) {
            canvas.remove(instructionText);
          }
          
          // Create new cropped image
          const croppedFabricImg = new fabric.Image(croppedImg, {
            left: cropBounds.left + cropBounds.width / 2,
            top: cropBounds.top + cropBounds.height / 2,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
            name: selectedObject.name + '-cropped',
            stroke: '#0070f3',
            strokeWidth: 3,
            cornerColor: '#0070f3',
            cornerSize: 12,
            cornerStyle: 'circle',
            transparentCorners: false,
            hasBorders: true,
            hasControls: true,
            backgroundColor: 'rgba(0, 112, 243, 0.1)'
          });
          
          // Add to canvas
          canvas.add(croppedFabricImg);
          canvas.setActiveObject(croppedFabricImg);
          setSelectedObject(croppedFabricImg);
          
          // Reset state
          setCropOverlay(null);
          setCropMode(false);
          setIsCropping(false);
          setCropRect(null);
          
          canvas.renderAll();
          console.log('Crop applied successfully');
        };
        
        croppedImg.src = croppedDataURL;
      };
      
      tempImg.src = imageDataURL;
      
    } catch (error) {
      console.error('Error applying crop:', error);
      setIsCropping(false);
    }
  }, [selectedObject, canvas, cropMode, isCropping, cropOverlay]);

  // Cancel crop
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
      
      // Remove crop overlay
      if (cropOverlay) {
        canvas.remove(cropOverlay);
        setCropOverlay(null);
      }
      
      // Remove instruction text
      const instructionText = canvas.getObjects().find(obj => obj.name === 'crop-instruction');
      if (instructionText) {
        canvas.remove(instructionText);
      }
      
      canvas.renderAll();
    }
    
    setCropMode(false);
    setIsCropping(false);
    setCropRect(null);
    console.log('Crop mode cancelled');
  }, [selectedObject, canvas, cropMode, cropOverlay]);

  // Handle object selection
  const handleObjectSelection = useCallback((e: fabric.IEvent) => {
    if (e.selected && e.selected.length > 0) {
      const selectedObj = e.selected[0];
      setSelectedObject(selectedObj);
      console.log('Object selected:', selectedObj);
    } else {
      setSelectedObject(null);
    }
  }, []);

  // Add selection event listener
  useEffect(() => {
    if (canvas) {
      canvas.on('selection:created', handleObjectSelection);
      canvas.on('selection:updated', handleObjectSelection);
      canvas.on('selection:cleared', handleObjectSelection);
    }
  }, [canvas, handleObjectSelection]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Customizer</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <canvas
          ref={canvasRef}
          style={{ border: '1px solid #ccc', marginBottom: '10px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <Button
          onClick={startCropMode}
          disabled={!selectedObject || selectedObject.type !== 'image' || cropMode}
        >
          {cropMode ? 'Crop Mode Active' : 'Crop Image'}
        </Button>
        
        {cropMode && (
          <>
            <Button
              onClick={applyCrop}
              disabled={isCropping}
              primary
            >
              {isCropping ? 'Cropping...' : 'Apply Crop'}
            </Button>
            
            <Button
              onClick={cancelCrop}
            >
              Cancel Crop
            </Button>
          </>
        )}
      </div>
      
      <div>
        <p>Selected Object: {selectedObject ? selectedObject.type : 'None'}</p>
        <p>Crop Mode: {cropMode ? 'Active' : 'Inactive'}</p>
        <p>Is Cropping: {isCropping ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default Customizer;










