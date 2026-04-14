export interface BrandCopyDetail {
  title: string;
  content: string;
}

export interface BrandCopy {
  mainSlogan: string;
  subSlogan: string;
  featureTitle: string;
  featureContent: string;
  detailsTitle: string;
  details: BrandCopyDetail[];
}

export type BrandStoryThreadId = 'thread1' | 'thread2' | 'thread3';
export type BrandStoryThreadProtocol = 'gemini' | 'openai';

export interface BrandStoryThreadAvailabilityItem {
  available: boolean;
  name: string;
  description: string;
}

export interface BrandStoryThreadAvailability {
  thread1: BrandStoryThreadAvailabilityItem;
  thread2: BrandStoryThreadAvailabilityItem;
  thread3: BrandStoryThreadAvailabilityItem;
}
