
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TemplateGallery } from './components/TemplateGallery';
import { MemeState } from './types';
import { getMagicCaptions, editImageWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [meme, setMeme] = useState<MemeState>({
    image: 'https://picsum.photos/seed/meme-default/600/400',
    topText: 'WHEN THE AI',
    bottomText: 'GENERATES THE PERFECT MEME',
    fontSize: 32,
    fontColor: '#ffffff',
  });

  const [magicCaptions, setMagicCaptions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'customize' | 'ai'>('templates');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redraw canvas whenever meme state changes
  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !meme.image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = meme.image;
    img.onload = () => {
      // Set canvas size to match image or reasonable max
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Text styling
      ctx.fillStyle = meme.fontColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = canvas.width / 150;
      ctx.textAlign = 'center';
      const fontSizePx = (meme.fontSize / 100) * canvas.width;
      ctx.font = `900 ${fontSizePx}px Impact`;

      // Top Text
      ctx.textBaseline = 'top';
      const topWords = meme.topText.toUpperCase().split(' ');
      const topY = 20;
      ctx.strokeText(meme.topText.toUpperCase(), canvas.width / 2, topY);
      ctx.fillText(meme.topText.toUpperCase(), canvas.width / 2, topY);

      // Bottom Text
      ctx.textBaseline = 'bottom';
      const bottomY = canvas.height - 20;
      ctx.strokeText(meme.bottomText.toUpperCase(), canvas.width / 2, bottomY);
      ctx.fillText(meme.bottomText.toUpperCase(), canvas.width / 2, bottomY);
    };
  }, [meme]);

  useEffect(() => {
    drawMeme();
  }, [drawMeme]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMeme(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMagicCaption = async () => {
    if (!meme.image) return;
    setIsAnalyzing(true);
    setMagicCaptions([]);
    try {
      const captions = await getMagicCaptions(meme.image);
      setMagicCaptions(captions);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIEdit = async () => {
    if (!meme.image || !editPrompt) return;
    setIsEditing(true);
    try {
      const editedUrl = await editImageWithAI(meme.image, editPrompt);
      if (editedUrl) {
        setMeme(prev => ({ ...prev, image: editedUrl }));
        setEditPrompt('');
        alert("Image edited successfully!");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to edit image. Try a different prompt.");
    } finally {
      setIsEditing(false);
    }
  };

  const downloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'memegenius-meme.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">MemeGenius <span className="text-blue-500">AI</span></h1>
          </div>
          <button 
            onClick={downloadMeme}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
        
        {/* Left: Preview Area */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-black/50 rounded-2xl p-4 md:p-8 flex items-center justify-center min-h-[400px] border border-gray-800 shadow-2xl relative group overflow-hidden">
             <canvas 
              ref={canvasRef} 
              className="max-w-full h-auto rounded shadow-lg transition-transform" 
            />
            {!meme.image && (
              <div className="text-center">
                <p className="text-gray-400 mb-4">No image selected</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 px-6 py-2 rounded-full font-bold"
                >
                  Upload Image
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeTab === 'templates' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              🔥 Templates
            </button>
            <button 
              onClick={() => setActiveTab('customize')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeTab === 'customize' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              🎨 Customize
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              🤖 AI Magic
            </button>
          </div>
        </div>

        {/* Right: Controls Area */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-6">
            
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Pick a Template</h3>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-400 text-sm hover:underline"
                  >
                    Upload Own
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
                <TemplateGallery onSelect={(url) => setMeme(prev => ({ ...prev, image: url }))} />
              </div>
            )}

            {activeTab === 'customize' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg">Meme Text</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Top Text</label>
                    <input 
                      type="text" 
                      value={meme.topText}
                      onChange={(e) => setMeme(prev => ({ ...prev, topText: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="TOP TEXT"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Bottom Text</label>
                    <input 
                      type="text" 
                      value={meme.bottomText}
                      onChange={(e) => setMeme(prev => ({ ...prev, bottomText: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="BOTTOM TEXT"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Size</label>
                    <input 
                      type="range" 
                      min="10" max="100" 
                      value={meme.fontSize}
                      onChange={(e) => setMeme(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Color</label>
                    <div className="flex gap-2">
                      {['#ffffff', '#ffff00', '#ff0000', '#00ff00', '#00ffff'].map(color => (
                        <button
                          key={color}
                          onClick={() => setMeme(prev => ({ ...prev, fontColor: color }))}
                          className={`w-6 h-6 rounded-full border-2 ${meme.fontColor === color ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Magic Caption Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h3 className="font-bold text-lg">Magic Caption</h3>
                  </div>
                  <p className="text-xs text-gray-400">Gemini Pro will analyze your image and suggest the funniest captions.</p>
                  
                  <button 
                    onClick={handleMagicCaption}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 p-4 rounded-xl font-black text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3"
                  >
                    {isAnalyzing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {isAnalyzing ? 'Analyzing Image...' : 'GENERATE MAGIC CAPTIONS'}
                  </button>

                  {magicCaptions.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mt-4 animate-in fade-in zoom-in-95">
                      {magicCaptions.map((cap, i) => (
                        <button
                          key={i}
                          onClick={() => setMeme(prev => ({ ...prev, bottomText: cap, topText: '' }))}
                          className="text-left bg-gray-900 hover:bg-gray-700 p-3 rounded-lg text-sm border border-gray-700 hover:border-blue-500 transition-all group flex justify-between items-center"
                        >
                          <span className="flex-1 italic">"{cap}"</span>
                          <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Apply →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="border-gray-700" />

                {/* AI Edit Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎨</span>
                    <h3 className="font-bold text-lg">AI Image Edit</h3>
                  </div>
                  <p className="text-xs text-gray-400">Use Gemini Flash to edit the actual image! Try "Add a cowboy hat" or "Make it retro".</p>
                  
                  <div className="relative">
                    <textarea 
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="e.g. Add a red sports car in the background..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                    />
                  </div>

                  <button 
                    onClick={handleAIEdit}
                    disabled={isEditing || !editPrompt}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
                  >
                    {isEditing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                    {isEditing ? 'Working Magic...' : 'Apply Image Edit'}
                  </button>
                </div>

              </div>
            )}
          </div>

          <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-2xl">
            <h4 className="text-blue-400 font-bold text-xs uppercase mb-1">Pro Tip</h4>
            <p className="text-sm text-gray-300">
              For best results with Magic Caption, use clear images with visible subjects or expressive faces.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-gray-800/50 p-6 text-center text-gray-500 text-sm border-t border-gray-800 mt-auto">
        <p>© 2024 MemeGenius AI • Powered by Gemini 3 Pro & 2.5 Flash</p>
      </footer>
    </div>
  );
};

export default App;
