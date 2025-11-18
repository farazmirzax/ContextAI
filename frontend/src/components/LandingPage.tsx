import { useState } from 'react';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export function LandingPage({ onFileUpload, isLoading }: LandingPageProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-hidden">
      {/* Animated Code Matrix Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        ></div>
        
        {/* Layer 1: Slow moving code */}
        <div className="code-layer-1">
          <div className="code-line code-line-1">0x7F4A2E1B → neural_pathway.activate()</div>
          <div className="code-line code-line-2">λ(φ) = ∑ωᵢχᵢ + β → consciousness.evolve()</div>
          <div className="code-line code-line-3">tensor_flow: [0.94, 0.87, 0.92] ⟶ embedding_space</div>
          <div className="code-line code-line-4">MEMORY_BANK::contextual_recall(query_hash)</div>
          <div className="code-line code-line-5">∇f(x) → gradient_descent(loss: 0.001247)</div>
          <div className="code-line code-line-6">THREAD_001: semantic_similarity.compute()</div>
        </div>
        
        {/* Layer 2: Medium speed */}
        <div className="code-layer-2">
          <div className="code-line code-line-7">│ │ ┌─ vector_db.query(dim=1536)</div>
          <div className="code-line code-line-8">▓▓▒░ transformer.attention_heads[12]</div>
          <div className="code-line code-line-9">NEURAL_NET::forward_pass() → [HIDDEN_LAYERS]</div>
          <div className="code-line code-line-10">entropy: 0.7845 | perplexity: 12.34</div>
          <div className="code-line code-line-11">▲ knowledge_graph.traverse(node_0x4A7)</div>
        </div>
        
        {/* Layer 3: Fast moving */}
        <div className="code-layer-3">
          <div className="code-line code-line-12">●●○○ quantum_state |ψ⟩ = α|0⟩ + β|1⟩</div>
          <div className="code-line code-line-13">CIPHER: 4F52 41434C45 2044 4154</div>
          <div className="code-line code-line-14">█▌▐ deep_learning.backprop() ← δ</div>
          <div className="code-line code-line-15">tokenizer.encode() → [2341, 5879, 1247]</div>
          <div className="code-line code-line-16">AI_CORE.temperature = 0.7 | top_p = 0.9</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl">
          {/* Main Title - Codex Style */}
          <h1 className="text-8xl md:text-9xl font-light mb-8 tracking-wider">
            <span className="text-white">
              ContextAI
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-400 mb-6 font-light tracking-wide">
            Your Intelligent Document Assistant
          </p>
          
          {/* Description */}
          <p className="text-gray-500 text-lg mb-16 max-w-2xl mx-auto leading-relaxed font-light">
            Transform how you interact with documents. Upload any PDF and start having intelligent conversations powered by advanced AI technology.
          </p>

          {/* Features - Minimal Style */}
          <div className="flex justify-center gap-12 mb-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-2">⚡</div>
              <p className="text-gray-400 text-sm font-light">Lightning Fast</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-2">🧠</div>
              <p className="text-gray-400 text-sm font-light">Smart Memory</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-2">🔒</div>
              <p className="text-gray-400 text-sm font-light">Secure & Private</p>
            </div>
          </div>
        </div>

        {/* Upload Section - Codex Style */}
        <div className="w-full max-w-xl">
          <div 
            className={`
              relative border border-gray-800 rounded-lg p-16 text-center transition-all duration-300
              ${isDragOver 
                ? 'border-gray-600 bg-gray-900/50' 
                : 'border-gray-800 hover:border-gray-700 bg-gray-950/50'
              }
              ${isLoading ? 'pointer-events-none opacity-50' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b border-gray-400 mb-4"></div>
                <p className="text-gray-400 text-lg font-light">Processing document...</p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="text-2xl font-light text-white mb-3">Upload PDF</h3>
                  <p className="text-gray-500 font-light">Drag and drop or click to browse</p>
                </div>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-8 py-3 bg-white text-black font-medium rounded hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose File
                </label>

                <p className="text-gray-600 text-sm mt-6 font-light">
                  PDF files up to 10MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-gray-600 text-sm font-light">
            Powered by advanced AI
          </p>
        </div>
      </div>
    </div>
  );
}