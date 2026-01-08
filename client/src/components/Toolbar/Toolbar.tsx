import React from 'react';
import { 
  Pencil, Eraser, MousePointer2, 
  Square, Circle, Triangle, ArrowRight, Minus, 
  Diamond, Hexagon, Cloud,
  Type
} from 'lucide-react';

export type ToolType = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'diamond' | 'hexagon' | 'cloud' | 'text';

interface ToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ tool, setTool, color, setColor, size, setSize }) => {
  const isSizeActive = (s: number) => size === s;

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

  // Helper for S/M/L Buttons (FIXED CENTERING)
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
        // --- CENTERING MAGIC ---
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 0,             // FORCE 0 padding
        margin: 0,
        fontWeight: 'bold', 
        fontSize: '14px', 
        color: '#333',
        lineHeight: 1           // Prevents text floating up/down
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
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 100, alignItems: 'center'
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

      {/* 3. SIZES (FIXED) */}
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
          <button key={c} onClick={() => { if(tool === 'eraser') setTool('pen'); setColor(c); }} style={{ width: '24px', height: '24px', backgroundColor: c, borderRadius: '50%', border: color === c ? '2px solid black' : '1px solid #ddd', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
        ))}
        <input type="color" value={color} onChange={(e) => { if(tool === 'eraser') setTool('pen'); setColor(e.target.value); }} style={{ width: '28px', height: '28px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', padding: 0 }} />
      </div>
    </div>
  );
};

export default Toolbar;