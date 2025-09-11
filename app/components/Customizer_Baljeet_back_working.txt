import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as fabric from "fabric";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1000;

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Impact",
  "Verdana",
  "Georgia",
];

type Side = "front" | "back";

const Customizer: React.FC<{ productTitle?: string }> = ({ productTitle }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [currentView, setCurrentView] = useState<Side>("front");

  const [cropOverlay, setCropOverlay] = useState<fabric.Rect | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropTarget, setCropTarget] = useState<fabric.Image | null>(null);

  // store the saved JSON per side (exclude background object)
  const designStates = useRef<{ front: any | null; back: any | null }>({
    front: null,
    back: null,
  });

  // -----------------
  // Initialize canvas
  // -----------------
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const fc = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });
    fabricCanvasRef.current = fc;
    setCanvas(fc);

    // initial background load (no await required here)
    loadTShirtBackground(fc, "front").catch((e) => {
      console.error("Error loading background on init:", e);
    });

    // Event listeners to track selection
    fc.on("selection:created", (e) => {
      if (e.selected?.[0]) setSelectedObject(e.selected[0]);
    });
    fc.on("selection:updated", (e) => {
      if (e.selected?.[0]) setSelectedObject(e.selected[0]);
    });
    fc.on("selection:cleared", () => setSelectedObject(null));

    return () => {
      fc.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------
  // Load T-shirt Background (returns promise when added)
  // -----------------
  const loadTShirtBackground = useCallback(
    (fabricCanvas: fabric.Canvas, side: Side): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const path = side === "front" ? "/Front White Tshirt.png" : "/Back White Tshirt.png";

          // remove existing background if present
          const existing = fabricCanvas.getObjects().find((o) => (o as any).name === "tshirt-background");
          if (existing) {
            fabricCanvas.remove(existing);
          }

          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const fabricImg = new fabric.Image(img, {
              left: CANVAS_WIDTH / 2,
              top: CANVAS_HEIGHT / 2,
              originX: "center",
              originY: "center",
              selectable: false,
              evented: false,
              name: "tshirt-background",
            });

            fabricImg.scaleToWidth(CANVAS_WIDTH);
            // always keep background at the back
            fabricCanvas.insertAt(0, fabricImg);
            fabricCanvas.renderAll();
            resolve();
          };
          img.onerror = (err) => {
            console.error("Background image load error:", err);
            // still resolve so the app doesn't hang — UI can handle missing file
            resolve();
          };
          img.src = path;
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  // -----------------
  // Save current side (store JSON, excluding background)
  // -----------------
  const saveCurrentDesign = useCallback(() => {
    if (!canvas) return;
    // include 'name' property in serialization
    const json = (canvas as any).toJSON(["name"]);
    // remove any background object from json.objects
    if (Array.isArray(json.objects)) {
      json.objects = json.objects.filter((o: any) => {
        const name = o.name as string | undefined;
        if (!name) return true;
        if (name === "tshirt-background") return false;
        if (name === "crop-overlay" || name.startsWith("crop-")) return false;
        return true;
      });
    }
    designStates.current[currentView] = json;
  }, [canvas, currentView]);

  // -----------------
  // Restore design for a side
  // -----------------
  const restoreDesign = useCallback(
    async (side: Side) => {
      if (!canvas) return;

      // Clear ALL objects so we start fresh
      canvas.clear();

      // If we have a saved JSON for this side, load it (objects only)
      const saved = designStates.current[side];
      if (saved) {
        // loadFromJSON accepts the same JSON shape as toJSON
        canvas.loadFromJSON(saved, () => {
          // Make sure background remains and render
          loadTShirtBackground(canvas, side)
            .then(() => {
              // Single render frame to avoid flicker
              requestAnimationFrame(() => canvas.renderAll());
            })
            .catch(() => {
              requestAnimationFrame(() => canvas.renderAll());
            });
        });
          } else {
        // nothing to restore — just background-only canvas
        await loadTShirtBackground(canvas, side);
        requestAnimationFrame(() => canvas.renderAll());
      }
    },
    [canvas, loadTShirtBackground]
  );

  // -----------------
  // Drop / Upload
  // -----------------
  const onDrop = useCallback(
    (files: File[]) => {
      if (!canvas || files.length === 0) return;
      const file = files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
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
          
          // Save only the non-background objects
          saveCurrentDesign();
        };
        img.onerror = (err) => {
          console.error("Upload image load error:", err);
        };
        img.src = url;
      };
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
      };
      reader.readAsDataURL(file);
    },
    [canvas, currentView, saveCurrentDesign]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    multiple: false,
  });

  // -----------------
  // Crop
  // -----------------
  // Keep crop overlay constrained inside the image
  function clampOverlayWithinImage(rect: fabric.Rect, img: fabric.Image) {
    const imageBounds = img.getBoundingRect();
    const rectWidth = rect.getScaledWidth();
    const rectHeight = rect.getScaledHeight();
    const minLeft = imageBounds.left;
    const minTop = imageBounds.top;
    const maxRight = imageBounds.left + imageBounds.width;
    const maxBottom = imageBounds.top + imageBounds.height;

    let nextLeft = rect.left ?? 0;
    let nextTop = rect.top ?? 0;

    if (nextLeft < minLeft) nextLeft = minLeft;
    if (nextTop < minTop) nextTop = minTop;
    if (nextLeft + rectWidth > maxRight) nextLeft = maxRight - rectWidth;
    if (nextTop + rectHeight > maxBottom) nextTop = maxBottom - rectHeight;

    rect.set({ left: nextLeft, top: nextTop });
    rect.setCoords();
  }

  function clampOverlayScaleAndPosition(rect: fabric.Rect, img: fabric.Image) {
    const imageBounds = img.getBoundingRect();

    // Limit scale so overlay cannot exceed the image's dimensions
    const baseW = rect.width ?? 0.0001;
    const baseH = rect.height ?? 0.0001;
    let scaleX = rect.scaleX ?? 1;
    let scaleY = rect.scaleY ?? 1;

    const maxScaleX = imageBounds.width / baseW;
    const maxScaleY = imageBounds.height / baseH;
    if (scaleX > maxScaleX) scaleX = maxScaleX;
    if (scaleY > maxScaleY) scaleY = maxScaleY;
    rect.set({ scaleX, scaleY });
    rect.setCoords();

    // Then clamp position
    clampOverlayWithinImage(rect, img);
  }

  const startCropMode = () => {
    if (!canvas || !selectedObject || selectedObject.type !== "image") return;
    if (cropMode) return;

    // store target image explicitly (so we always crop the intended image)
    const target = selectedObject as fabric.Image;
    setCropTarget(target);

    // Show a visible border on the target image while cropping
    const anyTarget = target as any;
    anyTarget.__prevStroke = target.stroke;
    anyTarget.__prevStrokeWidth = target.strokeWidth;
    anyTarget.__prevStrokeDashArray = (target as any).strokeDashArray;
    target.set({ stroke: "#4f46e5", strokeWidth: 2, strokeDashArray: [6, 6] as any });
    target.setCoords();

    const bounds = target.getBoundingRect();
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

    // Disable rotation handle for simpler constraints
    if (rect.setControlsVisibility) {
      rect.setControlsVisibility({ mtr: false } as any);
    }

    // Clamp initial placement and keep it constrained on move/scale
    clampOverlayWithinImage(rect, target);
    rect.on("moving", () => clampOverlayWithinImage(rect, target));
    rect.on("scaling", () => clampOverlayScaleAndPosition(rect, target));

    canvas.add(rect);
    canvas.setActiveObject(rect);
    setCropOverlay(rect);
    setCropMode(true);
    canvas.renderAll();
  };

  const applyCrop = () => {
    if (!canvas || !cropOverlay || !cropTarget) return;

    const imgObj = cropTarget;
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
      cropCanvas.width = Math.max(1, Math.round(sw));
      cropCanvas.height = Math.max(1, Math.round(sh));
      const ctx = cropCanvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get 2D context for crop");
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);

      const croppedImg = new Image();
      croppedImg.crossOrigin = "anonymous";
      croppedImg.onload = () => {
        const cropped = new fabric.Image(croppedImg, {
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          originX: "center",
          originY: "center",
          selectable: true,
          name: `cropped-${currentView}-${Date.now()}`,
        });

        // remove only the targeted original image and the overlay
        canvas.remove(imgObj);
        canvas.remove(cropOverlay);

        canvas.add(cropped);
        canvas.setActiveObject(cropped);
        setSelectedObject(cropped);

        // restore previous stroke on old target if stored
        const anyTarget = imgObj as any;
        imgObj.set({
          stroke: anyTarget.__prevStroke,
          strokeWidth: anyTarget.__prevStrokeWidth ?? 0,
          strokeDashArray: anyTarget.__prevStrokeDashArray,
        } as any);

        setCropOverlay(null);
        setCropMode(false);
        setCropTarget(null);

        canvas.renderAll();

        // Save new state for current side
        saveCurrentDesign();
      };
      croppedImg.onerror = (err) => {
        console.error("Cropped image load error:", err);
      };
      croppedImg.src = cropCanvas.toDataURL();
    };
    img.onerror = () => {
      console.error("Error reconstructing image for crop");
    };
    img.src = dataURL;
  };

  const cancelCrop = () => {
    if (!canvas || !cropOverlay) return;
    // remove temporary border from the crop target if present
    if (cropTarget) {
      const anyTarget = cropTarget as any;
      cropTarget.set({
        stroke: anyTarget.__prevStroke,
        strokeWidth: anyTarget.__prevStrokeWidth ?? 0,
        strokeDashArray: anyTarget.__prevStrokeDashArray,
      } as any);
      cropTarget.setCoords();
    }
    canvas.remove(cropOverlay);
    setCropOverlay(null);
    setCropMode(false);
    setCropTarget(null);
    canvas.renderAll();
  };

  // -----------------
  // Text / object utilities
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
    canvas.renderAll();
    saveCurrentDesign();
  };

  const updateTextProperty = (prop: string, value: any) => {
    if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;
    (selectedObject as fabric.Textbox).set(prop as any, value);
    canvas.renderAll();
    saveCurrentDesign();
  };

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    setSelectedObject(null);
    canvas.renderAll();
    saveCurrentDesign();
  };

  // -----------------
  // Reset / preview / export
  // -----------------
  const resetCanvas = () => {
    if (!canvas) return;
    // remove all non-background objects
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).name !== "tshirt-background") canvas.remove(obj);
    });
    setSelectedObject(null);
      canvas.renderAll();
    saveCurrentDesign();
  };

  const previewDesign = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
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

  // -----------------
  // Toggle handler
  // -----------------
  const handleToggle = async () => {
    if (!canvas) return;
    // Clean up transient crop overlay before saving
    if (cropOverlay) {
      canvas.remove(cropOverlay);
      setCropOverlay(null);
      setCropMode(false);
      setCropTarget(null);
    }
    // save current view state
    saveCurrentDesign();
    const next: Side = currentView === "front" ? "back" : "front";
    setCurrentView(next);
    await restoreDesign(next);
  };

  // -----------------
  // Render UI
  // -----------------
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{productTitle || "Custom T-Shirt Designer"}</h1>
      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleToggle}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Toggle View ({currentView})
            </button>
            <div className="text-sm text-gray-600">Editing: <strong>{currentView.toUpperCase()}</strong></div>
          </div>
          <canvas ref={(el) => (canvasRef.current = el)} className="border rounded bg-white" />
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
                {isDragActive ? "Drop your image here" : `Upload Image (${currentView})`}
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
            </div>
          )}

          {/* Crop Controls */}
          {cropMode && (
            <div className="bg-orange-100 p-3 rounded space-y-2 border-2 border-orange-300">
              <h3 className="font-bold text-orange-800">Crop Controls</h3>
              <p className="text-sm text-orange-700">Drag the orange rectangle to select crop area</p>
              <button onClick={applyCrop} className="w-full bg-blue-600 text-white px-3 py-1 rounded">
                ✅ Apply Crop
              </button>
              <button onClick={cancelCrop} className="w-full bg-gray-600 text-white px-3 py-1 rounded">
                ❌ Cancel Crop
              </button>
          </div>
          )}

          {/* Canvas Controls */}
          <div className="bg-gray-100 p-3 rounded space-y-2">
            <h3 className="font-bold">Canvas Controls</h3>
            <button onClick={resetCanvas} className="w-full bg-red-500 text-white px-3 py-1 rounded">
              🔄 Reset Canvas
            </button>
            <button onClick={previewDesign} className="w-full bg-green-600 text-white px-3 py-1 rounded">
              👀 Preview
            </button>
            <button onClick={exportDesign} className="w-full bg-blue-600 text-white px-3 py-1 rounded">
              💾 Export PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customizer;
