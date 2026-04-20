import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, X, Check, Camera } from 'lucide-react';

const AvatarCropModal = ({ isOpen, image, onCrop, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Circular crop logic
        const img = imgRef.current;
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Calculate based on current zoom and offset
        const drawSize = 300 * zoom; 
        // Viewport is 300x300 centered
        
        ctx.clearRect(0,0,400,400);
        
        // We want to capture what's inside the 300x300 circle
        // Circle is centered at rect.width/2, rect.height/2
        
        const scale = img.naturalWidth / (img.width);
        
        // Simpler approach: Draw exactly what user sees
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Destination: 400x400 canvas
        // Source: The portion of the image visible in the 300x300 portal
        
        // We actually want to draw the image displaced and scaled
        // x, y are relative to center
        ctx.translate(200, 200);
        ctx.scale(zoom, zoom);
        ctx.translate(offset.x / zoom, offset.y / zoom);
        
        // Draw image centered
        const aspect = img.naturalWidth / img.naturalHeight;
        let dw, dh;
        if (aspect > 1) {
            dh = 300;
            dw = 300 * aspect;
        } else {
            dw = 300;
            dh = 300 / aspect;
        }
        
        ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
        
        canvas.toBlob((blob) => {
            onCrop(blob);
        }, 'image/webp', 0.9);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Adjust Image</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Center and frame your profile picture.</p>
                     </div>
                     <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all">
                        <X size={20} />
                     </button>
                </div>

                <div className="p-10">
                    <div 
                        ref={containerRef}
                        className="relative w-full aspect-square bg-slate-900 rounded-3xl overflow-hidden cursor-move touch-none mb-10 group"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Image Layer */}
                        <div 
                            className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
                            style={{ 
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` 
                            }}
                        >
                            <img 
                                ref={imgRef}
                                src={image} 
                                alt="To Crop" 
                                className="max-w-none max-h-none pointer-events-none select-none"
                                style={{
                                    width: '300px',
                                    height: 'auto'
                                }}
                            />
                        </div>

                        {/* Framing Overlay */}
                        <div className="absolute inset-0 pointer-events-none ring-[100px] ring-slate-900/80"></div>
                        <div className="absolute inset-0 pointer-events-none border-[1.5px] border-white/20 rounded-full m-[50px] shadow-[0_0_0_2000px_rgba(15,23,42,0.6)]"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-[300px] h-[300px] border-2 border-dashed border-white/40 rounded-full flex items-center justify-center">
                                  <Camera size={24} className="text-white/20" />
                             </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-6">
                            <ZoomOut size={18} className="text-slate-400" />
                            <input 
                                type="range" 
                                min="1" 
                                max="3" 
                                step="0.01"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="flex-1 accent-slate-900 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                            />
                            <ZoomIn size={18} className="text-slate-400" />
                        </div>

                        <div className="flex gap-4">
                             <button onClick={onClose} className="flex-1 py-4 px-6 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">
                                Cancel
                             </button>
                             <button onClick={handleSave} className="flex-[2] py-4 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 shadow-xl transition-all active:scale-95">
                                <Check size={16} /> Save Changes
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropModal;
