import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 请求体类型定义
interface ImageRequest {
  storeName: string;
  category: string;
  brandCopy: {
    mainSlogan: string;
    subSlogan: string;
    featureTitle: string;
    featureContent: string;
    details: Array<{ title: string; content: string }>;
  };
}

// 图片配置
interface ImageConfig {
  aspectRatio: string;
  name: string;
  getPrompt: (copy: ImageRequest['brandCopy']) => string;
}

// 返回的图片数据
interface ImageData {
  index: number;
  aspectRatio: string;
  base64: string;
  mimeType: string;
}

// 错误信息
interface ImageError {
  index: number;
  error: string;
}

// 5张图片配置
const imageConfigs: ImageConfig[] = [
  { 
    aspectRatio: "3:2", 
    name: "主文案配图", 
    getPrompt: (copy) => `${copy.mainSlogan} ${copy.subSlogan}` 
  },
  { 
    aspectRatio: "16:9", 
    name: "品牌特色配图", 
    getPrompt: (copy) => `${copy.featureTitle} ${copy.featureContent}` 
  },
  { 
    aspectRatio: "4:3", 
    name: "细节1配图", 
    getPrompt: (copy) => copy.details[0]?.content || '' 
  },
  { 
    aspectRatio: "4:3", 
    name: "细节2配图", 
    getPrompt: (copy) => copy.details[1]?.content || '' 
  },
  { 
    aspectRatio: "4:3", 
    name: "细节3配图", 
    getPrompt: (copy) => copy.details[2]?.content || '' 
  },
];

// 生成单张图片
async function generateSingleImage(
  storeName: string,
  category: string,
  promptContent: string,
  aspectRatio: string,
  apiKey: string,
  apiBaseUrl: string
): Promise<{ base64: string; mimeType: string }> {
  const prompt = `为${storeName}（${category}店铺）生成一张纯美食图片。
要求：
1. 只展示美食，不要任何文字、logo或水印
2. 高清、精美、有食欲感
3. 图片内容与以下描述相关：${promptContent}`;

  const requestBody = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        aspectRatio
      }
    }
  };

  const response = await fetch(
    `${apiBaseUrl}/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // 关键：使用驼峰命名 inlineData
  const imageData = data.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData
  )?.inlineData?.data;

  const mimeType = data.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData
  )?.inlineData?.mimeType || 'image/png';

  if (!imageData) {
    throw new Error('未能从响应中提取图片数据');
  }

  return { base64: imageData, mimeType };
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: ImageRequest = await request.json();
    const { storeName, category, brandCopy } = body;

    // 验证必需字段
    if (!storeName || !category || !brandCopy) {
      return NextResponse.json(
        { error: '缺少必需字段: storeName, category, brandCopy' },
        { status: 400 }
      );
    }

    // 获取 API Key
    const apiKey = process.env.IMAGE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '服务器配置错误: 缺少 IMAGE_API_KEY' },
        { status: 500 }
      );
    }

    const apiBaseUrl = process.env.API_BASE_URL || 'https://yunwu.ai';

    const images: ImageData[] = [];
    const errors: ImageError[] = [];

    // 串行生成5张图片
    for (let i = 0; i < imageConfigs.length; i++) {
      const config = imageConfigs[i];
      const index = i + 1;

      try {
        console.log(`开始生成第 ${index} 张图片: ${config.name}`);
        
        const promptContent = config.getPrompt(brandCopy);
        const { base64, mimeType } = await generateSingleImage(
          storeName,
          category,
          promptContent,
          config.aspectRatio,
          apiKey,
          apiBaseUrl
        );

        images.push({
          index,
          aspectRatio: config.aspectRatio,
          base64,
          mimeType,
        });

        console.log(`第 ${index} 张图片生成成功`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        console.error(`第 ${index} 张图片生成失败:`, errorMessage);
        
        errors.push({
          index,
          error: errorMessage,
        });
      }
    }

    // 返回结果
    return NextResponse.json({
      images,
      ...(errors.length > 0 && { errors }),
    });

  } catch (error) {
    console.error('图片生成 API 错误:', error);
    return NextResponse.json(
      { 
        error: '图片生成失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}
