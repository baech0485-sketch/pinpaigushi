# Draft: 美团品牌故事生成器

## Requirements (confirmed)

### 用户输入
- 店铺名称
- 经营品类

### 输出内容 - 文案部分
- 主文案：4-8字
- 副文案：8-14字
- 品牌特色标题：6-18字
- 品牌亮点文案：250字以内
- 细节展示板块：
  - 总标题：6-18字
  - 细节1：标题(2-6字) + 文案(40-50字)
  - 细节2：标题(2-6字) + 文案(40-50字)
  - 细节3：标题(2-6字) + 文案(40-50字)

### 输出内容 - 图片部分（共5张）
| 图片 | 尺寸/比例 | 对应文案 |
|------|----------|---------|
| 图1 | 3:1 | 主文案+副文案 |
| 图2 | 16:9 | 品牌特色标题+品牌亮点文案 |
| 图3 | 4:3→裁剪600×450 | 细节1 |
| 图4 | 4:3→裁剪600×450 | 细节2 |
| 图5 | 4:3→裁剪600×450 | 细节3 |

所有图片要求：纯美食图案，不能有任何文字

## Technical Decisions

### 技术栈
- **框架**: Next.js（全栈框架）
- **理由**: 可在服务端隐藏API密钥，更安全

### API密钥处理
- **方案**: 通过后端代理
- **实现**: Next.js API Routes 作为中间层
- **密钥存储**: 环境变量 (.env.local)

### 图片尺寸处理
- **方案**: 使用4:3比例生成后前端裁剪到600×450
- **实现**: Canvas API 或 CSS object-fit

## API Information

### 文本生成API
- URL: https://yunwu.ai
- Endpoint: /v1beta/models/gemini-3-pro-preview:streamGenerateContent
- Key: sk-YQRGIvSObzpWQXEaGMN23bkONQ8QBtL65CeyePfU8o1DRVzi
- Prompt: 使用 prompt.md 中的系统提示词

### 图片生成API
- URL: https://yunwu.ai
- Endpoint: /v1beta/models/gemini-2.5-flash-image:generateContent
- Key: sk-ahuuLpWm7KHuhqF4M6FU3GGuGOmTbMIhsIGZGCmdtXa10m6f
- ⚠️ 注意: 返回字段是 `inlineData`（驼峰），不是 `inline_data`

## Frontend Features

### 展示逻辑
- 先展示文案，后展示对应图片
- 每段文案点击可复制
- 图片可批量下载（命名1-5）

### 交互体验
- 生成过程需要loading状态
- 流式显示文案生成过程

## Scope Boundaries

### INCLUDE
- Next.js 项目初始化
- 前端输入表单
- 后端API代理路由
- 文案生成与解析
- 图片生成与处理
- 复制功能
- 批量下载功能

### EXCLUDE
- 用户认证系统
- 数据库存储
- 历史记录功能
- 多语言支持

## Open Questions
- 无（需求已明确）
