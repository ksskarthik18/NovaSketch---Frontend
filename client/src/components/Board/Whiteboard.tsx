import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Path, Rect, Ellipse, Line, RegularPolygon, Arrow, Transformer ,Text} from 'react-konva';
import { nanoid } from 'nanoid';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useParams } from 'react-router-dom';
import { getSvgPathFromStroke } from '../../utils/getStroke';
import Toolbar from '../Toolbar/Toolbar';


// --- STYLES ---
const GlobalStyles = () => (
  <style>{`
    body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
    #root { margin: 0; padding: 0; width: 100%; height: 100%; }
    .property-panel {
      position: absolute; top: 10px; right: 10px; 
      background: white; padding: 15px; border-radius: 8px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 20;
      display: flex; flex-direction: column; gap: 10px; width: 200px;
    }
    .property-row { display: flex; flex-direction: column; gap: 5px; }
    .property-label { font-size: 12px; color: #666; font-weight: bold; }
    .btn-group { display: flex; gap: 5px; flex-wrap: wrap; }
    .btn { padding: 5px 10px; border: 1px solid #ddd; background: #eee; cursor: pointer; font-size: 11px; border-radius: 4px; }
    .btn.active { background: #007bff; color: white; border-color: #007bff; }
  `}</style>
);


type BrushType = 'marker' | 'calligraphy' | 'airbrush';
type StrokeType = 'solid' | 'dashed' | 'dotted';
type EraserMode = 'object' | 'partial';
type ToolType = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'diamond' | 'hexagon' | 'cloud' | 'text';


const CLOUD_PATH = "M 25,60 A 20,20 0 0,1 25,20 A 20,20 0 0,1 55,10 A 20,20 0 0,1 85,30 A 20,20 0 0,1 85,60 Q 85,75 50,75 Q 15,75 25,60 z";


interface DrawingElement {
  id: string;
  tool: ToolType;
  color: string;
  size: number;
  points: number[][];
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  // New Styling Properties
  strokeType?: StrokeType;
  dash?: number[];
  opacity?: number;
  tension?: number; // For brush smoothness
  shadowBlur?: number;
  cornerRadius?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // 'normal', 'bold', 'italic', 'bold italic'
  textDecoration?: string; // 'none', 'underline'
}



