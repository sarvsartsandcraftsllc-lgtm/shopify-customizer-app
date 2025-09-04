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

  // Canvas dimensions (12x14 inches @ 300 DPI)
  const CANVAS_WIDTH = 3600; // 12 inches * 300 DPI
  const CANVAS_HEIGHT = 4200; // 14 inches * 300 DPI
  const PREVIEW_SCALE = 0.25; // Scale for preview
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
    
    fabric.Image.fromURL(imageUrl, (img) => {
      if (!canvas) return;

      console.log('T-shirt image loaded successfully');

      // Scale image to fit canvas
      const scale = Math.min(
        CANVAS_WIDTH / img.width!,
        CANVAS_HEIGHT / img.height!,
        1
      );

      img.scale(scale);
      img.set({
        left: (CANVAS_WIDTH - img.width! * scale) / 2,
        top: (CANVAS_HEIGHT - img.height! * scale) / 2,
        selectable: false,
        evented: false,
        name: 'tshirt-background'
      });

      // Remove existing t-shirt background
      const existingBackground = canvas.getObjects().find(obj => obj.name === 'tshirt-background');
      if (existingBackground) {
        canvas.remove(existingBackground);
      }

      // Add new background
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  }, [canvas]);

  // Initialize fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectBlockStacking: true,
      });

      // Set canvas properties
      fabricCanvas.setDimensions({
        width: CANVAS_WIDTH * PREVIEW_SCALE,
        height: CANVAS_HEIGHT * PREVIEW_SCALE,
      });

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

      // Load initial t-shirt background after canvas is ready
      setTimeout(() => {
        loadTShirtBackground('front');
      }, 100);
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Load t-shirt background when view changes
  useEffect(() => {
    if (canvas && isClient) {
      loadTShirtBackground(currentView);
    }
  }, [canvas, currentView, isClient, loadTShirtBackground]);

  // Count images on canvas (excluding t-shirt background)
  const countImages = useCallback(() => {
    if (!canvas) return 0;
    return canvas.getObjects().filter(obj => 
      obj.type === 'image' && obj.name !== 'tshirt-background'
    ).length;
  }, [canvas]);

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

    const reader = new FileReader();

    reader.onload = (e) => {
      fabric.Image.fromURL(e.target?.result as string, (img) => {
        // Scale image to fit within printable area
        const scale = Math.min(
          CANVAS_WIDTH / img.width!,
          CANVAS_HEIGHT / img.height!,
          1
        );

        img.scale(scale);
        img.set({
          left: (CANVAS_WIDTH - img.width! * scale) / 2,
          top: (CANVAS_HEIGHT - img.height! * scale) / 2,
          selectable: true,
          evented: true,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        setSelectedObject(img);
      });
    };

    reader.readAsDataURL(file);
  }, [canvas]);

  // Handle modal actions
  const handleReplaceImage = useCallback(() => {
    if (!canvas || !pendingImageFile) return;

    // Remove all existing user images (excluding t-shirt background)
    const images = canvas.getObjects().filter(obj => 
      obj.type === 'image' && obj.name !== 'tshirt-background'
    );
    images.forEach(img => canvas.remove(img));

    // Add the new image
    addImageToCanvas(pendingImageFile);

    setShowImageLimitModal(false);
    setPendingImageFile(null);
  }, [canvas, pendingImageFile, addImageToCanvas]);

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

    // Get all objects except background and printable area
    const objectsToRemove = canvas.getObjects().filter(obj => 
      obj.name !== 'tshirt-background' && obj.name !== 'printable-area'
    );
    
    objectsToRemove.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    setSelectedObject(null);
  }, [canvas]);

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
      {/* Product Selector */}
      <div className="product-selector">
        <Text variant="bodyMd" as="span">Product:</Text>
        <Select
          options={productOptions}
          value={selectedProduct}
          onChange={setSelectedProduct}
        />
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



