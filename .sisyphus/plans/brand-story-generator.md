# 美团品牌故事生成器

## TL;DR

> **Quick Summary**: 构建一个 Next.js 全栈应用，用户输入店铺名和经营品类后，自动调用 AI API 生成品牌文案和5张配套美食图片。
> 
> **Deliverables**:
> - Next.js 项目完整代码
> - 后端 API Routes（文本生成代理 + 图片生成代理）
> - 前端页面（输入表单 + 结果展示 + 复制/下载功能）
> 
> **Estimated Effort**: Medium（约2-3天）
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7

---

## Context

### Original Request
用户输入店铺名和经营品类后，调用 AI API 生成：
1. 一套完整品牌文案（主文案、副文案、品牌特色、细节展示）
2. 5张配套美食图片（不同尺寸比例）

前端展示：先文案后图片，文案可复制，图片可批量下载（命名1-5）。

### Interview Summary
**Key Discussions**:
- 技术栈：Next.js（全栈框架，可隐藏API密钥）
- API密钥：通过后端代理，存储在环境变量
- 图片尺寸：600×450 使用 4:3 比例生成后裁剪

**Research Findings**:
- `prompt.md` 已有完整的文案生成系统提示词
- 文本API支持流式输出 (streamGenerateContent)
- 图片API返回字段是 `inlineData`（驼峰命名，非 inline_data）
- 图片API支持 aspectRatio 参数控制比例

### Metis Review
**Identified Gaps** (addressed):
- 文案输出格式：要求 AI 返回 JSON 格式，便于解析
- 错误处理策略：文案失败不触发图片，图片失败可重试单张
- 并发控制：图片生成串行执行，避免触发限流
- 输入验证：店铺名/品类非空、长度限制、特殊字符过滤
- 防重复提交：前端禁用按钮 + 后端请求去重

---

## Work Objectives

### Core Objective
构建一个完整的品牌故事生成器，实现从用户输入到文案+图片输出的全流程。

### Concrete Deliverables
- `app/page.tsx` - 主页面（输入表单 + 结果展示）
- `app/api/generate-text/route.ts` - 文本生成 API 代理
- `app/api/generate-images/route.ts` - 图片生成 API 代理
- `components/` - UI 组件（表单、文案卡片、图片卡片、下载按钮）
- `lib/` - 工具函数（API 调用、图片处理、文案解析）
- `.env.local` - 环境变量配置

### Definition of Done
- [x] 输入店铺名+品类 → 生成完整文案（5个板块）
- [x] 文案生成后 → 自动生成5张配套图片
- [x] 每段文案点击可复制到剪贴板
- [x] 图片可单独下载或批量下载（命名1-5）
- [x] 所有 API 密钥存储在环境变量，不暴露到前端

### Must Have
- Next.js 14+ App Router 架构
- 后端 API Routes 代理（隐藏密钥）
- 文案 JSON 格式输出与解析
- 5张图片生成（3:1, 16:9, 4:3×3）
- 复制功能（Clipboard API）
- 批量下载功能（JSZip）
- Loading 状态与错误提示
- 输入验证（非空、长度限制）

### Must NOT Have (Guardrails)
- ❌ 用户登录/注册系统
- ❌ 数据库存储/历史记录
- ❌ 图片编辑器/二次裁剪UI
- ❌ 第三方存储（S3/OSS）
- ❌ 多品牌模板库/多套文案版本
- ❌ 任务队列/批量生成系统
- ❌ 国际化/多语言支持

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO（新项目）
- **Automated tests**: NO（快速原型，不设置单元测试）
- **Agent-Executed QA**: YES（所有任务通过 curl/Playwright 验证）

### Agent-Executed QA Scenarios (MANDATORY)

每个任务都包含具体的 Agent 可执行验证场景，使用：
- **Playwright**: 前端 UI 交互验证
- **curl**: API 端点验证
- **Bash**: 文件存在性、环境变量验证

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Next.js 项目初始化 + 环境配置

Wave 2 (After Wave 1):
├── Task 2: 文本生成 API 代理
└── Task 3: 图片生成 API 代理

Wave 3 (After Wave 2):
├── Task 4: 前端输入表单组件
└── Task 5: 文案展示组件（含复制功能）

