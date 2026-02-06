"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';

interface CopyCardProps {
  label: string;
  content: string;
  className?: string;
}

export function CopyCard({ label, content, className = '' }: CopyCardProps) {
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
      className={`group relative flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-[#FFC300] hover:shadow-md cursor-pointer ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
          copied ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400 group-hover:bg-[#FFC300]/10 group-hover:text-[#FFC300]'
        }`}>
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">复制</span>
            </>
          )}
        </div>
      </div>
      
      <p className="text-base font-medium text-gray-900 leading-relaxed break-words whitespace-pre-wrap">
        {content}
      </p>
      
      {/* Decorative bottom accent on hover */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#FFC300] transition-all duration-300 group-hover:w-full rounded-b-xl" />
    </div>
  );
}

export default CopyCard;
