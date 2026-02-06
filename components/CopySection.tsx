"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';

interface BrandCopy {
  mainSlogan: string;
  subSlogan: string;
  featureTitle: string;
  featureContent: string;
  detailsTitle: string;
  details: Array<{ title: string; content: string }>;
}

interface CopySectionProps {
  brandCopy: BrandCopy;
}

// 单行文案项组件
function CopyLine({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      const success = await copyToClipboard(content);
      if (!success) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div 
      onClick={handleCopy}
      className="group flex items-start gap-3 py-3 px-4 -mx-4 rounded-xl hover:bg-gray-50/80 cursor-pointer transition-all duration-200"
    >
      <span className="text-[#0071e3] font-bold mt-0.5">·</span>
      <div className="flex-1">
        <span className="font-semibold text-[#1d1d1f]">{label}：</span>
        <span className="text-[#424245] leading-relaxed">{content}</span>
      </div>
      <div className={`flex-shrink-0 ml-2 p-1.5 rounded-full transition-all ${
        copied ? 'bg-green-100/80 text-green-600' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900'
      }`}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </div>
    </div>
  );
}

// 细节项组件
function DetailItem({ index, title, content }: { index: number; title: string; content: string }) {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  const copyText = async (text: string, setCopied: (val: boolean) => void) => {
    if (!text) return;
    try {
      const success = await copyToClipboard(text);
      if (!success) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="font-semibold text-[#1d1d1f] text-[15px]">- 细节 {index + 1}：</div>
      
      {/* 标题行 */}
      <div 
        onClick={(e) => { e.stopPropagation(); copyText(title, setCopiedTitle); }}
        className="group flex items-center gap-2 ml-6 py-1.5 px-3 -mx-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors"
      >
        <span className="text-[#86868b]">- 标题：</span>
        <span className="text-[#1d1d1f] font-medium">{title}</span>
        <div className={`ml-2 p-1 rounded-full transition-all ${
          copiedTitle ? 'bg-green-100/80 text-green-600' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900'
        }`}>
          {copiedTitle ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* 文案行 */}
      <div 
        onClick={(e) => { e.stopPropagation(); copyText(content, setCopiedContent); }}
        className="group flex items-start gap-2 ml-6 py-1.5 px-3 -mx-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors"
      >
        <span className="text-[#86868b] flex-shrink-0">- 文案：</span>
        <span className="text-[#424245] leading-relaxed">{content}</span>
        <div className={`ml-2 p-1 rounded-full transition-all ${
          copiedContent ? 'bg-green-100/80 text-green-600' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900'
        }`}>
          {copiedContent ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}

function CopySubLine({ prefix, content }: { prefix: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      const success = await copyToClipboard(content);
      if (!success) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      onClick={handleCopy}
      className="group flex items-center gap-2 py-1.5 px-3 -mx-3 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors"
    >
      <span className="text-[#86868b]">{prefix}</span>
      <span className="text-[#1d1d1f] font-medium">{content}</span>
      <div className={`ml-2 p-1 rounded-full transition-all ${
        copied ? 'bg-green-100/80 text-green-600' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900'
      }`}>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
}

export function CopySection({ brandCopy }: CopySectionProps) {
  return (
    <div className="w-full">
      <div className="space-y-2 font-sans text-[15px] leading-relaxed">
        <CopyLine label="主文案" content={brandCopy.mainSlogan} />
        <CopyLine label="副文案" content={brandCopy.subSlogan} />
        <CopyLine label="品牌特色标题" content={brandCopy.featureTitle} />
        <CopyLine label="品牌亮点文案" content={brandCopy.featureContent} />
        
        <div className="pt-6">
          <div className="flex items-center gap-3 py-2 px-4 -mx-4">
            <span className="text-[#0071e3] font-bold">·</span>
            <span className="font-semibold text-[#1d1d1f]">细节展示板块：</span>
          </div>
          
          <div className="ml-4 space-y-6 mt-2">
            <CopySubLine prefix="- 总标题：" content={brandCopy.detailsTitle || '详细卖点'} />
            
            {brandCopy.details.map((detail, index) => (
              <DetailItem 
                key={index} 
                index={index} 
                title={detail.title} 
                content={detail.content} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CopySection;
