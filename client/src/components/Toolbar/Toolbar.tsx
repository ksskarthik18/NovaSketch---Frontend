import React from 'react';
import { 
  Pencil, Eraser, MousePointer2, 
  Square, Circle, Triangle, ArrowRight, Minus, 
  Diamond, Hexagon, Cloud,
  Type, Bold, Italic, Underline
} from 'lucide-react';

export type ToolType = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'diamond' | 'hexagon' | 'cloud' | 'text';

interface ToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
  // Text formatting props
  isBold?: boolean;
  setIsBold?: (val: boolean) => void;
  isItalic?: boolean;
  setIsItalic?: (val: boolean) => void;
  isUnderline?: boolean;
  setIsUnderline?: (val: boolean) => void;
  underlineStyle?: 'solid' | 'dotted' | 'dashed' | 'wavy';
  setUnderlineStyle?: (val: 'solid' | 'dotted' | 'dashed' | 'wavy') => void;
  underlineThickness?: number;
  setUnderlineThickness?: (val: number) => void;
  fontFamily?: string;
  setFontFamily?: (val: string) => void;
  onColorChange?: (color: string) => void;
  selectedElement?: any;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  tool, setTool, color, setColor, size, setSize,
  isBold, setIsBold, 
  isItalic, setIsItalic, isUnderline, setIsUnderline,
  underlineStyle, setUnderlineStyle, underlineThickness, setUnderlineThickness,
  fontFamily, setFontFamily, onColorChange, selectedElement
}) => {
  const isSizeActive = (s: number) => size === s;
  
  // Check if a text element is selected
  const isTextSelected = selectedElement && selectedElement.tool === 'text';

  // Helper to handle color changes
  const handleColorChange = (newColor: string) => {
    if (tool === 'eraser') setTool('pen');
    setColor(newColor);
    if (onColorChange) onColorChange(newColor);
  };

  // Helper for Tool Icons
  const ToolButton = ({ t, icon: Icon, title }: { t: ToolType, icon: any, title: string }) => (
    <button 
      onClick={() => setTool(t)}
      title={title}
      style={{ 
        backgroundColor: tool === t ? '#e2e8f0' : 'transparent', 
        border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333'
      }}
    >
      <Icon size={20} />
    </button>
  );

  // Helper for S/M/L Buttons
  const SizeButton = ({ s, label }: { s: number, label: string }) => (
    <button 
      onClick={() => setSize(s)}
      style={{
        width: '32px', 
        height: '32px', 
        border: isSizeActive(s) ? '2px solid black' : '1px solid #ddd', 
        backgroundColor: isSizeActive(s) ? '#fff' : '#f9f9f9',
        borderRadius: '6px', 
        cursor: 'pointer',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 0,
        margin: 0,
        fontWeight: 'bold', 
        fontSize: '14px', 
        color: '#333',
        lineHeight: 1
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '15px', padding: '10px 20px',
      backgroundColor: 'white', borderRadius: '12px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 100, alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      {/* 1. EDIT TOOLS */}
      <div style={{ display: 'flex', gap: '5px' }}>
        <ToolButton t="select" icon={MousePointer2} title="Select & Move" />
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 5px' }}></div>
        <ToolButton t="pen" icon={Pencil} title="Pencil" />
        <ToolButton t="eraser" icon={Eraser} title="Eraser" />
        <ToolButton t="text" icon={Type} title="Text" />
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }}></div>

      {/* 2. SHAPES */}
      <div style={{ display: 'flex', gap: '5px' }}>
        <ToolButton t="rectangle" icon={Square} title="Rectangle" />
        <ToolButton t="circle" icon={Circle} title="Circle" />
        <ToolButton t="triangle" icon={Triangle} title="Triangle" />
        <ToolButton t="diamond" icon={Diamond} title="Diamond" />
        <ToolButton t="hexagon" icon={Hexagon} title="Hexagon" />
        <ToolButton t="cloud" icon={Cloud} title="Cloud" />
        <ToolButton t="arrow" icon={ArrowRight} title="Arrow" />
        <ToolButton t="line" icon={Minus} title="Line" />
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }}></div>

      {/* 3. SIZES */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
            <SizeButton s={5} label="S" />
            <SizeButton s={10} label="M" />
            <SizeButton s={20} label="L" />
        </div>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }}></div>

      {/* 4. COLORS */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b'].map((c) => (
          <button 
            key={c} 
            onClick={() => handleColorChange(c)} 
            style={{ 
              width: '24px', 
              height: '24px', 
              backgroundColor: c, 
              borderRadius: '50%', 
              border: color === c ? '2px solid black' : '1px solid #ddd', 
              cursor: 'pointer', 
              padding: 0, 
              flexShrink: 0 
            }} 
          />
        ))}
        <input 
          type="color" 
          value={color} 
          onChange={(e) => handleColorChange(e.target.value)} 
          style={{ 
            width: '28px', 
            height: '28px', 
            border: 'none', 
            cursor: 'pointer', 
            backgroundColor: 'transparent', 
            padding: 0 
          }} 
        />
      </div>

      {/* 5. TEXT FORMATTING CONTROLS (shown when text tool is active or text is selected) */}
      {(tool === 'text' || isTextSelected) && (
        <>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }}></div>
          
          {/* Font Family Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={fontFamily || 'Arial'}
              onChange={(e) => setFontFamily?.(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: 'white',
                minWidth: '120px'
              }}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Impact">Impact</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Lucida Console">Lucida Console</option>
              <option value="Palatino">Palatino</option>
              <option value="Garamond">Garamond</option>
              <option value="Bookman">Bookman</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Century Gothic">Century Gothic</option>
            </select>

            {/* Bold Button */}
            <button
              onClick={() => setIsBold?.(!isBold)}
              title="Bold"
              style={{
                backgroundColor: isBold ? '#e2e8f0' : 'transparent',
                border: 'none',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bold size={18} />
            </button>

            {/* Italic Button */}
            <button
              onClick={() => setIsItalic?.(!isItalic)}
              title="Italic"
              style={{
                backgroundColor: isItalic ? '#e2e8f0' : 'transparent',
                border: 'none',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Italic size={18} />
            </button>

            {/* Underline Button with Dropdown */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setIsUnderline?.(!isUnderline)}
                title="Underline"
                style={{
                  backgroundColor: isUnderline ? '#e2e8f0' : 'transparent',
                  border: 'none',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Underline size={18} />
              </button>
            </div>
          </div>

          {/* Underline Customization (shown when underline is active) */}
          {isUnderline && (
            <>
              <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Underline Style */}
                <select
                  value={underlineStyle || 'solid'}
                  onChange={(e) => setUnderlineStyle?.(e.target.value as any)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '11px',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                  }}
                  title="Underline Style"
                >
                  <option value="solid">Solid</option>
                  <option value="dotted">Dotted</option>
                  <option value="dashed">Dashed</option>
                  <option value="wavy">Wavy</option>
                </select>

                {/* Underline Thickness */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#666' }}>Thickness:</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={underlineThickness || 1}
                    onChange={(e) => setUnderlineThickness?.(Number(e.target.value))}
                    style={{ width: '60px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#333', minWidth: '15px' }}>{underlineThickness || 1}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Toolbar;