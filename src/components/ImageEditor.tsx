import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCw, 
  Crop, 
  Check, 
  Download,
  Sun,
  Contrast,
  Palette,
  Cloudy
} from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (editedUrl: string) => void;
}

interface Filters {
  brightness: number;
  contrast: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onClose, onSave }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  });

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    filters: Filters
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set canvas size to the bounding box of the rotated image
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Apply filters to canvas
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;

    // Translate canvas context to a central point and rotate
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    // Now extract the cropped area
    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    // Set canvas width to final desired crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Paste image data at the beginning of the context
    ctx.putImageData(data, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    });
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;

    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleApply = async () => {
    if (croppedAreaPixels) {
      const editedImageUrl = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation,
        filters
      );
      onSave(editedImageUrl);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <div className="w-full max-w-6xl h-[85vh] flex flex-col glass-card border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-bottom border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-royal-gold/10 flex items-center justify-center">
              <Crop className="w-5 h-5 text-royal-gold" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold royal-text-gradient">Image Studio</h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Refine your neural generation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Area */}
          <div className="flex-1 relative bg-[#050505] p-12">
            <div className="absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
            
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-technical-grid">
              {isCropping ? (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: { background: 'black' },
                    cropAreaStyle: { border: '2px solid #D4AF37' }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img 
                    src={imageUrl} 
                    style={{
                      transform: `rotate(${rotation}deg) scale(${zoom})`,
                      filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`
                    }}
                    className="max-w-full max-h-full object-contain transition-all duration-300 shadow-2xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="w-80 border-left border-white/5 p-8 flex flex-col overflow-y-auto bg-black/40 backdrop-blur-sm">
            <div className="space-y-10">
              {/* Tool Selector */}
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-4 block">Operation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setIsCropping(true)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all border ${isCropping ? 'bg-royal-gold/10 border-royal-gold/40 text-royal-gold' : 'bg-white/5 border-white/5 text-gray-500'}`}
                  >
                    <Crop className="w-4 h-4" />
                    <span className="text-xs font-bold font-serif">Transform</span>
                  </button>
                  <button 
                    onClick={() => setIsCropping(false)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all border ${!isCropping ? 'bg-royal-gold/10 border-royal-gold/40 text-royal-gold' : 'bg-white/5 border-white/5 text-gray-500'}`}
                  >
                    <Palette className="w-4 h-4" />
                    <span className="text-xs font-bold font-serif">Filtering</span>
                  </button>
                </div>
              </div>

              {isCropping ? (
                <div className="space-y-10">
                  {/* Rotation */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Orientation</label>
                      <span className="text-[10px] font-mono text-royal-gold">{rotation}°</span>
                    </div>
                    <button 
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group"
                    >
                      <RotateCw className="w-5 h-5 text-gray-400 group-hover:text-royal-gold group-hover:rotate-90 transition-all" />
                      <span className="text-sm font-bold font-serif">Rotate 90°</span>
                    </button>
                  </div>

                  {/* Zoom */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Neural Zoom</label>
                      <span className="text-[10px] font-mono text-royal-gold">{zoom.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-royal-gold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Filters */}
                  {[
                    { key: 'brightness', icon: Sun, label: 'Exposure' },
                    { key: 'contrast', icon: Contrast, label: 'Contrast' },
                    { key: 'blur', icon: Cloudy, label: 'Diffuse', max: 20 },
                    { key: 'sepia', icon: Palette, label: 'Heritage', max: 100 },
                    { key: 'grayscale', icon: Palette, label: 'Monochrome', max: 100 }
                  ].map((filter) => (
                    <div key={filter.key}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <filter.icon className="w-3.5 h-3.5 text-gray-500" />
                          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">{filter.label}</label>
                        </div>
                        <span className="text-[10px] font-mono text-royal-gold">
                          {filters[filter.key as keyof Filters]}{filter.key === 'blur' ? 'px' : '%'}
                        </span>
                      </div>
                      <input 
                        type="range"
                        value={filters[filter.key as keyof Filters]}
                        min={0}
                        max={filter.max || 200}
                        onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: Number(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-royal-gold"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-10 mt-auto space-y-4">
                <button 
                  onClick={handleApply}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-royal-gold text-black rounded-2xl hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40 opacity-50" />
                  <Check className="w-5 h-5 stroke-[3px]" />
                  <span className="text-xs font-black uppercase tracking-[0.3em]">Finalize Edits</span>
                </button>
                <p className="text-[9px] font-mono text-gray-700 text-center uppercase tracking-widest leading-relaxed">
                  Lossless output processing • AI Metadata preserved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
