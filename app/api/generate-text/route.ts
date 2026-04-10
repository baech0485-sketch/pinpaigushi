import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 品牌文案数据结构
interface BrandCopy {
  mainSlogan: string;      // 主文案 4-8字
  subSlogan: string;       // 副文案 8-14字
  featureTitle: string;    // 品牌特色标题 6-18字
  featureContent: string;  // 品牌亮点文案 250字内
  detailsTitle: string;    // 细节总标题 6-18字
  details: Array<{
    title: string;         // 细节标题 2-6字
    content: string;       // 细节文案 40-50字
  }>;  // 必须有3个细节
}

// Gemini API 请求体结构
interface GeminiRequest {
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
  systemInstruction: {
    parts: Array<{ text: string }>;
  };
  generationConfig: {
    temperature: number;
  };
}

// Gemini API 响应结构
interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { storeName, category } = body;

    // 输入验证
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

    // 读取系统提示词
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

    // 添加 JSON 格式要求到系统提示词
    const enhancedSystemPrompt = `${systemPrompt}

## 重要：输出格式要求
你必须返回纯 JSON 格式的数据，不要使用 markdown 代码块包裹。直接返回 JSON 对象。

JSON 结构如下：
{
  "mainSlogan": "主文案内容",
  "subSlogan": "副文案内容",
  "featureTitle": "品牌特色标题",
  "featureContent": "品牌亮点文案内容",
  "detailsTitle": "细节总标题",
  "details": [
    {"title": "细节1标题", "content": "细节1文案内容"},
    {"title": "细节2标题", "content": "细节2文案内容"},
    {"title": "细节3标题", "content": "细节3文案内容"}
  ]
}`;

    // 构建用户输入
    const userInput = `店铺名：${storeName}\n经营品类：${category}`;

    // 构建 Gemini API 请求体
    const geminiRequest: GeminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userInput }]
        }
      ],
      systemInstruction: {
        parts: [{ text: enhancedSystemPrompt }]
      },
      generationConfig: {
        temperature: 0.8
      }
    };

    // 获取 API 密钥
    const apiKey = process.env.TEXT_API_KEY;
    if (!apiKey) {
      console.error('TEXT_API_KEY 环境变量未设置');
      return NextResponse.json(
        { error: '服务配置错误' },
        { status: 500 }
      );
    }

    // 调用 Gemini API（支持通过 API_BASE_URL 配置网关地址）
    const apiBaseUrl = process.env.API_BASE_URL || 'https://yunwu.ai';
    const apiUrl = `${apiBaseUrl}/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API 错误:', response.status, errorText);
      return NextResponse.json(
        { error: 'AI 服务调用失败' },
        { status: 500 }
      );
    }

    const geminiResponse: GeminiResponse = await response.json();

    // 提取生成的文本
    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
      console.error('Gemini API 返回空结果');
      return NextResponse.json(
        { error: 'AI 生成失败，请重试' },
        { status: 500 }
      );
    }

    // 找到非 thought 的 part（实际响应）
    const parts = geminiResponse.candidates[0].content.parts;
    const responsePart = parts.find((part: any) => !part.thought) || parts[parts.length - 1];
    const generatedText = responsePart.text;

    // 解析 JSON（处理可能的 markdown 代码块）
    let brandCopy: BrandCopy;
    
    try {
      // 尝试提取 JSON 代码块
      const jsonBlockMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                            generatedText.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonText = jsonBlockMatch ? jsonBlockMatch[1] : generatedText;
      brandCopy = JSON.parse(jsonText.trim());
      
      // 验证必需字段
      if (!brandCopy.mainSlogan || !brandCopy.subSlogan || !brandCopy.featureTitle || 
          !brandCopy.featureContent || !brandCopy.detailsTitle || !brandCopy.details ||
          brandCopy.details.length !== 3) {
        throw new Error('返回数据结构不完整');
      }
      
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError);
      console.error('原始文本:', generatedText);
      return NextResponse.json(
        { error: 'AI 返回格式错误，请重试' },
        { status: 500 }
      );
    }

    // 返回成功结果
    return NextResponse.json(brandCopy, { status: 200 });

  } catch (error) {
    console.error('生成文案时发生错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
