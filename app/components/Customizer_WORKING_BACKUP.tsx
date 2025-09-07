import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as fabric from "fabric";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1000;

const FONT_FAMILIES = ["Arial", "Times New Roman", "Courier New", "Impact", "Verdana", "Georgia"];

const Customizer: React.FC<{ productTitle?: string }> = ({ productTitle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [currentView, setCurrentView] = useState<"front" | "back">("front");

  const [cropOverlay, setCropOverlay] = useState<fabric.Rect | null>(null);
  const [cropMode, setCropMode] = useState(false);

  // -----------------
  // Initialize canvas
  // -----------------
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });
    fabricCanvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    loadTShirtBackground(fabricCanvas, "front");

    // Event listeners
    fabricCanvas.on("selection:created", (e) => {
      if (e.selected?.[0]) setSelectedObject(e.selected[0]);
    });
    fabricCanvas.on("selection:updated", (e) => {
      if (e.selected?.[0]) setSelectedObject(e.selected[0]);
    });
    fabricCanvas.on("selection:cleared", () => setSelectedObject(null));

    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // -----------------
  // Load T-shirt Background
  // -----------------
  const loadTShirtBackground = useCallback((fabricCanvas: fabric.Canvas, side: "front" | "back") => {
    const path = side === "front" ? "/Front White Tshirt.png" : "/Back White Tshirt.png";

    console.log("👕 Trying to load background image:", path);

    // Test if image exists first
    const testImg = new Image();
    testImg.onload = () => {
      console.log("✅ Image file exists and is accessible:", path);
    };
    testImg.onerror = () => {
      console.error("❌ Image file not found or not accessible:", path);
    };
    testImg.src = path;

    // remove existing
    const existing = fabricCanvas.getObjects().find((o) => (o as any).name === "tshirt-background");
    if (existing) {
      console.log("🧹 Removing old background");
      fabricCanvas.remove(existing);
    }

    // Use a more reliable approach with direct Image loading
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      console.log("🔄 Image loaded, creating Fabric object:", path);
      const fabricImg = new fabric.Image(img, {
        left: CANVAS_WIDTH / 2,
        top: CANVAS_HEIGHT / 2,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
        name: "tshirt-background",
      });
      
      console.log("✅ Fabric image created:", path, "Dimensions:", fabricImg.width, "x", fabricImg.height);
      
      fabricImg.scaleToWidth(CANVAS_WIDTH);
      fabricCanvas.add(fabricImg);
      fabricCanvas.renderAll();
      console.log("🎨 Background image added to canvas");
    };
    img.onerror = (error) => {
      console.error("❌ Image load error:", error);
    };
    img.src = path;
  }, []);

  // -----------------
  // Upload Images
  // -----------------
  const onDrop = useCallback(
    (files: File[]) => {
      if (!canvas || files.length === 0) return;
      const file = files[0];
      console.log("📁 File selected for upload:", file.name, file.type);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        console.log("📖 File read successfully, creating image...");
        
        // Use the same reliable approach as background image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          console.log("🖼️ Image loaded, creating Fabric object");
          // Scale image to fit within t-shirt area (about 40% of canvas for better sizing)
          const maxWidth = CANVAS_WIDTH * 0.4;
          const maxHeight = CANVAS_HEIGHT * 0.4;
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
          
          const fabricImg = new fabric.Image(img, {
            left: CANVAS_WIDTH / 2,
            top: CANVAS_HEIGHT / 2,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            name: `uploaded-${currentView}-${Date.now()}`,
          });
          
          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          setSelectedObject(fabricImg);
          canvas.renderAll();
          console.log("✅ Uploaded image added to canvas");
        };
        img.onerror = (error) => {
          console.error("❌ Error loading uploaded image:", error);
        };
        img.src = url;
      };
      reader.onerror = (error) => {
        console.error("❌ Error reading file:", error);
      };
      reader.readAsDataURL(file);
    },
    [canvas, currentView]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    multiple: false,
  });

  // -----------------
  // Crop Functions
  // -----------------
  const startCropMode = () => {
    if (!canvas || !selectedObject || selectedObject.type !== "image") return;
    if (cropMode) return;

    const bounds = selectedObject.getBoundingRect();
    const rect = new fabric.Rect({
      left: bounds.left + bounds.width * 0.25,
      top: bounds.top + bounds.height * 0.25,
      width: bounds.width * 0.5,
      height: bounds.height * 0.5,
      fill: "rgba(0,0,0,0.1)",
      stroke: "#ff6b35",
      strokeWidth: 2,
      hasBorders: true,
      hasControls: true,
      cornerColor: "#ff6b35",
      cornerSize: 10,
      cornerStyle: "circle",
      transparentCorners: false,
      selectable: true,
      evented: true,
      name: "crop-overlay",
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setCropOverlay(rect);
    setCropMode(true);
    canvas.renderAll();
    console.log("✂️ Crop mode enabled - drag the orange rectangle to select crop area");
  };

  const applyCrop = () => {
    if (!canvas || !cropOverlay) return;
    
    // Find the original image object (not the crop overlay)
    const imgObj = canvas.getObjects().find(obj => 
      obj.type === 'image' && 
      obj.name && 
      obj.name.startsWith('uploaded-') && 
      obj !== cropOverlay
    ) as fabric.Image;
    
    if (!imgObj) {
      console.error("❌ Could not find original image to crop");
      return;
    }

    console.log("✂️ Applying crop to image:", imgObj.name);
    const cropBounds = cropOverlay.getBoundingRect();
    const imageBounds = imgObj.getBoundingRect();

    const dataURL = imgObj.toDataURL();
    const img = new Image();
    img.onload = () => {
      const scaleX = img.width / imageBounds.width;
      const scaleY = img.height / imageBounds.height;
      const sx = (cropBounds.left - imageBounds.left) * scaleX;
      const sy = (cropBounds.top - imageBounds.top) * scaleY;
      const sw = cropBounds.width * scaleX;
      const sh = cropBounds.height * scaleY;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = sw;
      cropCanvas.height = sh;
      cropCanvas.getContext("2d")?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      // Use the same reliable approach as other image loading
      const croppedImg = new Image();
      croppedImg.crossOrigin = "anonymous";
      croppedImg.onload = () => {
        console.log("🖼️ Cropped image loaded, creating Fabric object");
        const cropped = new fabric.Image(croppedImg, {
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          originX: "center",
          originY: "center",
          selectable: true,
          name: `cropped-${Date.now()}`,
        });
        
        // Remove original image and crop overlay
        canvas.remove(imgObj);
        canvas.remove(cropOverlay);
        
        // Add the cropped image
        canvas.add(cropped);
        canvas.setActiveObject(cropped);
        setSelectedObject(cropped);
        
        // Clean up crop state
        setCropOverlay(null);
        setCropMode(false);
        
        // Force render to ensure everything is updated
        canvas.renderAll();
        console.log("✅ Crop applied successfully - original image and crop overlay removed");
      };
      croppedImg.onerror = (error) => {
        console.error("❌ Error loading cropped image:", error);
      };
      croppedImg.src = cropCanvas.toDataURL();
    };
    img.src = dataURL;
  };

  const cancelCrop = () => {
    if (!canvas || !cropOverlay) return;
    canvas.remove(cropOverlay);
    setCropOverlay(null);
    setCropMode(false);
  };

  // -----------------
  // Text Tool
  // -----------------
  const addText = () => {
    if (!canvas) return;
    const text = new fabric.Textbox("Edit me", {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      originX: "center",
      originY: "center",
      fontSize: 30,
      fill: "#000000",
      fontFamily: "Arial",
      selectable: true,
      name: `text-${Date.now()}`,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setSelectedObject(text);
  };

  const updateTextProperty = (prop: string, value: any) => {
    if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;
    (selectedObject as fabric.Textbox).set(prop as any, value);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    setSelectedObject(null);
  };

  // -----------------
  // Utilities
  // -----------------
  const resetCanvas = () => {
    if (!canvas) return;
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).name !== "tshirt-background") canvas.remove(obj);
    });
    setSelectedObject(null);
      canvas.renderAll();
  };

  const previewDesign = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png" });
    const w = window.open("");
    if (w) w.document.write(`<img src="${dataURL}" style="max-width:100%"/>`);
  };

  const exportDesign = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `${currentView}-design.png`;
    a.click();
  };

  const copyImageToBack = () => {
    if (!canvas || !selectedObject || selectedObject.type !== "image") return;
    const dataURL = (selectedObject as fabric.Image).toDataURL();
    setCurrentView("back");
    loadTShirtBackground(canvas, "back");
    fabric.Image.fromURL(dataURL, (img) => {
      img.set({
        left: CANVAS_WIDTH / 2,
        top: CANVAS_HEIGHT / 2,
        originX: "center",
        originY: "center",
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: true,
        name: `copied-back-${Date.now()}`,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      setSelectedObject(img);
    });
  };

  // -----------------
  // UI
  // -----------------
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{productTitle || "Custom T-Shirt Designer"}</h1>
      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <canvas ref={canvasRef} className="border rounded bg-white" />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                const next = currentView === "front" ? "back" : "front";
                setCurrentView(next);
                loadTShirtBackground(canvas!, next);
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Toggle View ({currentView})
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="w-80 space-y-3">
          {/* Upload */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-all duration-200 hover:shadow-md ${
              isDragActive 
                ? "border-blue-500 bg-blue-50 text-blue-700" 
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
              <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-2">
              <div className="text-3xl">📁</div>
              <div className="font-semibold text-gray-700">
                {isDragActive ? "Drop your image here" : "Upload Image"}
              </div>
              <div className="text-sm text-gray-500">
                Drag & drop or click to browse
              </div>
            </div>
          </div>

          {/* Add Text */}
          <button
            onClick={addText}
            className="w-full bg-purple-600 text-white px-3 py-1 rounded"
          >
            ➕ Add Text
          </button>

          {/* Text Controls */}
          {selectedObject && selectedObject.type === "textbox" && (
            <div className="bg-gray-100 p-3 rounded space-y-2">
              <h3 className="font-bold">Text Controls</h3>
              <input
                type="text"
                defaultValue={(selectedObject as fabric.Textbox).text}
                onChange={(e) => updateTextProperty("text", e.target.value)}
                className="w-full border p-1 rounded"
              />
              <label className="block text-sm">Font Size</label>
              <input
                  type="number"
                defaultValue={(selectedObject as fabric.Textbox).fontSize}
                onChange={(e) => updateTextProperty("fontSize", parseInt(e.target.value))}
                className="w-full border p-1 rounded"
              />
              <label className="block text-sm">Font Family</label>
              <select
                defaultValue={(selectedObject as fabric.Textbox).fontFamily}
                onChange={(e) => updateTextProperty("fontFamily", e.target.value)}
                className="w-full border p-1 rounded"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <label className="block text-sm">Font Color</label>
                  <input
                    type="color"
                defaultValue={(selectedObject as fabric.Textbox).fill as string}
                onChange={(e) => updateTextProperty("fill", e.target.value)}
                className="w-full"
              />
              <button
                onClick={deleteSelected}
                className="w-full bg-red-600 text-white px-3 py-1 rounded"
              >
                🗑 Delete Text
              </button>
          </div>
          )}

          {/* Image Controls */}
          {selectedObject && selectedObject.type === "image" && !cropMode && (
            <div className="bg-gray-100 p-3 rounded space-y-2">
              <h3 className="font-bold">Image Controls</h3>
              <button
                onClick={startCropMode}
                className="w-full bg-orange-600 text-white px-3 py-1 rounded"
              >
                ✂️ Start Crop
              </button>
              <button
                onClick={copyImageToBack}
                className="w-full bg-purple-600 text-white px-3 py-1 rounded"
              >
                Copy to Back
              </button>
            </div>
          )}

          {/* Crop Controls - Show when in crop mode */}
          {cropMode && (
            <div className="bg-orange-100 p-3 rounded space-y-2 border-2 border-orange-300">
              <h3 className="font-bold text-orange-800">Crop Controls</h3>
              <p className="text-sm text-orange-700">Drag the orange rectangle to select crop area</p>
              <button
                onClick={applyCrop}
                className="w-full bg-blue-600 text-white px-3 py-1 rounded"
              >
                ✅ Apply Crop
              </button>
              <button
                onClick={cancelCrop}
                className="w-full bg-gray-600 text-white px-3 py-1 rounded"
              >
                ❌ Cancel Crop
              </button>
          </div>
          )}

          {/* Canvas Controls */}
          <div className="bg-gray-100 p-3 rounded space-y-2">
            <h3 className="font-bold">Canvas Controls</h3>
            <button
              onClick={resetCanvas}
              className="w-full bg-red-500 text-white px-3 py-1 rounded"
            >
              🔄 Reset Canvas
            </button>
            <button
                onClick={previewDesign}
              className="w-full bg-green-600 text-white px-3 py-1 rounded"
            >
              👀 Preview
            </button>
            <button
              onClick={exportDesign}
              className="w-full bg-blue-600 text-white px-3 py-1 rounded"
            >
              💾 Export PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customizer;