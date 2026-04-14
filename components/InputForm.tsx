"use client";

import React, { useState } from 'react';
import { Store, Tag, Loader2, Sparkles } from 'lucide-react';
import ThreadSelector from '@/components/ThreadSelector';
import type { BrandStoryThreadId } from '@/lib/brand-story-types';

interface InputFormProps {
  onSubmit: (data: { storeName: string; category: string; threadId: BrandStoryThreadId }) => void;
  isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [threadId, setThreadId] = useState<BrandStoryThreadId>('thread1');
  const [errors, setErrors] = useState<{ storeName?: string; category?: string }>({});

  const validate = () => {
    const newErrors: { storeName?: string; category?: string } = {};
    let isValid = true;

    if (!storeName.trim()) {
      newErrors.storeName = '请输入店铺名称';
      isValid = false;
    } else if (storeName.length < 2 || storeName.length > 20) {
      newErrors.storeName = '店铺名称长度需在 2-20 个字符之间';
      isValid = false;
    }

    if (!category.trim()) {
      newErrors.category = '请输入经营品类';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ storeName, category, threadId });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-black/[0.03] p-8 border border-white/50 transition-all duration-300 hover:shadow-black/[0.06]">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Store Name Input */}
        <div className="space-y-3">
          <label 
            htmlFor="storeName" 
            className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2.5"
          >
            <div className="p-1.5 bg-gray-100/80 rounded-lg text-gray-900">
              <Store className="w-4 h-4" />
            </div>
            店铺名称
          </label>
          <div className="relative group">
            <input
              id="storeName"
              name="storeName"
              type="text"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (errors.storeName) setErrors({ ...errors, storeName: undefined });
              }}
              placeholder="请输入店铺名称"
              className={`w-full px-5 py-4 bg-white/50 border rounded-2xl outline-none transition-all duration-300 
                placeholder:text-gray-400 text-[#1d1d1f] font-medium text-[15px]
                ${errors.storeName 
                  ? 'border-red-200 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100/20' 
                  : 'border-gray-200/80 hover:border-gray-300 focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10'
                }
              `}
              disabled={isLoading}
            />
          </div>
          {errors.storeName && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200 pl-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {errors.storeName}
            </p>
          )}
        </div>

        {/* Category Input */}
        <div className="space-y-3">
          <label 
            htmlFor="category" 
            className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2.5"
          >
            <div className="p-1.5 bg-gray-100/80 rounded-lg text-gray-900">
              <Tag className="w-4 h-4" />
            </div>
            经营品类
          </label>
          <div className="relative group">
            <input
              id="category"
              name="category"
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors({ ...errors, category: undefined });
              }}
              placeholder="请输入经营品类，如：麻辣烫、火锅"
              className={`w-full px-5 py-4 bg-white/50 border rounded-2xl outline-none transition-all duration-300 
                placeholder:text-gray-400 text-[#1d1d1f] font-medium text-[15px]
                ${errors.category 
                  ? 'border-red-200 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100/20' 
                  : 'border-gray-200/80 hover:border-gray-300 focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10'
                }
              `}
              disabled={isLoading}
            />
          </div>
          {errors.category && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200 pl-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {errors.category}
            </p>
          )}
        </div>

        <ThreadSelector value={threadId} onChange={setThreadId} />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative overflow-hidden bg-[#1d1d1f] hover:bg-black text-white font-semibold py-4 px-6 rounded-2xl 
            shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.01]
            active:scale-[0.99]
            transition-all duration-300 
            disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
            flex items-center justify-center gap-2.5 group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white/70" />
              <span className="text-white/90">正在生成...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
              <span>生成品牌故事</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
