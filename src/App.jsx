import React, { useState, useEffect } from 'react';
import { Upload, Camera, Sparkles, RefreshCw, Shirt, User, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * THAIS GUSMÃO - PROVADOR VIRTUAL IA
 * Instruções para integração com a Tray:
 * Use a URL: https://SEU-LINK-DA-VERCEL.app/?img={{ product.image }}
 */

const apiKey = "AIzaSyAkpURWPCfchIw1oVK9Ehn5x072FVpQ4Ew"; // Sua chave de API configurada

const App = () => {
  const [modelImage, setModelImage] = useState(null);
  const [garmentImage, setGarmentImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Captura automática da imagem do produto vinda da Tray
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imgUrl = urlParams.get('img');
    if (imgUrl) {
      setGarmentImage({ url: decodeURIComponent(imgUrl), isExternal: true });
    }
  }, []);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const urlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Erro ao carregar imagem externa:", err);
      return null;
    }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'model') setModelImage({ file, url });
      else setGarmentImage({ file, url, isExternal: false });
    }
  };

  const tryOnClothes = async () => {
    if (!modelImage || !garmentImage) {
      setStatus({ type: 'error', message: 'Por favor, envie a sua foto primeiro.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'A IA está a ajustar o look ao seu corpo...' });

    try {
      const modelBase64 = await fileToBase64(modelImage.file);
      let garmentBase64;
      
      if (garmentImage.isExternal) {
        garmentBase64 = await urlToBase64(garmentImage.url);
      } else {
        garmentBase64 = await fileToBase64(garmentImage.file);
      }
      
      if (!garmentBase64) throw new Error("Erro no processamento da imagem.");

      // Prompt otimizado para a marca Thais Gusmão
      const prompt = `FOTORREALISMO EXTREMO. Veste a roupa da imagem do produto na pessoa da imagem da modelo. Mantém a identidade da pessoa, luz natural de estúdio, estilo Thais Gusmão.`;

      const payload = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: modelBase64 } },
            { inlineData: { mimeType: "image/png", data: garmentBase64 } }
          ]
        }],
        generationConfig: { 
            responseModalities: ['TEXT', 'IMAGE'],
            temperature: 0.4
        }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const base64Image = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (base64Image) {
        setResultImage(`data:image/png;base64,${base64Image}`);
        setStatus({ type: 'success', message: 'Look gerado com sucesso!' });
      } else {
        throw new Error("Falha ao gerar imagem.");
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Ocorreu um problema técnico. Verifique sua chave de API ou conexão.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-widest">Provador Virtual</h1>
            <p className="text-gray-500 text-xs mt-1">Design & Inovação | Thais Gusmão</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="border border-gray-100 p-5 rounded-xl bg-gray-50">
              <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2"><User size={16}/> 1. Sua Foto</h3>
              <div className="relative h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white overflow-hidden hover:border-black transition-all">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'model')} accept="image/*" />
                {modelImage ? (
                    <img src={modelImage.url} className="h-full w-full object-cover" alt="Sua foto" />
                ) : (
                    <div className="text-center p-4">
                        <Camera className="mx-auto text-gray-300 mb-2" />
                        <p className="text-[10px] text-gray-400">Clique para enviar foto de corpo inteiro</p>
                    </div>
                )}
              </div>
            </div>

            <div className="border border-gray-100 p-5 rounded-xl bg-gray-50">
              <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2"><Shirt size={16}/> 2. Peça Selecionada</h3>
              <div className="h-32 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                {garmentImage ? (
                    <img src={garmentImage.url} className="h-full object-contain p-2" alt="Roupa" />
                ) : (
                    <p className="text-[10px] text-gray-400 italic">Nenhum produto selecionado</p>
                )}
              </div>
            </div>

            <button 
              onClick={tryOnClothes}
              disabled={loading}
              className="w-full bg-black text-white py-4 font-bold uppercase text-xs tracking-widest hover:opacity-80 transition-all disabled:bg-gray-300 flex items-center justify-center gap-3"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "Processando look..." : "Ver o look em mim"}
            </button>

            {status.message && (
              <div className={`p-3 text-[10px] text-center rounded-lg uppercase tracking-tight ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-black text-white'}`}>
                {status.message}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center min-h-[500px] relative overflow-hidden">
            {resultImage ? (
              <div className="p-4 flex flex-col items-center gap-4">
                 <img src={resultImage} className="max-h-[600px] rounded-lg shadow-2xl" alt="Resultado" />
              </div>
            ) : (
              <div className="text-center opacity-10">
                <Sparkles size={64} className="mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Resultado da IA</p>
              </div>
            )}
            
            {loading && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Criando seu visual...</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;