import React, { useState } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { ImageCard } from './ImageCard';
import { downloadAllImages, type ImageData } from '@/lib/download';

interface ImageSectionProps {
  images: ImageData[];
}

const LABELS: Record<number, string> = {
  1: "主文案配图",
  2: "品牌特色配图",
  3: "细节展示配图 1",
  4: "细节展示配图 2",
  5: "细节展示配图 3"
};

export function ImageSection({ images }: ImageSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBatchDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadAllImages(images);
    } catch (error) {
      console.error("Batch download failed", error);
      // In a real app, we might want to show a toast notification here
    } finally {
      setIsDownloading(false);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
            视觉资产
          </h2>
          <p className="text-[15px] text-[#86868b]">
            已生成 {images.length} 张高品质配图，可直接商用
          </p>
        </div>
        
        <button
          onClick={handleBatchDownload}
          disabled={isDownloading}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition-all hover:bg-black hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Package className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          )}
          <span>{isDownloading ? '正在打包...' : '批量下载全部'}</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img) => (
          <ImageCard
            key={img.index}
            index={img.index}
            imageUrl={img.imageUrl}
            mimeType={img.mimeType}
            aspectRatio={img.aspectRatio}
            label={LABELS[img.index] || `配图 ${img.index}`}
          />
        ))}
      </div>
    </section>
  );
}
