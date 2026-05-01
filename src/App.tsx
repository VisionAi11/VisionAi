import { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Settings2, 
  History, 
  Download, 
  Trash2, 
  Expand, 
  ChevronRight,
  Loader2,
  RefreshCw,
  Maximize2,
  X,
  CreditCard,
  Zap,
  ShieldCheck,
  Pencil,
  Wand2,
  MessageSquare,
  Activity,
  Cpu,
  RefreshCcw,
  Binary,
  Layers
} from 'lucide-react';
import { geminiService } from './services/geminiService';
import { AspectRatio, GeneratedImage, STYLES, GenerationSettings, CREDIT_COSTS, ModelType } from './types';
import { ImageEditor } from './components/ImageEditor';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [credits, setCredits] = useState<number>(1000);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: '1:1',
    style: 'photorealistic',
    prompt: '',
    quality: 'standard',
    model: 'Vision Standard 1.1',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [textEditImage, setTextEditImage] = useState<GeneratedImage | null>(null);
  const [textEditPrompt, setTextEditPrompt] = useState('');
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('visionary_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    const savedCredits = localStorage.getItem('visionary_credits');
    if (savedCredits) {
      setCredits(parseInt(savedCredits, 10));
    }

    const savedPremium = localStorage.getItem('visionary_premium');
    if (savedPremium) {
      setIsPremium(savedPremium === 'true');
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('visionary_history', JSON.stringify(history));
  }, [history]);

  // Save credits to localStorage
  useEffect(() => {
    localStorage.setItem('visionary_credits', credits.toString());
  }, [credits]);

  // Save premium status
  useEffect(() => {
    localStorage.setItem('visionary_premium', isPremium.toString());
  }, [isPremium]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const cost = CREDIT_COSTS[settings.quality];
    if (credits < cost) {
      alert(`Insufficient credits! You need ${cost} credits for this generation.`);
      return;
    }

    setIsGenerating(true);
    setEnhancing(true);
    
    try {
      // 1. Enhance the prompt
      const enhancedPrompt = await geminiService.enhancePrompt(prompt, settings.style, settings.quality);
      setEnhancing(false);

      // 2. Generate the image
      const imageUrl = await geminiService.generateImage(enhancedPrompt, settings.aspectRatio, settings.quality);
      
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: enhancedPrompt,
        settings: { ...settings, prompt },
        createdAt: Date.now(),
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev].slice(0, 50)); 
      setCredits(prev => prev - cost);
    } catch (error) {
      alert("Failed to generate image. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
      setEnhancing(false);
    }
  };

  const updateModel = (model: ModelType) => {
    const quality = model === 'Vision Ultra 2.2' ? 'premium_2k' : 'standard';
    setSettings(s => ({ ...s, model, quality }));
  };

  const handleDownload = (img: GeneratedImage | string) => {
    const link = document.createElement('a');
    link.href = typeof img === 'string' ? img : img.url;
    link.download = `visionary-${typeof img === 'string' ? Date.now() : img.id}.png`;
    link.click();
  };

  const handleSaveEditedImage = (editedUrl: string) => {
    if (!editingImage) return;

    const newImage: GeneratedImage = {
      ...editingImage,
      id: crypto.randomUUID(),
      url: editedUrl,
      createdAt: Date.now(),
    };

    setHistory(prev => [newImage, ...prev].slice(0, 50));
    setCurrentImage(newImage);
    setEditingImage(null);
  };

  const handleTextEdit = async () => {
    if (!textEditImage || !textEditPrompt.trim()) return;

    const cost = CREDIT_COSTS[settings.quality];
    if (credits < cost) {
      alert(`Insufficient credits! You need ${cost} credits for this edit.`);
      return;
    }

    setIsTextEditing(true);
    try {
      const editedUrl = await geminiService.editImage(textEditImage.url, textEditPrompt, settings.quality);
      
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: editedUrl,
        prompt: `Edited: ${textEditPrompt}`,
        settings: { ...settings, prompt: textEditPrompt },
        createdAt: Date.now(),
      };

      setHistory(prev => [newImage, ...prev].slice(0, 50));
      setCurrentImage(newImage);
      setTextEditImage(null);
      setTextEditPrompt('');
      setCredits(prev => prev - cost);
    } catch (error) {
      alert("Failed to edit image with AI. Please try a different prompt.");
    } finally {
      setIsTextEditing(false);
    }
  };

  const handlePurchase = () => {
    if (isPremium) return;
    
    setShowShop(false);
    setShowSuccess(true);
    // Add 2000 credits
    setCredits(prev => prev + 2000);
    setIsPremium(true);
    
    // Hide success message after 4 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  const deleteFromHistory = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(img => img.id !== id));
    if (currentImage?.id === id) setCurrentImage(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-gray-100 flex flex-col selection:bg-brand-primary selection:text-black">
      {/* Background Grid */}
      <div className="fixed inset-0 technical-grid pointer-events-none opacity-20" />

      {/* Header */}
      <header className="relative z-10 border-bottom border-brand-border h-16 flex items-center px-6 justify-between glass-card backdrop-blur-xl">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-9 h-9 bg-brand-primary rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,255,0,0.3)] group-hover:rotate-12 transition-transform duration-500">
            <Sparkles className="text-black w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0 text-left">
            <h1 className="text-xl font-sans tracking-tight uppercase font-extrabold text-white leading-none">
              Visionary<span className="text-brand-primary">AI</span>
            </h1>
            <span className="text-[7px] font-mono text-white/30 uppercase tracking-[0.4em] mt-1 font-medium">Neural Interface v2.2</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Royal Credit Display - Enhanced visual separation */}
          <button 
            onClick={() => setShowShop(true)}
            className="flex items-center gap-5 px-5 py-2 bg-black/60 border border-royal-gold/20 rounded-xl hover:border-royal-gold/40 hover:bg-black/80 transition-all duration-500 group relative overflow-hidden"
          >
            {/* Subtle Inner Glow */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-royal-gold/20 to-transparent" />
            
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-mono text-gray-500 uppercase tracking-[0.4em] font-black mb-1 leading-none">Capital Assets</span>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-royal-gold/50 group-hover:text-royal-gold transition-colors" />
                <span className="text-xl font-serif font-bold royal-text-gradient tabular-nums leading-none">
                  {credits.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="w-[1px] h-7 bg-royal-gold/10" />

            <div className="flex flex-col items-start">
              <span className="text-[7px] font-mono text-gray-500 uppercase tracking-[0.4em] font-black mb-1 leading-none">Protocol</span>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-royal-gold animate-pulse shadow-[0_0_10px_#D4AF37]' : 'bg-white/10'}`} />
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest leading-none ${isPremium ? 'royal-text-gradient' : 'text-gray-700'}`}>
                  {isPremium ? 'Elite' : 'Basic'}
                </span>
              </div>
            </div>

            {/* Hover Indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-3 h-3 text-royal-gold/40" />
            </div>
          </button>

          {/* Separate Upgrade Kingdom Button */}
          {!isPremium && (
            <button 
              onClick={() => setShowShop(true)}
              className="flex items-center gap-3 px-6 py-2.5 bg-royal-gold text-black rounded-lg hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all group font-serif italic"
            >
              <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest leading-none">Upgrade Kingdom</span>
            </button>
          )}

          {isPremium && (
            <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg opacity-60">
              <ShieldCheck className="w-4 h-4 text-royal-gold" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold">Elite Protocol Active</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none">Premium Active</span>
          </div>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors relative"
          >
            <History className={`w-5 h-5 ${showHistory ? 'text-brand-primary' : 'text-gray-400'}`} />
            {history.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        {/* Left Sidebar: Controls */}
        <aside className="w-80 border-right border-brand-border flex flex-col p-6 z-20 glass-card bg-brand-bg/50 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8 text-xs font-mono text-gray-500 uppercase tracking-widest">
            <Settings2 className="w-3 h-3" />
            <span>Generation Parameters</span>
          </div>

          {/* Aspect Ratio */}
          <div className="mb-8">
            <label className="text-xs font-mono text-gray-400 mb-3 block uppercase">Canvas Ratio</label>
            <div className="grid grid-cols-5 gap-2">
              {(['1:1', '4:3', '3:4', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setSettings(s => ({ ...s, aspectRatio: ratio }))}
                  className={`aspect-square flex items-center justify-center border rounded-sm text-[10px] transition-all
                    ${settings.aspectRatio === ratio 
                      ? 'border-brand-primary text-brand-primary bg-brand-primary/10 shadow-[0_0_10px_rgba(0,255,0,0.2)]' 
                      : 'border-brand-border text-gray-500 hover:border-gray-400'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Style Presets */}
          <div className="mb-8">
            <label className="text-xs font-mono text-gray-400 mb-3 block uppercase">Artistic Style</label>
            <div className="space-y-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSettings(s => ({ ...s, style: style.id }))}
                  className={`w-full text-left p-3 rounded-sm border transition-all group
                    ${settings.style === style.id 
                      ? 'border-brand-primary bg-brand-primary/5' 
                      : 'border-brand-border hover:border-gray-600 bg-black/20'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium ${settings.style === style.id ? 'text-brand-primary' : 'text-gray-200'}`}>
                      {style.name}
                    </span>
                    {settings.style === style.id && <ChevronRight className="w-3 h-3 text-brand-primary" />}
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-top border-brand-border">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-tight">
              Engine: <span className="text-brand-primary">Visionary X-2</span><br />
              Status: <span className="text-green-500">Peak Performance</span>
            </p>
          </div>
        </aside>

        {/* Center: Generation Area */}
        <section className="flex-1 overflow-y-auto flex flex-col p-8 relative">
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
            
            {/* Display Area */}
            <div className="flex-1 flex items-center justify-center mb-8 min-h-[400px]">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 border-2 border-brand-primary/20 border-t-brand-primary rounded-full shadow-[0_0_20px_rgba(0,255,0,0.1)]"
                      />
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-brand-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-mono tracking-tight text-brand-primary">
                        {enhancing ? 'ANALYZING PROMPT...' : 'GENERATING VISION...'}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-1">ESTIMATED TIME: 5-10s</p>
                    </div>
                  </motion.div>
                ) : currentImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group w-full flex items-center justify-center p-4"
                  >
                    <div 
                      className="relative shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_50px_rgba(0,255,0,0.15)] overflow-hidden rounded-lg bg-black/40"
                      style={{ 
                        maxHeight: '70vh',
                        aspectRatio: currentImage.settings.aspectRatio.replace(':', '/') 
                      }}
                    >
                      <img 
                        src={currentImage.url} 
                        alt="Generated" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Overlay Actions Dock */}
                      <div className="absolute inset-x-0 bottom-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none group-hover:pointer-events-auto z-20">
                        <div className="flex items-center justify-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
                          <button 
                            onClick={() => setTextEditImage(currentImage)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-brand-primary/20 hover:text-brand-primary text-gray-300 rounded-xl transition-all group/btn"
                          >
                            <Wand2 className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">AI Edit</span>
                          </button>
                          
                          <button 
                            onClick={() => setEditingImage(currentImage)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-royal-gold/20 hover:text-royal-gold text-gray-300 rounded-xl transition-all group/btn"
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Studio</span>
                          </button>

                          <div className="w-[1px] h-6 bg-white/10 mx-1" />

                          <button 
                            onClick={() => setIsExpanded(true)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                            title="Expand View"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => handleDownload(currentImage)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-black rounded-xl hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] hover:scale-105 transition-all"
                          >
                            <Download className="w-4 h-4 stroke-[3px]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    className="text-center p-12 border-2 border-dashed border-brand-border rounded-xl flex flex-col items-center max-w-md"
                  >
                    <div className="w-16 h-16 bg-brand-surface rounded-full flex items-center justify-center mb-6 border border-brand-border">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Ready to Create?</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Enter a description below to generate your first professional vision. Start with something simple or be ultra-specific.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="mt-auto glass-card p-1 rounded-2xl border border-brand-border/50 shadow-2xl relative z-30 overflow-hidden">
              {/* Model Selector Sub-Bar */}
              <div className="flex items-center gap-1 p-2 border-bottom border-brand-border/50 bg-white/5">
                {(['Vision Standard 1.1', 'Vision Ultra 2.2'] as ModelType[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => updateModel(m)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-2
                      ${settings.model === m 
                        ? 'bg-brand-primary text-black font-bold shadow-[0_0_10px_rgba(0,255,0,0.2)]' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    {m === 'Vision Ultra 2.2' ? <ShieldCheck className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    {m}
                    {m === 'Vision Ultra 2.2' && <span className="ml-1 opacity-60 text-[8px]">PRO</span>}
                  </button>
                ))}
                
                <div className="ml-auto px-3 py-1 flex items-center gap-2">
                   <div className="text-[10px] font-mono text-gray-500 uppercase">Cost:</div>
                   <div className={`text-[11px] font-mono font-bold ${settings.quality === 'premium_2k' ? 'text-brand-primary' : 'text-gray-300'}`}>
                    {CREDIT_COSTS[settings.quality]} <span className="opacity-50 font-normal">CR</span>
                   </div>
                </div>
              </div>

              <div className="flex items-end gap-2 p-3">
                <div className="flex-1">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="Describe your vision (e.g., A cyberpunk city in rain, neon lights, photorealistic...)"
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-200 resize-none max-h-32 min-h-12 p-2 scrollbar-none"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || credits < CREDIT_COSTS[settings.quality]}
                  className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all
                    ${isGenerating || !prompt.trim() || credits < CREDIT_COSTS[settings.quality]
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-brand-primary text-black hover:bg-brand-primary/90 shadow-[0_0_20px_rgba(0,255,0,0.2)] hover:scale-105 active:scale-95'}`}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Generate</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Quick Suggestions */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['Cyberpunk City', 'Futuristic UI', 'Mountain Temple', 'Minimalist Logo', 'Portrait of a Robot'].map(s => (
                <button 
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1 text-[11px] font-mono text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5 border border-brand-border rounded-full transition-all"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Sidebar: History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-brand-surface border-left border-brand-border z-40 flex flex-col"
            >
              <div className="p-4 border-bottom border-brand-border flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Recent Vision History</span>
                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-white/10 rounded-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">History is empty</p>
                  </div>
                ) : (
                  history.map((img) => (
                    <div 
                      key={img.id}
                      onClick={() => setCurrentImage(img)}
                      className={`group relative rounded-lg border overflow-hidden p-2 cursor-pointer transition-all
                        ${currentImage?.id === img.id ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:border-gray-500 bg-black/40'}`}
                    >
                      <img 
                        src={img.url} 
                        className="w-full aspect-square object-cover rounded-sm mb-2"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-gray-400 line-clamp-2 italic">"{img.settings.prompt || img.prompt}"</p>
                      
                      {/* Bottom History Toolbar */}
                      <div className="absolute inset-x-0 bottom-0 p-2 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="flex items-center justify-center gap-1 p-1 bg-black/80 backdrop-blur-xl border border-white/5 rounded-lg shadow-xl">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setTextEditImage(img); }}
                            className="p-1.5 hover:bg-brand-primary/20 text-gray-500 hover:text-brand-primary rounded transition-all"
                            title="AI Edit"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingImage(img); }}
                            className="p-1.5 hover:bg-royal-gold/20 text-gray-500 hover:text-royal-gold rounded transition-all"
                            title="Manual Studio"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(img); }}
                            className="p-1.5 hover:bg-white/10 text-gray-500 hover:text-white rounded transition-all"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => deleteFromHistory(img.id, e)}
                            className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Expand Modal */}
      <AnimatePresence>
        {isExpanded && currentImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-sm"
          >
            <motion.button 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setIsExpanded(false)}
              className="absolute top-8 right-8 p-3 text-white hover:text-brand-primary transition-colors"
            >
              <X className="w-8 h-8" />
            </motion.button>

            <motion.div 
              layoutId="expanded-img"
              className="max-w-7xl max-h-[90vh] relative group"
            >
              <img 
                src={currentImage.url} 
                className="w-full h-full object-contain rounded-lg shadow-2xl shadow-brand-primary/5"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 inset-x-4 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div>
                  <p className="text-white text-sm font-medium line-clamp-1">{currentImage.prompt}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">Ratio: {currentImage.settings.aspectRatio} | Created: {new Date(currentImage.createdAt).toLocaleTimeString()}</p>
                </div>
                <button 
                  onClick={() => handleDownload(currentImage)}
                  className="flex items-center gap-2 bg-brand-primary text-black px-4 py-2 rounded-lg font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Ultra HD</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand Modal ... same as before */}

      {/* Credit Shop Modal */}
      <AnimatePresence>
        {showShop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg glass-card rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-brand-border/50"
            >
              <div className="p-6 border-bottom border-brand-border flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-mono tracking-tighter font-bold uppercase">Visionary Credit Hub</h3>
                <button onClick={() => setShowShop(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-8">
                <div className="bg-black/40 border border-royal-gold/30 rounded-2xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-royal-gold text-black text-[10px] font-bold uppercase tracking-widest rounded-bl-xl shadow-lg font-mono">Recommended</div>
                  
                  <div className="mb-8">
                    <h4 className="text-4xl font-serif font-medium mb-2 royal-text-gradient italic">Basic Royal Pack</h4>
                    <p className="text-gray-400 font-sans text-[11px] tracking-wide uppercase opacity-60">Unlock the full potential of Visionary AI</p>
                  </div>

                  <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-royal-gold/10 flex items-center justify-center shrink-0 border border-royal-gold/20">
                        <Zap className="w-5 h-5 text-royal-gold" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-bold tracking-tight">2,000 Generation Credits</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">Premium allotment for high-volume creation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-royal-gold/10 flex items-center justify-center shrink-0 border border-royal-gold/20">
                        <ShieldCheck className="w-5 h-5 text-royal-gold" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-bold tracking-tight">Vision Ultra 2.2 Pro Engine</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">Highest parameter model for superior details</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-royal-gold/10 flex items-center justify-center shrink-0 border border-royal-gold/20">
                        <Expand className="w-5 h-5 text-royal-gold" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-bold tracking-tight">Ultra HD 2K Output</p>
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mt-1">Sharp, large-scale images ready for print</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-8 p-5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.2em]">Total Investment</span>
                    <span className="text-3xl font-serif font-bold royal-text-gradient">₹299</span>
                  </div>

                  <button 
                    onClick={handlePurchase}
                    className="w-full py-5 bg-royal-gold text-black font-black rounded-xl hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                  >
                    <span>{isPremium ? 'Refill Credits' : 'Activate Plan'}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-center text-[10px] text-gray-600 mt-6 uppercase tracking-widest leading-relaxed">
                  One-time purchase • Credits never expire • Secure payment via Virtual Nexus Gateway
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Activation Animation overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-royal-dark overflow-hidden"
          >
            {/* Background Particles Simulation - Gold Dust */}
            <div className="absolute inset-0">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                    y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 100,
                    opacity: 0
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 0.8, 0],
                    scale: [0, Math.random() * 2, 0]
                  }}
                  transition={{ 
                    duration: 4 + Math.random() * 4, 
                    repeat: Infinity,
                    delay: Math.random() * 3
                  }}
                  className="absolute w-1 h-1 bg-royal-gold rounded-full blur-[1px]"
                />
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center z-10"
            >
              <motion.div 
                animate={{ 
                  boxShadow: ["0 0 20px rgba(212,175,55,0.2)", "0 0 80px rgba(212,175,55,0.5)", "0 0 20px rgba(212,175,55,0.2)"],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-28 h-28 border border-royal-gold bg-black rounded-full mx-auto flex items-center justify-center mb-10"
              >
                <ShieldCheck className="w-14 h-14 text-royal-gold" />
              </motion.div>
              
              <h2 className="text-8xl font-serif font-medium tracking-tight mb-6 royal-text-gradient">
                Royal Access <br /> Granted
              </h2>
              <p className="text-royal-gold font-mono tracking-[1em] text-xs uppercase mb-20 opacity-60">
                Nexus Excellence Protocol Initialized
              </p>

              <div className="flex justify-center gap-24">
                <div className="text-center group">
                  <p className="text-6xl font-serif font-light text-white mb-3 group-hover:royal-text-gradient transition-all">+2,000</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-mono font-bold">Credits Encrypted</p>
                </div>
                <div className="text-center group">
                  <p className="text-6xl font-serif font-light text-white mb-3 group-hover:royal-text-gradient transition-all">ULTRA</p>
                  <p className="text-[9px] text-royal-gold uppercase tracking-[0.4em] font-mono font-bold">Visionary Unlocked</p>
                </div>
              </div>
            </motion.div>

            {/* Scanning Glow - Gold */}
            <motion.div 
              initial={{ top: '-100%' }}
              animate={{ top: '200%' }}
              transition={{ duration: 3, ease: "linear", repeat: Infinity }}
              className="absolute inset-x-0 h-80 bg-royal-gold/5 blur-[120px] pointer-events-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {textEditImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg glass-card rounded-2xl overflow-hidden shadow-2xl border-white/10"
            >
              <div className="p-6 border-bottom border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-lg font-serif font-bold royal-text-gradient">AI Neural Edit</h3>
                </div>
                <button onClick={() => setTextEditImage(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-8 space-y-6 relative overflow-hidden">
                <AnimatePresence>
                  {isTextEditing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-8"
                    >
                      {/* Neural Grid Background */}
                      <div className="absolute inset-0 opacity-20 bg-technical-grid" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
                      
                      {/* Pulsing Neural Core */}
                      <div className="relative mb-12">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-brand-primary blur-[40px] rounded-full"
                        />
                        <div className="relative w-24 h-24 rounded-2xl border border-brand-primary/40 bg-black flex items-center justify-center shadow-[0_0_30px_rgba(0,255,0,0.2)]">
                          <Cpu className="w-10 h-10 text-brand-primary animate-pulse" />
                        </div>
                        
                        {/* Orbiting Particles */}
                        {[...Array(3)].map((_, i) => (
                          <motion.div 
                            key={i}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4 + i * 2, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-8 pointer-events-none"
                          >
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_10px_#00FF00]`} />
                          </motion.div>
                        ))}
                      </div>

                      <div className="text-center space-y-6 z-10 max-w-xs">
                        <div className="space-y-2">
                          <h4 className="text-xl font-serif font-bold text-white tracking-tight">Processing Neural Data</h4>
                          <p className="text-[9px] font-mono text-brand-primary uppercase tracking-[0.4em] font-black">Executing Sub-layer Synapse</p>
                        </div>

                        {/* High Tech Progress Bar */}
                        <div className="space-y-3">
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <motion.div 
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 8, ease: "easeInOut" }}
                              className="h-full bg-gradient-to-r from-brand-primary/40 via-brand-primary to-brand-primary/40 rounded-full shadow-[0_0_15px_rgba(0,255,0,0.5)]"
                            />
                          </div>
                          <div className="flex justify-between items-center px-1">
                            <div className="flex gap-2">
                              <Binary className="w-3 h-3 text-brand-primary" />
                              <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest leading-none">Quantum Vectoring</span>
                            </div>
                            <span className="text-[8px] font-mono text-brand-primary tabular-nums">EST. 8.4s</span>
                          </div>
                        </div>

                        {/* Real-time Data Stream */}
                        <div className="pt-4 border-top border-white/5">
                          <motion.div 
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="flex flex-col gap-1"
                          >
                            <div className="flex justify-between text-[6px] font-mono text-gray-600">
                              <span>SIG_LOAD: OK</span>
                              <span>PXL_BUFF: 1024KB</span>
                            </div>
                            <div className="flex justify-between text-[6px] font-mono text-gray-600">
                              <span>SYN_FREQ: 2.4GHz</span>
                              <span>ERR_STAT: 0.00%</span>
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Scanning Line overlay */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-[2px] bg-brand-primary/20 shadow-[0_0_15px_rgba(0,255,0,0.3)] z-50 pointer-events-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="aspect-square w-40 mx-auto rounded-lg overflow-hidden border border-white/10 shadow-xl">
                  <img src={textEditImage.url} className="w-full h-full object-cover" />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Modification Instruction</label>
                  <textarea 
                    value={textEditPrompt}
                    onChange={(e) => setTextEditPrompt(e.target.value)}
                    placeholder="e.g., Change the background to Mars, add a golden crown, make it look like a sketch..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-primary focus:ring-0 resize-none h-24"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase">Energy Cost</span>
                  <span className="text-sm font-bold text-brand-primary">{CREDIT_COSTS[settings.quality]} CR</span>
                </div>

                <button 
                  onClick={handleTextEdit}
                  disabled={isTextEditing || !textEditPrompt.trim()}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] text-xs transition-all
                    ${isTextEditing || !textEditPrompt.trim() 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : 'bg-brand-primary text-black hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] active:scale-95'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Transformation</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingImage && (
          <ImageEditor 
            imageUrl={editingImage.url}
            onClose={() => setEditingImage(null)}
            onSave={handleSaveEditedImage}
          />
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-top border-brand-border bg-brand-surface/20 flex items-center px-4 justify-between font-mono text-[9px] uppercase tracking-tighter text-gray-600">
        <div className="flex gap-4">
          <span>Visionary Core v1.0.4</span>
          <span>GPU Acceleration: Enabled</span>
          <span>Neural Engine: Online</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full" /> API: Responsive
          </span>
          <span>© 2026 Virtual Nexus Systems</span>
        </div>
      </footer>
    </div>
  );
}