Wave 4 (After Wave 3):
├── Task 6: 图片展示组件（含下载功能）
└── Task 7: 主页面集成 + 完整流程测试
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 5, 6, 7 | None |
| 2 | 1 | 7 | 3 |
| 3 | 1 | 7 | 2 |
| 4 | 1 | 7 | 5 (after 2) |
| 5 | 1, 2 | 7 | 4, 6 |
| 6 | 1, 3 | 7 | 4, 5 |
| 7 | 2, 3, 4, 5, 6 | None | None (final) |

---

## TODOs

- [x] 1. Next.js 项目初始化 + 环境配置

  **What to do**:
  - 使用 `npx create-next-app@latest . --typescript --tailwind --app --use-npm` 创建项目
  - 安装依赖：`npm install jszip lucide-react`
  - 创建 `.env.local` 配置 API 密钥：
    ```
    TEXT_API_KEY=sk-YQRGIvSObzpWQXEaGMN23bkONQ8QBtL65CeyePfU8o1DRVzi
    IMAGE_API_KEY=sk-ahuuLpWm7KHuhqF4M6FU3GGuGOmTbMIhsIGZGCmdtXa10m6f
    API_BASE_URL=https://yunwu.ai
    ```
  - 创建 `lib/config.ts` 导出配置

  **Must NOT do**:
  - 不要安装数据库依赖
  - 不要配置认证系统

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 2-7
  - **Blocked By**: None

  **References**:
  - `prompt.md` - 系统提示词文件

  **Acceptance Criteria**:

  ```
  Scenario: 项目文件验证
    Tool: Bash
    Steps:
      1. ls package.json → Assert: 文件存在
      2. cat package.json | grep "next" → Assert: 包含 next
      3. cat package.json | grep "jszip" → Assert: 包含 jszip
      4. ls .env.local → Assert: 文件存在
    Evidence: 命令输出

  Scenario: 开发服务器启动
    Tool: Bash
    Steps:
      1. npm run dev &
      2. sleep 8
      3. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
      4. Assert: 返回 200
    Evidence: HTTP 状态码
  ```

  **Commit**: YES
  - Message: `feat: initialize Next.js project with dependencies`

---

- [x] 2. 文本生成 API 代理

  **What to do**:
  - 创建 `app/api/generate-text/route.ts`
  - 读取 `prompt.md` 作为系统提示词
  - 调用 Gemini API：`POST /v1beta/models/gemini-3-pro-preview:streamGenerateContent`
  - 要求 AI 返回 JSON 格式，包含字段：
    ```typescript
    interface BrandCopy {
      mainSlogan: string;      // 主文案 4-8字
      subSlogan: string;       // 副文案 8-14字
      featureTitle: string;    // 品牌特色标题 6-18字
      featureContent: string;  // 品牌亮点文案 250字内
      detailsTitle: string;    // 细节总标题 6-18字
      details: Array<{
        title: string;         // 细节标题 2-6字
        content: string;       // 细节文案 40-50字
      }>;
    }
    ```
  - 解析 AI 返回的 JSON，处理解析失败情况

  **Must NOT do**:
  - 不要在前端暴露 API 密钥
  - 不要存储生成结果到数据库

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5, 7
  - **Blocked By**: Task 1

  **References**:
  - `prompt.md` - 完整系统提示词
  - API文档: `https://yunwu.apifox.cn/api-318990658.md`

  **Acceptance Criteria**:

  ```
  Scenario: 文本API正常返回
    Tool: Bash (curl)
    Preconditions: 开发服务器运行中
    Steps:
      1. curl -X POST http://localhost:3000/api/generate-text \
           -H "Content-Type: application/json" \
           -d '{"storeName":"老王麻辣烫","category":"麻辣烫"}'
      2. Assert: HTTP 200
      3. Assert: 响应包含 mainSlogan 字段
      4. Assert: 响应包含 details 数组，长度为 3
    Evidence: 响应 JSON

  Scenario: 输入验证失败
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:3000/api/generate-text \
           -H "Content-Type: application/json" \
           -d '{"storeName":"","category":""}'
      2. Assert: HTTP 400
      3. Assert: 响应包含 error 字段
    Evidence: 错误响应
  ```

  **Commit**: YES
  - Message: `feat: add text generation API route`

---

