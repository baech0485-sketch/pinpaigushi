import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  resolveBrandStoryThreadRuntimeConfig,
} from '@/lib/brand-story-threads';
import {
  buildBrandStorySystemPrompt,
  parseBrandCopy,
} from '@/lib/brand-story-text';
import {
  buildBrandStoryTextApiRequest,
  extractBrandStoryTextFromResponse,
} from '@/lib/brand-story-clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 400;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeName, category, threadId } = body;

    if (!storeName || typeof storeName !== 'string' || storeName.length < 2 || storeName.length > 20) {
      return NextResponse.json(
        { error: '店铺名称必须为2-20个字符' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { error: '经营品类不能为空' },
        { status: 400 }
      );
    }

    const promptPath = path.join(process.cwd(), 'prompt.md');
    let systemPrompt: string;

    try {
      systemPrompt = fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
      console.error('读取 prompt.md 失败:', error);
      return NextResponse.json(
        { error: '系统配置错误' },
        { status: 500 }
      );
    }

    const threadConfig = resolveBrandStoryThreadRuntimeConfig(threadId);
    if (!threadConfig.textApiKey) {
      console.error(`${threadConfig.name} 文案线路未配置`);
      return NextResponse.json(
        { error: `${threadConfig.name} 未配置文案密钥` },
        { status: 500 }
      );
    }

    const textRequest = buildBrandStoryTextApiRequest(
      threadConfig,
      storeName,
      category,
      buildBrandStorySystemPrompt(systemPrompt)
    );

    const response = await fetch(textRequest.url, {
      method: 'POST',
      headers: textRequest.headers,
      body: JSON.stringify(textRequest.body),
      signal: AbortSignal.timeout(400000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API 错误:', response.status, errorText);
      return NextResponse.json(
        { error: 'AI 服务调用失败' },
        { status: 500 }
      );
    }

    try {
      const generatedText = extractBrandStoryTextFromResponse(
        threadConfig,
        await response.json()
      );
      return NextResponse.json(parseBrandCopy(generatedText), { status: 200 });
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError);
      return NextResponse.json(
        { error: 'AI 返回格式错误，请重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('生成文案时发生错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
