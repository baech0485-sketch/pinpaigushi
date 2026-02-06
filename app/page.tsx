"use client";

import React, { useState } from "react";
import InputForm from "@/components/InputForm";
import CopySection from "@/components/CopySection";
import { ImageSection } from "@/components/ImageSection";
import { ImageData } from "@/lib/download";
import { copyToClipboard } from "@/lib/clipboard";
import { Loader2, AlertCircle, RefreshCw, Copy, Check } from "lucide-react";

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
  const [strategyCopied, setStrategyCopied] = useState(false);

  const strategyText = `我们已为您创建"品牌故事"，这不只是简介，而是连接顾客心灵的情感桥梁。市场研究表明，情感连接是顾客忠诚度的首要驱动力：
战略价值
信任基石：透明展示您的品牌理念、食材来源和制作工艺，建立深层信任关系
差异化定位：在千篇一律的外卖市场中，独特的品牌故事为您创造不可复制的竞争壁垒
情感资产：品牌故事能触发顾客共鸣，将一次性消费者转化为品牌拥护者
高端感知：专业的品牌叙事提升顾客对产品价值的感知，支持更健康的定价策略
社区归属感：分享您的创业历程和匠心理念，让顾客感到参与品牌成长的满足感`;

  const handleCopyStrategyText = async () => {
    const success = await copyToClipboard(strategyText);
    if (!success) return;
    setStrategyCopied(true);
    setTimeout(() => setStrategyCopied(false), 2000);
  };

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

      <section className="container mx-auto max-w-5xl px-6 pb-10">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-6 md:p-8 shadow-2xl shadow-black/[0.03] border border-white/50">
          <div
            onClick={handleCopyStrategyText}
            className="group cursor-pointer rounded-2xl border border-[#d2d2d7]/40 bg-white/70 px-5 py-5 transition-all hover:border-[#0071e3]/35 hover:shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-[#86868b]">品牌故事战略价值（点击复制）</p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  strategyCopied
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-[#f5f5f7] text-[#86868b] group-hover:bg-[#0071e3]/10 group-hover:text-[#0071e3]"
                }`}
              >
                {strategyCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {strategyCopied ? "已复制" : "复制文案"}
              </span>
            </div>
            <p className="whitespace-pre-line text-[15px] leading-7 text-[#1d1d1f]">{strategyText}</p>
          </div>
        </div>
      </section>

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
