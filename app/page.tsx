"use client";

import React, { useState } from "react";
import InputForm from "@/components/InputForm";
import CopySection from "@/components/CopySection";
import { ImageSection } from "@/components/ImageSection";
import { ImageData } from "@/lib/download";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

// Define BrandCopy interface matching the one in CopySection
interface BrandCopy {
  mainSlogan: string;
  subSlogan: string;
  featureTitle: string;
  featureContent: string;
  detailsTitle: string;
  details: Array<{ title: string; content: string }>;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'text' | 'images' | 'done'>('idle');
  const [brandCopy, setBrandCopy] = useState<BrandCopy | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (data: { storeName: string; category: string }) => {
    setIsLoading(true);
    setStep('text');
    setError(null);
    setBrandCopy(null);
    setImages([]);

    try {
      // 1. Generate Text
      const textRes = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!textRes.ok) {
        throw new Error('生成文案失败，请稍后重试');
      }

      const textData = await textRes.json();
      setBrandCopy(textData);
      setStep('images');

      // 2. Generate Images
      const imageRes = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          brandCopy: textData,
        }),
      });

      if (!imageRes.ok) {
        throw new Error('生成配图失败，请稍后重试');
      }

      const imageData = await imageRes.json();
      setImages(imageData.images || []);
      setStep('done');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '发生未知错误');
      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1d1d1f]">
      <main className="container mx-auto px-6 py-16 max-w-5xl space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            美团品牌故事生成器
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto font-light">
            一键生成专业的外卖店铺品牌文案与配套视觉素材，助力店铺销量提升
          </p>
        </div>

        {/* Input Section */}
        <section className="max-w-xl mx-auto">
          <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
        </section>

        {/* Status / Error Message */}
        <div className="max-w-xl mx-auto text-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-6 animate-in fade-in slide-in-from-bottom-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
              <p className="text-[#86868b] font-medium text-lg">
                {step === 'text' && "正在构思品牌文案..."}
                {step === 'images' && "正在设计视觉配图... (1/5)"}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-3 p-4 bg-red-50/50 text-red-600 rounded-2xl border border-red-100/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-2 p-1.5 hover:bg-red-100/50 rounded-full transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        {(brandCopy || images.length > 0) && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d2d2d7] to-transparent opacity-50" />
            
            {/* Copy Section */}
            {brandCopy && (
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 shadow-2xl shadow-black/[0.03] border border-white/50">
                <CopySection brandCopy={brandCopy} />
              </div>
            )}

            {/* Image Section */}
            {images.length > 0 && (
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 shadow-2xl shadow-black/[0.03] border border-white/50">
                <ImageSection images={images} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[#d2d2d7]/30 bg-[#F5F5F7]/80 backdrop-blur-md">
        <div className="container mx-auto max-w-5xl px-6 py-8 text-center">
          <p className="text-sm font-medium tracking-wide text-[#86868b]">
            呈尚策划
          </p>
        </div>
      </footer>
    </div>
  );
}
