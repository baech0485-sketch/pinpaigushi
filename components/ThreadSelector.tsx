"use client";

import { useEffect, useState } from 'react';
import type {
  BrandStoryThreadAvailability,
  BrandStoryThreadId,
} from '@/lib/brand-story-types';

interface ThreadSelectorProps {
  value: BrandStoryThreadId;
  onChange: (threadId: BrandStoryThreadId) => void;
}

const DEFAULT_AVAILABILITY: BrandStoryThreadAvailability = {
  thread1: {
    available: true,
    name: '线路1',
    description: 'yunwu-API',
  },
  thread2: {
    available: true,
    name: '线路2',
    description: '糖果-API',
  },
  thread3: {
    available: true,
    name: '线路3',
    description: '向量-API',
  },
};

export default function ThreadSelector({ value, onChange }: ThreadSelectorProps) {
  const [availability, setAvailability] = useState<BrandStoryThreadAvailability>(DEFAULT_AVAILABILITY);

  useEffect(() => {
    fetch('/api/brand-story-threads')
      .then((response) => response.json())
      .then((data) => setAvailability(data))
      .catch(() => {
        setAvailability(DEFAULT_AVAILABILITY);
      });
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-[#1d1d1f]">选择生成线路</p>
        <p className="text-sm text-[#86868b]">文案和图片会同时使用所选线路生成</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(['thread1', 'thread2', 'thread3'] as BrandStoryThreadId[]).map((threadId) => {
          const item = availability[threadId];
          const selected = value === threadId;

          return (
            <button
              key={threadId}
              type="button"
              disabled={!item.available}
              onClick={() => onChange(threadId)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-lg shadow-[#0071e3]/10'
                  : 'border-gray-200/80 bg-white/60 hover:border-gray-300'
              } ${!item.available ? 'cursor-not-allowed opacity-45' : ''}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1d1d1f]">{item.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.available ? '可用' : '未配置'}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#86868b]">{item.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