- [x] 3. 图片生成 API 代理

  **What to do**:
  - 创建 `app/api/generate-images/route.ts`
  - 接收参数：文案内容 + 图片配置数组
  - 串行调用 Gemini 图片 API（避免限流）
  - 5张图片配置：
    ```typescript
    const imageConfigs = [
      { aspectRatio: "3:1", prompt: "基于主文案+副文案" },
      { aspectRatio: "16:9", prompt: "基于品牌特色" },
      { aspectRatio: "4:3", prompt: "基于细节1" },
      { aspectRatio: "4:3", prompt: "基于细节2" },
      { aspectRatio: "4:3", prompt: "基于细节3" },
    ];
    ```
  - ⚠️ 注意：返回字段是 `inlineData`（驼峰），不是 `inline_data`
  - 返回 base64 图片数组

  **Must NOT do**:
  - 不要并发调用图片API
  - 不要存储图片到服务器

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Task 6, 7
  - **Blocked By**: Task 1

  **References**:
  - API文档: `https://yunwu.apifox.cn/api-358030171.md`
  - 关键点：`response.candidates[0].content.parts[0].inlineData.data`

  **Acceptance Criteria**:

  ```
  Scenario: 图片API正常返回
    Tool: Bash (curl)
    Preconditions: 开发服务器运行中
    Steps:
      1. curl -X POST http://localhost:3000/api/generate-images \
           -H "Content-Type: application/json" \
           -d '{"prompts":["美味麻辣烫特写","热气腾腾的麻辣烫"]}'
      2. Assert: HTTP 200
      3. Assert: 响应 images 数组长度 >= 1
      4. Assert: 每个 image 包含 base64 数据
    Evidence: 响应结构（不含完整base64）

  Scenario: 单张图片生成失败处理
    Tool: Bash (curl)
    Steps:
      1. 发送包含无效prompt的请求
      2. Assert: 响应包含 errors 数组标识失败项
      3. Assert: 成功的图片仍然返回
    Evidence: 部分成功响应
  ```

  **Commit**: YES
  - Message: `feat: add image generation API route`

---

- [x] 4. 前端输入表单组件

  **What to do**:
  - 创建 `components/InputForm.tsx`
  - 两个输入框：店铺名称、经营品类
  - 输入验证：非空、长度限制（店铺名2-20字，品类2-10字）
  - 提交按钮：生成中禁用，显示 loading 状态
  - 错误提示：红色文字显示验证错误

  **Must NOT do**:
  - 不要添加额外输入字段
  - 不要实现表单持久化

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:
  - Tailwind CSS 样式
  - lucide-react 图标库

  **Acceptance Criteria**:

  ```
  Scenario: 表单渲染正确
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Assert: input[name="storeName"] 存在
      3. Assert: input[name="category"] 存在
      4. Assert: button[type="submit"] 存在
      5. Screenshot: .sisyphus/evidence/task-4-form.png
    Evidence: 截图

  Scenario: 输入验证
    Tool: Playwright
    Steps:
      1. 点击提交按钮（不填写内容）
      2. Assert: 显示错误提示文字
      3. 填写店铺名 "测试店铺"
      4. 填写品类 "火锅"
      5. Assert: 错误提示消失
    Evidence: 截图
  ```

  **Commit**: YES
  - Message: `feat: add input form component`

---

- [x] 5. 文案展示组件（含复制功能）

  **What to do**:
  - 创建 `components/CopyCard.tsx` - 单个文案卡片，点击复制
  - 创建 `components/CopySection.tsx` - 文案展示区域
  - 使用 Clipboard API 实现复制
  - 复制成功显示 toast 提示
  - 展示顺序：主文案 → 副文案 → 品牌特色 → 细节展示

  **Must NOT do**:
  - 不要实现编辑功能
  - 不要添加分享功能

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1, 2

  **References**:
  - Clipboard API: `navigator.clipboard.writeText()`

  **Acceptance Criteria**:

  ```
  Scenario: 文案复制功能
    Tool: Playwright
    Steps:
      1. 渲染 CopyCard 组件（mock 数据）
      2. 点击文案卡片
      3. Assert: 显示"已复制"提示
      4. 读取剪贴板内容
      5. Assert: 剪贴板内容与文案一致
    Evidence: 截图 + 剪贴板验证
  ```

  **Commit**: YES
  - Message: `feat: add copy card components`

---

