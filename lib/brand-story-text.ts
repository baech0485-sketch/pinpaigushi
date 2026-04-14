import type { BrandCopy } from '@/lib/brand-story-types';

interface GeminiTextRequest {
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

interface GeminiTextPart {
  text?: string;
  thought?: boolean;
}

interface GeminiTextResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
    };
  }>;
}

export function buildBrandStorySystemPrompt(promptTemplate: string): string {
  return `${promptTemplate}

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
}

export function buildBrandStoryTextRequest(
  storeName: string,
  category: string,
  systemPrompt: string
): GeminiTextRequest {
  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: `店铺名：${storeName}\n经营品类：${category}` }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.8,
    },
  };
}

export function extractGeneratedText(response: GeminiTextResponse): string {
  const parts = response.candidates?.[0]?.content?.parts;

  if (!parts || parts.length === 0) {
    throw new Error('AI 生成失败，请重试');
  }

  const responsePart = parts.find((part) => !part.thought && part.text) || parts[parts.length - 1];
  const generatedText = responsePart?.text?.trim();

  if (!generatedText) {
    throw new Error('AI 返回空内容');
  }

  return generatedText;
}

export function parseBrandCopy(generatedText: string): BrandCopy {
  const jsonBlockMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) ||
    generatedText.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = jsonBlockMatch ? jsonBlockMatch[1] : generatedText;
  const brandCopy = JSON.parse(jsonText.trim()) as BrandCopy;

  if (
    !brandCopy.mainSlogan ||
    !brandCopy.subSlogan ||
    !brandCopy.featureTitle ||
    !brandCopy.featureContent ||
    !brandCopy.detailsTitle ||
    !brandCopy.details ||
    brandCopy.details.length !== 3
  ) {
    throw new Error('返回数据结构不完整');
  }

  return brandCopy;
}
