import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { Button, TextField, Select, Stack, Card, Text, Badge, Spinner } from '@shopify/polaris';

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

  // Canvas dimensions (12x14 inches @ 300 DPI)
  const CANVAS_WIDTH = 3600; // 12 inches * 300 DPI
  const CANVAS_HEIGHT = 4200; // 14 inches * 300 DPI
  const PREVIEW_SCALE = 0.25; // Scale for preview

  // Initialize fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
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
      });
      fabricCanvas.add(printableArea);
      fabricCanvas.renderAll();
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Handle image upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!canvas || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
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

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    
    // Re-add printable area indicator
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
    });
    canvas.add(printableArea);
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
      <Card>
        <div style={{ padding: '20px' }}>
          <Stack vertical spacing="loose">
            {/* Header */}
            <div>
              <Text variant="headingMd" as="h2">
                Customize {productTitle}
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                Design your print-on-demand product
              </Text>
            </div>

            {/* Canvas Container */}
            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'crosshair',
                }}
              />
            </div>

            {/* Controls */}
            <div className="controls-section">
              <Stack vertical spacing="tight">
                {/* Image Upload */}
                <div {...getRootProps()} className="dropzone">
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <Text variant="bodyMd">Drop images here...</Text>
                  ) : (
                    <Text variant="bodyMd">Drag & drop images here, or click to select</Text>
                  )}
                </div>

                {/* Text Controls */}
                <div className="text-controls">
                  <Stack distribution="fillEvenly" spacing="tight">
                    <TextField
                      label="Text"
                      value={textValue}
                      onChange={setTextValue}
                      placeholder="Enter text..."
                    />
                    <Select
                      label="Font"
                      options={fontOptions}
                      value={fontFamily}
                      onChange={setFontFamily}
                    />
                    <TextField
                      label="Size"
                      type="number"
                      value={fontSize.toString()}
                      onChange={(value) => setFontSize(parseInt(value) || 24)}
                      min={8}
                      max={200}
                    />
                    <div>
                      <label>Color</label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{ width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <Button onClick={addText} disabled={!textValue.trim()}>
                      Add Text
                    </Button>
                  </Stack>
                </div>

                {/* Object Controls */}
                {selectedObject && (
                  <div className="object-controls">
                    <Stack distribution="fillEvenly" spacing="tight">
                      <Button onClick={deleteSelectedObject} destructive>
                        Delete Selected
                      </Button>
                      <Button onClick={clearCanvas}>
                        Clear All
                      </Button>
                    </Stack>
                  </div>
                )}

                {/* Notes */}
                <TextField
                  label="Design Notes"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Add any special instructions or notes..."
                  multiline={3}
                />

                {/* Save Design */}
                <Button
                  onClick={saveDesign}
                  disabled={isLoading}
                  primary
                  fullWidth
                >
                  {isLoading ? <Spinner size="small" /> : 'Save Design & Add to Cart'}
                </Button>

                {/* Design Data Display */}
                {designData && (
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
                )}
              </Stack>
            </div>
          </Stack>
        </div>
      </Card>

      <style jsx>{`
        .customizer-container {
          max-width: 100%;
          margin: 0 auto;
        }

        .canvas-container {
          display: flex;
          justify-content: center;
          margin: 20px 0;
          overflow: auto;
        }

        .controls-section {
          margin-top: 20px;
        }

        .dropzone {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.3s ease;
        }

        .dropzone:hover {
          border-color: #008060;
        }

        .text-controls {
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .object-controls {
          padding: 20px;
          background: #f0f0f0;
          border-radius: 8px;
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
      `}</style>
    </div>
  );
};

export default Customizer;



