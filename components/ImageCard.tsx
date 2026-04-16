import React from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { downloadImage } from '@/lib/download';
import { toCssAspectRatio } from '@/lib/aspect-ratio';

interface ImageCardProps {
  index: number;        // 1-5
  imageUrl: string;
  mimeType: string;
  aspectRatio: string;
  label: string;        // 如"主文案配图"
}

export function ImageCard({ index, imageUrl, mimeType, aspectRatio, label }: ImageCardProps) {
  const handleDownload = async () => {
    const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : (mimeType.split('/')[1] || 'jpg');
    await downloadImage(imageUrl, `${index}.${extension}`, mimeType);
  };

  const cssAspectRatio = toCssAspectRatio(aspectRatio);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative w-full overflow-hidden bg-gray-50" style={{ aspectRatio: cssAspectRatio }}>
        <Image
          src={imageUrl}
          alt={label}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Floating Download Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
           <button 
            onClick={handleDownload}
            className="transform translate-y-4 group-hover:translate-y-0 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-6 py-3 text-sm font-semibold text-[#1d1d1f] shadow-xl transition-all hover:bg-white hover:scale-105 active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>下载原图</span>
          </button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between bg-white p-5 border-t border-gray-50">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">
            Image 0{index}
          </span>
          <span className="text-[15px] font-medium text-[#1d1d1f]">
            {label}
          </span>
        </div>
        
        {/* Mobile Download Button (Visible only on small screens) */}
        <button 
          onClick={handleDownload}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-[#86868b] ring-1 ring-black/5 transition-colors hover:bg-gray-100 hover:text-[#1d1d1f] md:hidden"
          aria-label="Download image"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