- [x] 6. 图片展示组件（含下载功能）

  **What to do**:
  - 创建 `components/ImageCard.tsx` - 单张图片卡片
  - 创建 `components/ImageSection.tsx` - 图片展示区域
  - 创建 `lib/download.ts` - 下载工具函数
  - 单张下载：直接触发浏览器下载
  - 批量下载：使用 JSZip 打包为 zip
  - 图片命名：1.jpg, 2.jpg, 3.jpg, 4.jpg, 5.jpg
  - 4:3 图片裁剪到 600×450（Canvas API）

  **Must NOT do**:
  - 不要添加图片编辑功能
  - 不要上传到云存储

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1, 3

  **References**:
  - JSZip 文档
  - Canvas API 裁剪

  **Acceptance Criteria**:

  ```
  Scenario: 单张图片下载
    Tool: Playwright
    Steps:
      1. 渲染 ImageCard（mock base64 数据）
      2. 点击下载按钮
      3. Assert: 触发下载事件
    Evidence: 下载事件日志

  Scenario: 批量下载
    Tool: Playwright
    Steps:
      1. 渲染 ImageSection（5张 mock 图片）
      2. 点击"批量下载"按钮
      3. Assert: 下载 zip 文件
    Evidence: 下载事件日志
  ```

  **Commit**: YES
  - Message: `feat: add image display and download components`

---

- [x] 7. 主页面集成 + 完整流程测试

  **What to do**:
  - 修改 `app/page.tsx` 集成所有组件
  - 实现完整流程：输入 → 生成文案 → 生成图片 → 展示结果
  - 添加 loading 状态管理
  - 添加错误处理与重试机制
  - 布局：上方输入表单，下方结果展示（先文案后图片）

  **Must NOT do**:
  - 不要添加路由跳转
  - 不要实现状态持久化

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: Tasks 2, 3, 4, 5, 6

  **References**:
  - 所有已创建的组件
  - API 路由

  **Acceptance Criteria**:

  ```
  Scenario: 完整生成流程
    Tool: Playwright
    Preconditions: 开发服务器运行中
    Steps:
      1. Navigate to http://localhost:3000
      2. Fill input[name="storeName"] → "老王麻辣烫"
      3. Fill input[name="category"] → "麻辣烫"
      4. Click button[type="submit"]
      5. Wait for loading 消失 (timeout: 120s)
      6. Assert: 文案区域显示主文案
      7. Assert: 文案区域显示副文案
      8. Assert: 图片区域显示 5 张图片
      9. Screenshot: .sisyphus/evidence/task-7-result.png
    Evidence: 完整结果截图

  Scenario: 文案复制验证
    Tool: Playwright
    Steps:
      1. 完成生成流程后
      2. 点击主文案卡片
      3. Assert: 显示"已复制"提示
    Evidence: 截图

  Scenario: 批量下载验证
    Tool: Playwright
    Steps:
      1. 完成生成流程后
      2. 点击"批量下载"按钮
      3. Assert: 触发 zip 下载
    Evidence: 下载事件
  ```

  **Commit**: YES
  - Message: `feat: integrate all components in main page`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `feat: initialize Next.js project` | package.json, .env.local, lib/config.ts |
| 2 | `feat: add text generation API` | app/api/generate-text/route.ts |
| 3 | `feat: add image generation API` | app/api/generate-images/route.ts |
| 4 | `feat: add input form component` | components/InputForm.tsx |
| 5 | `feat: add copy card components` | components/CopyCard.tsx, CopySection.tsx |
| 6 | `feat: add image components` | components/ImageCard.tsx, ImageSection.tsx, lib/download.ts |
| 7 | `feat: integrate main page` | app/page.tsx |

---

## Success Criteria

### Verification Commands
```bash
# 启动开发服务器
npm run dev

# 验证文本API
curl -X POST http://localhost:3000/api/generate-text \
  -H "Content-Type: application/json" \
  -d '{"storeName":"测试店铺","category":"火锅"}'
# Expected: JSON 包含 mainSlogan, subSlogan, details 等字段

# 验证图片API
curl -X POST http://localhost:3000/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{"prompts":["美味火锅"]}'
# Expected: JSON 包含 images 数组
```

### Final Checklist
- [x] 输入店铺名+品类 → 生成完整文案
- [x] 文案生成后 → 自动生成5张图片
- [x] 每段文案点击可复制
- [x] 图片可批量下载（命名1-5.jpg）
- [x] API密钥不暴露到前端
- [x] Loading 状态正常显示
- [x] 错误提示正常显示
