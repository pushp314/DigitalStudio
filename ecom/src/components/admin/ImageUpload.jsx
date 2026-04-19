import React, { useState, useRef } from 'react';
import api from '../../services/api';

const ImageUpload = ({ onUploadSuccess, currentImage, label = "Upload Image" }) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await api.post('/upload', formData);
            if (onUploadSuccess) {
                onUploadSuccess(response.filePath);
            }
        } catch (err) {
            console.error('R2 Transmission Failed:', err);
            alert('Failed to transmit asset to R2 storage.');
        } finally {
            setUploading(false);
        }
    };

    const onFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
            <div 
                className={`relative group h-40 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
                    dragActive ? 'border-primary bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
            >
                <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={onFileSelect}
                    accept="image/*"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Transmitting to R2...</p>
                    </div>
                ) : currentImage ? (
                    <div className="relative w-full h-full">
                        <img src={currentImage} className="w-full h-full object-cover rounded-[1.5rem]" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[1.5rem]">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full">Replace Asset</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl mb-1">🖼️</div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Drag & Drop or Click</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PNG, JPG, WEBP (Max 10MB)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