const Whiteboard = () => {
  const { roomId } = useParams();
  const [elements, setElements] = useState<DrawingElement[]>([]);
  
  // --- STATE ---
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // --- NEW CUSTOMIZATION STATE ---
  const [brushType, setBrushType] = useState<BrushType>('marker');
  const [strokeType, setStrokeType] = useState<StrokeType>('solid');
  const [eraserMode, setEraserMode] = useState<EraserMode>('object');
  const [cornerRadius, setCornerRadius] = useState(0);
  const [hasShadow, setHasShadow] = useState(false);


  // --- TEXT TOOL STATE ---
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null);
  
  // --- NEW: TEXT FORMATTING STATE ---
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');

  const isDrawing = useRef(false);
  const ydoc = useRef<Y.Doc>(new Y.Doc());
  const yElements = useRef<Y.Array<DrawingElement>>(ydoc.current.getArray('elements'));
  const startPos = useRef<{x: number, y: number} | null>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    const provider = new WebsocketProvider('ws://localhost:1234', roomId || 'default-room', ydoc.current);
    yElements.current.observe(() => setElements(yElements.current.toArray()));
    return () => provider.disconnect();
  }, [roomId]);

  // --- NEW: Update selected text element's properties ---
  useEffect(() => {
    if (selectedId) {
      const selectedElement = elements.find(el => el.id === selectedId);
      if (selectedElement && selectedElement.tool === 'text') {
        // Sync the main color state with the selected text's color
        setColor(selectedElement.color || '#000000');
        
        // Parse font style
        const fontStyle = selectedElement.fontStyle || 'normal';
        setIsBold(fontStyle.includes('bold'));
        setIsItalic(fontStyle.includes('italic'));
        setIsUnderline(selectedElement.textDecoration === 'underline');
        setFontFamily(selectedElement.fontFamily || 'Arial');
      }
    }
  }, [selectedId, elements]);

  // --- HELPERS ---
  const getDashArray = (type: StrokeType, width: number) => {
    if (type === 'dashed') return [width * 3, width * 2];
    if (type === 'dotted') return [width, width * 2];
    return [];
  };

  const getBrushStyles = (bType: BrushType) => {
    if (bType === 'calligraphy') return { tension: 0.5, opacity: 0.8, shadowBlur: 0 };
    if (bType === 'airbrush') return { tension: 0.5, opacity: 0.5, shadowBlur: 20 };
    return { tension: 0, opacity: 1, shadowBlur: 0 }; // Marker
  };

  // --- NEW: Get font style string ---
  const getFontStyle = () => {
    if (isBold && isItalic) return 'bold italic';
    if (isBold) return 'bold';
    if (isItalic) return 'italic';
    return 'normal';
  };

  // --- NEW: Update selected text element's formatting ---
  const updateTextFormatting = (updates: Partial<DrawingElement>) => {
    if (!selectedId) return;
    
    const index = yElements.current.toArray().findIndex(el => el.id === selectedId);
    if (index === -1) return;
    
    const oldEl = yElements.current.get(index);
    if (oldEl.tool !== 'text') return;
    
    const newEl = { ...oldEl, ...updates };
    yElements.current.delete(index, 1);
    yElements.current.insert(index, [newEl]);
  };

  // --- ERASER LOGIC ---
  const checkForEraser = (stage: any) => {
    // Only use Object Eraser logic if we are in 'object' mode
    if (tool !== 'eraser' || eraserMode !== 'object') return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const shape = stage.getIntersection(pos);
    if (shape && shape.attrs.id) {
       const index = yElements.current.toArray().findIndex(el => el.id === shape.attrs.id);
       if (index !== -1) yElements.current.delete(index, 1);
    }
  };

  // --- MOUSE DOWN ---
  const handleMouseDown = (e: any) => {
      if (editingTextId) return;

      if (tool === 'select') {
        if (e.target === e.target.getStage()) setSelectedId(null);
        return;
      }

        // Handle text tool click
      if (tool === 'text') {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert canvas coords → DOM coords
      const stageBox = stage.container().getBoundingClientRect();

      const domX = stageBox.left + pointer.x;
      const domY = stageBox.top + pointer.y;

      const newTextElement: DrawingElement = {
        id: nanoid(),
        tool: 'text',
        color: color, // Use the main color state
        size: 16,
        points: [],
        x: pointer.x,
        y: pointer.y,
        text: '',
        fontSize: 16,
        fontFamily: fontFamily,
        fontStyle: getFontStyle(),
        textDecoration: isUnderline ? 'underline' : 'none',
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      };

      yElements.current.push([newTextElement]);

      setEditingTextId(newTextElement.id);
      setTextInput('');
      setTextPosition({ x: domX, y: domY });

      return;
    }


    // 1. OBJECT ERASER
    if (tool === 'eraser' && eraserMode === 'object') {
      isDrawing.current = true;
      checkForEraser(e.target.getStage());
      return;
    }

    // 2. DRAWING (Includes Partial Eraser)
    setSelectedId(null);
    isDrawing.current = true;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    startPos.current = { x: pos.x, y: pos.y };

    // Determine Styles based on settings
    const isEraser = tool === 'eraser'; // Partial eraser counts as drawing
    const drawColor = isEraser ? '#f0f0f0' : color;
    const drawSize = isEraser ? size * 2 : size;
    const brushStyles = isEraser ? { tension: 0, opacity: 1, shadowBlur: 0 } : getBrushStyles(brushType);
    
    const isPathTool = ['pen', 'eraser', 'line', 'arrow'].includes(tool);

    const newElement: DrawingElement = {
      id: nanoid(),
      tool: tool,
      color: drawColor,
      size: drawSize,
      points: [[pos.x, pos.y]],
      x: isPathTool ? 0 : pos.x, 
      y: isPathTool ? 0 : pos.y,
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      // Apply Custom Styles
      strokeType: isEraser ? 'solid' : strokeType,
      dash: isEraser ? [] : getDashArray(strokeType, drawSize),
      opacity: brushStyles.opacity,
      tension: brushStyles.tension,
      shadowBlur: hasShadow ? 15 : brushStyles.shadowBlur,
      cornerRadius: cornerRadius
    };

    yElements.current.push([newElement]);
  };

  // --- MOUSE MOVE ---
  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    
    if (tool === 'eraser' && eraserMode === 'object') {
      checkForEraser(stage);
      return;
    }

    if (!startPos.current) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const index = yElements.current.length - 1;
    const currentElement = yElements.current.get(index);
    if (!currentElement) return;

    const updatedElement = { ...currentElement };

    // PATH TOOLS
    if (tool === 'pen' || tool === 'eraser') {
      updatedElement.points = [...updatedElement.points, [pos.x, pos.y]];
    } 
    // LINE TOOLS
    else if (tool === 'line' || tool === 'arrow') {
      updatedElement.points = [[startPos.current.x, startPos.current.y], [pos.x, pos.y]];
    } 
    // SHAPE TOOLS
    else {
      const startX = startPos.current.x;
      const startY = startPos.current.y;
      const curX = pos.x;
      const curY = pos.y;
      const width = Math.abs(curX - startX);
      const height = Math.abs(curY - startY);

      if (tool === 'rectangle' || tool === 'cloud') {
         updatedElement.x = Math.min(startX, curX);
         updatedElement.y = Math.min(startY, curY);
         updatedElement.width = width;
         updatedElement.height = height;
      } else {
         updatedElement.x = (startX + curX) / 2;
         updatedElement.y = (startY + curY) / 2;
         updatedElement.width = width;
         updatedElement.height = height;
      }
    }

    yElements.current.delete(index, 1);
    yElements.current.insert(index, [updatedElement]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    startPos.current = null;
  };

  const handleTransformEnd = (e: any, id: string) => {
    const node = e.target;
    const index = yElements.current.toArray().findIndex(el => el.id === id);
    if (index === -1) return;
    const oldEl = yElements.current.get(index);
    const newEl = {
      ...oldEl,
      x: node.x(), y: node.y(), rotation: node.rotation(),
      scaleX: node.scaleX(), scaleY: node.scaleY(),
    };
    yElements.current.delete(index, 1);
    yElements.current.insert(index, [newEl]);
  };

  // --- TEXT INPUT OVERLAY COMPONENT ---
  const TextInputOverlay = () => {
    if (!editingTextId || !textPosition) return null;

    const handleTextSubmit = () => {
      if (textInput.trim() === '') {
        // If empty, delete the element
        const index = yElements.current.toArray().findIndex(el => el.id === editingTextId);
        if (index !== -1) yElements.current.delete(index, 1);
      } else {
        // Update the text element with the typed content
        const index = yElements.current.toArray().findIndex(el => el.id === editingTextId);
        if (index !== -1) {
          const oldEl = yElements.current.get(index);
          const newEl = { ...oldEl, text: textInput };
          yElements.current.delete(index, 1);
          yElements.current.insert(index, [newEl]);
        }
      }
      
      // Exit edit mode
      setEditingTextId(null);
      setTextInput('');
      setTextPosition(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextSubmit();
      } else if (e.key === 'Escape') {
        // Cancel editing - remove empty text element
        const index = yElements.current.toArray().findIndex(el => el.id === editingTextId);
        if (index !== -1) yElements.current.delete(index, 1);
        setEditingTextId(null);
        setTextInput('');
        setTextPosition(null);
      }
    };

    return (
      <input
        type="text"
        autoFocus
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          left: textPosition.x,
          top: textPosition.y,
          border: '2px solid #007bff',
          padding: '4px 8px',
          fontSize: '16px',
          fontFamily: fontFamily,
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
          textDecoration: isUnderline ? 'underline' : 'none',
          color: color, // Use main color state
          background: 'white',
          outline: 'none',
          minWidth: '100px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        placeholder="Type text..."
      />
    );
  };

  

  return (
    <>
      <GlobalStyles />
      <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#f0f0f0', overflow: 'hidden' }}>
        
        {/* --- STAGE --- */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
            {/* @ts-ignore */}
            <Stage 
              ref={stageRef}
              width={window.innerWidth} 
              height={window.innerHeight} 
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
            >
            <Layer>
                {elements.map((el, i) => {
                const commonProps = {
                    key: el.id, id: el.id,
                    draggable: tool === 'select',
                    onClick: (e: any) => { if (tool === 'select') { e.cancelBubble = true; setSelectedId(el.id); } },
                    onTap: (e: any) => { if (tool === 'select') { e.cancelBubble = true; setSelectedId(el.id); } },
                    onDragEnd: (e: any) => handleTransformEnd(e, el.id),
                    onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
                    x: el.x, y: el.y, rotation: el.rotation || 0,
                    scaleX: el.scaleX || 1, scaleY: el.scaleY || 1,
                    stroke: el.color, strokeWidth: el.size,
                    opacity: el.opacity ?? 1,
                    shadowColor: 'black', shadowBlur: el.shadowBlur ?? 0, shadowOpacity: 0.5,
                    dash: el.dash, // Apply Dotted/Dashed
                    lineCap: 'round' as const, lineJoin: 'round' as const,
                };

                const rx = Math.abs((el.width||0)/2);
                const ry = Math.abs((el.height||0)/2);

                if (el.tool === 'pen' || el.tool === 'eraser') {
                    return <Path {...commonProps} data={getSvgPathFromStroke(el.points, el.size)} fill={el.color} stroke={el.color} tension={el.tension} />;
                }

                if (el.tool === 'text') {
                  return (
                    <Text
                      key={el.id}
                      id={el.id}
                      x={el.x}
                      y={el.y}
                      text={el.text || ''}
                      fontSize={el.fontSize || 16}
                      fontFamily={el.fontFamily || 'Arial'}
                      fontStyle={el.fontStyle || 'normal'}
                      textDecoration={el.textDecoration || 'none'}
                      fill={el.color}
                      draggable={tool === 'select'}
                      rotation={el.rotation || 0}
                      scaleX={el.scaleX || 1}
                      scaleY={el.scaleY || 1}
                      opacity={el.opacity ?? 1}
                      onClick={(e: any) => { 
                        if (tool === 'select') { 
                          e.cancelBubble = true; 
                          setSelectedId(el.id); 
                        } 
                      }}
                      onTap={(e: any) => { 
                        if (tool === 'select') { 
                          e.cancelBubble = true; 
                          setSelectedId(el.id); 
                        } 
                      }}
                      onDragEnd={(e: any) => handleTransformEnd(e, el.id)}
                      onTransformEnd={(e: any) => handleTransformEnd(e, el.id)}
                      listening={tool === 'select' || tool === 'eraser'}
                    />
                  );
                }


                
                if (el.tool === 'line') return <Line {...commonProps} points={el.points.flat()} />;
                if (el.tool === 'arrow') return <Arrow {...commonProps} points={el.points.flat()} fill={el.color} pointerLength={10} pointerWidth={10} />;
                
                if (el.tool === 'rectangle') return <Rect {...commonProps} width={el.width} height={el.height} cornerRadius={el.cornerRadius} />;
                
                if (el.tool === 'circle') return <Ellipse {...commonProps} radiusX={rx} radiusY={ry} />;
                
                if (el.tool === 'triangle') return <RegularPolygon {...commonProps} sides={3} radius={Math.max(rx, ry)} />;
                if (el.tool === 'hexagon') return <RegularPolygon {...commonProps} sides={6} radius={Math.max(rx, ry)} />;
                if (el.tool === 'diamond') return <RegularPolygon {...commonProps} sides={4} radius={Math.max(rx, ry)} rotation={(el.rotation||0) + 45} />;
                
                if (el.tool === 'cloud') return <Path {...commonProps} data={CLOUD_PATH} scaleX={(el.width || 100) / 100} scaleY={(el.height || 75) / 75} fill="white" />;
                
                return null;
                })}

                {selectedId && (
                <Transformer
                    ref={(node) => {
                    if (node) {
                        const selectedNode = node.getStage()?.findOne('#' + selectedId);
                        if (selectedNode) { node.nodes([selectedNode]); node.getLayer()?.batchDraw(); }
                    }
                    }}
                />
                )}
            </Layer>
            </Stage>
        </div>

        <TextInputOverlay />

        {/* --- MAIN TOOLBAR --- */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, width: '100%', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
                 <Toolbar 
                   tool={tool} 
                   setTool={setTool} 
                   color={color} 
                   setColor={setColor} 
                   size={size} 
                   setSize={setSize}
                   // Text formatting props
                   isBold={isBold}
                   setIsBold={(val) => {
                     setIsBold(val);
                     if (selectedId) {
                       const fontStyle = val && isItalic ? 'bold italic' : val ? 'bold' : isItalic ? 'italic' : 'normal';
                       updateTextFormatting({ fontStyle });
                     }
                   }}
                   isItalic={isItalic}
                   setIsItalic={(val) => {
                     setIsItalic(val);
                     if (selectedId) {
                       const fontStyle = isBold && val ? 'bold italic' : isBold ? 'bold' : val ? 'italic' : 'normal';
                       updateTextFormatting({ fontStyle });
                     }
                   }}
                   isUnderline={isUnderline}
                   setIsUnderline={(val) => {
                     setIsUnderline(val);
                     if (selectedId) {
                       updateTextFormatting({ textDecoration: val ? 'underline' : 'none' });
                     }
                   }}
                   fontFamily={fontFamily}
                   setFontFamily={(val) => {
                     setFontFamily(val);
                     if (selectedId) {
                       updateTextFormatting({ fontFamily: val });
                     }
                   }}
                   onColorChange={(newColor) => {
                     setColor(newColor);
                     if (selectedId) {
                       updateTextFormatting({ color: newColor });
                     }
                   }}
                   selectedElement={selectedId ? elements.find(el => el.id === selectedId) : null}
                 />
            </div>
        </div>

        {/* --- NEW PROPERTIES PANEL --- */}
        <div className="property-panel">
            
            {/* 1. LINE THICKNESS */}
            <div className="property-row">
                <span className="property-label">Thickness: {size}px</span>
                <input type="range" min="1" max="50" value={size} onChange={(e) => setSize(Number(e.target.value))} />
                <div className="btn-group">
                    {[2, 5, 10, 20, 40].map(s => (
                        <button key={s} className={`btn ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>
                             {s}px
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. PEN TYPES */}
            {tool === 'pen' && (
                <div className="property-row">
                    <span className="property-label">Brush Style</span>
                    <div className="btn-group">
                        {(['marker', 'calligraphy', 'airbrush'] as BrushType[]).map(t => (
                            <button key={t} className={`btn ${brushType === t ? 'active' : ''}`} onClick={() => setBrushType(t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. LINE/SHAPE TYPE */}
            <div className="property-row">
                <span className="property-label">Stroke Style</span>
                <div className="btn-group">
                    {(['solid', 'dashed', 'dotted'] as StrokeType[]).map(t => (
                        <button key={t} className={`btn ${strokeType === t ? 'active' : ''}`} onClick={() => setStrokeType(t)}>
                             {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. ERASER TYPE */}
            {tool === 'eraser' && (
                <div className="property-row">
                    <span className="property-label">Eraser Mode</span>
                    <div className="btn-group">
                        <button className={`btn ${eraserMode === 'partial' ? 'active' : ''}`} onClick={() => setEraserMode('partial')}>Partial (White)</button>
                        <button className={`btn ${eraserMode === 'object' ? 'active' : ''}`} onClick={() => setEraserMode('object')}>Object (Delete)</button>
                    </div>
                </div>
            )}

            {/* 5. SHAPE OPTIONS */}
            {tool === 'rectangle' && (
                 <div className="property-row">
                    <span className="property-label">Corner Radius</span>
                    <input type="range" min="0" max="50" value={cornerRadius} onChange={(e) => setCornerRadius(Number(e.target.value))} />
                 </div>
            )}
            
            <div className="property-row">
                <label className="property-label" style={{display:'flex', alignItems:'center', gap: 5}}>
                    <input type="checkbox" checked={hasShadow} onChange={(e) => setHasShadow(e.target.checked)} />
                    Enable Shadow
                </label>
            </div>

        </div>

      </div>
    </>
  );
};

export default Whiteboard;