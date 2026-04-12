# 标注系统优化清单

> 技术栈：React 19 + Zustand 5 + Tailwind 4 | FastAPI + SQLAlchemy + SQLite
> 生成时间：2026-04-11

---

## 🔴 CRITICAL — 必须修复

### C1. 零认证/鉴权
- **位置**: backend/main.py
- **问题**: 无 auth 中间件、无 JWT、无 API Key，任何人可增删改所有数据
- **建议**: 添加 JWT 或 API Key 认证中间件，至少保护写操作

### C2. Store 全量订阅导致级联重渲染
- **位置**: frontend/src/pages/WorkspacePage.tsx:30-32, AnnotationPanel.tsx:6-8, ItemList.tsx:16-18
- **问题**: `useAnnotationStore()` 不带 selector，任意字段变更触发整个工作区及所有子组件重渲染
- **建议**: 改用 selector 模式 `useAnnotationStore(s => s.xxx)`，只订阅需要的字段

### C3. 所有 Store 异步操作无 try/catch
- **位置**: frontend/src/stores/annotationStore.ts (confirmAndNext, skipItem, flagItem, undoLast, batchAnnotate, batchSkip, loadItems), sessionStore.ts (fetchSessions, fetchProgress), uiStore.ts (fetchReasons)
- **问题**: API 调用失败时 Promise rejection 未捕获，用户无反馈，应用状态可能不一致
- **建议**: 所有异步 action 加 try/catch，失败时设置 error state 并展示 Toast

### C4. CardGridView 未做虚拟化
- **位置**: frontend/src/components/workspace/CardGridView.tsx:23-33
- **问题**: `items.map()` 直接渲染全部卡片（含媒体、内联标注），100 条即生成大量 DOM 节点
- **建议**: 使用 @tanstack/react-virtual（项目已安装）对网格做虚拟滚动

### C5. 分页 + 状态过滤在 Python 内存中执行
- **位置**: backend/routers/sessions.py:97-104
- **问题**: 先从 DB 取全部数据再在 Python 中 filter，导致分页 total 不准、每页可能不满
- **建议**: 将 status 过滤下推到 SQL WHERE 子句，在数据库层面完成过滤和分页

### C6. 导入无文件大小限制
- **位置**: backend/routers/items.py:21 `await file.read()`
- **问题**: 无大小校验，恶意上传 GB 级文件可直接 OOM 打挂后端
- **建议**: 添加 Content-Length 检查或分块读取，限制最大上传为 50MB

### C7. 离开页面无保存提示
- **位置**: frontend/src/pages/WorkspacePage.tsx
- **问题**: 标注写到一半按浏览器回退或关闭标签页，草稿直接丢失
- **建议**: 添加 beforeunload 事件监听，有未保存 draft 时弹出确认框

---

## 🟠 HIGH — 尽快修复

### H1. YES/NO + Reason 按钮组重复 3 遍
- **位置**: AnnotationPanel.tsx:26-48（单条）、AnnotationPanel.tsx:139-160（批量 BatchPanel）、InlineAnnotation.tsx:54-83（网格）
- **问题**: 三处几乎相同的 UI 逻辑独立维护，改一处忘另两处
- **建议**: 抽取 `<ResultButtons>` 和 `<ReasonSelector>` 公共组件

### H2. 全项目零 React.memo
- **位置**: 所有 frontend/src/components/**/*.tsx
- **问题**: 无任何组件使用 React.memo，配合 C2 的全量订阅，父组件任何变更导致全部子树重渲染
- **建议**: 对 ItemList、ItemViewer、AnnotationPanel、ItemCard、ShortcutHints 等纯展示组件加 memo

### H3. 无障碍 (Accessibility) 全线缺失
- **位置**: 全前端
- **问题**:
  - 所有按钮无 aria-label / aria-pressed
  - 模式切换按钮无 role="tab" / aria-selected
  - 状态指示仅用颜色（绿/黄/红/灰），色盲用户无法区分
  - 标注确认后焦点不转移，无 screen reader 播报
  - FileUploader 拖拽区不可键盘访问
- **建议**: 分批添加 ARIA 属性，状态增加图标/文字辅助，添加焦点管理

### H4. Undo 只能撤一步
- **位置**: frontend/src/stores/annotationStore.ts:200-207
- **问题**: `_lastAnnotatedItemId` 只存最近一条 ID，连续标注 3 条仅能撤销最后 1 条
- **建议**: 改为 undo stack（数组），支持多步撤销

### H5. 导航栏缺少 Workspace 入口
- **位置**: frontend/src/components/layout/AppShell.tsx:4-7
- **问题**: NAV_ITEMS 只有"导入"和"导出"，已有 Session 无法从导航直达
- **建议**: 添加"工作台"或"会话列表"导航项

### H6. 并发写入 UniqueConstraint 竞态
- **位置**: backend/routers/annotations.py:35-37
- **问题**: 先 query 判断存在再 insert，并发时可触发未捕获的 IntegrityError
- **建议**: 使用 INSERT ... ON CONFLICT UPDATE（merge/upsert）或加 try/except IntegrityError

### H7. 导出一次性全量加载到内存
- **位置**: backend/services/export_service.py:21
- **问题**: `query.all()` 把全部 items + annotations 加载到内存，大数据集会 OOM
- **建议**: 使用 yield_per() 流式读取 + StreamingResponse 分块输出

### H8. YES/NO 按钮视觉不平衡
- **位置**: frontend/src/components/workspace/AnnotationPanel.tsx:26-48
- **问题**: YES 是灰色、NO 是高饱和红色，视觉上暗示用户倾向点 NO，可能造成标注偏差
- **建议**: YES 用绿色、NO 用红色，保持同等视觉权重

---

## 🟡 MEDIUM — 值得改进

### M1. 刷新丢失状态
- **位置**: frontend/src/stores/*.ts
- **问题**: Zustand 没有使用 persist 中间件，F5 刷新后当前 draft、选中项等全部丢失
- **建议**: 对 annotationStore 的 draft 字段和 currentIndex 启用 zustand/persist

### M2. 列表无搜索/筛选功能
- **位置**: frontend/src/components/workspace/ItemList.tsx
- **问题**: 50 条可滚动浏览，但无法按状态（待标注/已完成/已跳过/已标记）过滤，也无文本搜索
- **建议**: 添加状态筛选 tabs 和关键词搜索框

### M3. InlineAnnotation 本地状态不同步
- **位置**: frontend/src/components/workspace/InlineAnnotation.tsx:19-20
- **问题**: `useState` 初始化自 props 但无 useEffect 同步，批量操作后卡片显示旧状态
- **建议**: 添加 useEffect 监听 annotation prop 变化，或改用受控模式

### M4. ChatContext 正则解析脆弱
- **位置**: frontend/src/components/workspace/ChatContext.tsx:41-58
- **问题**: `content.match(/商品描述信息为：\[([^\]]*)\]/)` 遇嵌套括号就解析失败
- **建议**: 改用结构化 JSON 字段传递上下文，或使用更健壮的解析器

### M5. Progress 查询效率低
- **位置**: backend/services/progress_service.py:19-22
- **问题**: 4 次独立 COUNT 查询命中同一张 annotation 表
- **建议**: 合并为一条 SQL：`SELECT COUNT(*) FILTER(WHERE ...) FROM annotation WHERE session_id = ?`

### M6. 导出格式单一
- **位置**: backend/routers/items.py:42, frontend/src/pages/ExportPage.tsx
- **问题**: 仅支持 JSON 导出，生产环境通常还需 CSV / Excel
- **建议**: 添加格式选择下拉，后端增加 CSV 和 XLSX 导出端点

### M7. 无数据库迁移工具
- **位置**: backend/requirements.txt
- **问题**: 未引入 Alembic，修改表结构 = 删库重建，丢失所有数据
- **建议**: 引入 Alembic 管理 schema migration

### M8. annotator_id 形同虚设
- **位置**: backend/models.py:80,94, frontend/src/components/import/SessionConfig.tsx
- **问题**: 模型定义了 annotator_id 但前端不采集、后端不校验、不做审计
- **建议**: 前端增加标注员选择/输入，后端关联认证用户

### M9. CORS 过度宽松
- **位置**: backend/main.py:25-28
- **问题**: `allow_methods=["*"], allow_headers=["*"]`，origin 写死 localhost
- **建议**: 白名单指定允许的 methods/headers，origin 从环境变量读取

### M10. Schema 层验证缺失
- **位置**: backend/schemas.py
- **问题**:
  - mode 字段是 str 而非 Enum/Literal
  - result 字段无约束
  - 所有字符串无 max_length
  - status 查询参数接受任意值
- **建议**: 使用 Literal/Enum 约束枚举值，添加 max_length 和 Field 校验

### M11. 无全局异常处理
- **位置**: backend/main.py
- **问题**: SQLAlchemy IntegrityError、OperationalError 等会直接返回原始 traceback
- **建议**: 添加 FastAPI exception_handler，统一返回结构化错误响应

---

## 🟢 LOW — 锦上添花

### L1. 网格翻页无跳页输入
- **位置**: CardGridView.tsx:37-56
- **问题**: 只有上一页/下一页，1 万条 100/页需点 100 次
- **建议**: 添加页码输入框或页码跳转

### L2. App.css 残留 Vite 样板代码
- **位置**: frontend/src/App.css（184 行）
- **问题**: 全部是 Vite 默认模板样式，项目使用 Tailwind，此文件无用
- **建议**: 清理或删除

### L3. YouTube iframe 无 sandbox 属性
- **位置**: frontend/src/components/workspace/MediaRenderer.tsx:41-45
- **问题**: 嵌入外部 iframe 无 sandbox，存在 XSS 风险
- **建议**: 添加 `sandbox="allow-scripts allow-same-origin"`

### L4. 导出页无成功/失败反馈
- **位置**: frontend/src/pages/ExportPage.tsx:17-34
- **问题**: try/finally 无 catch，导出成功/失败用户都没有 Toast 提示
- **建议**: 添加 catch 分支 + 成功/失败 Toast 通知

### L5. 初始加载显示"暂无数据"而非 Skeleton
- **位置**: frontend/src/components/workspace/ItemViewer.tsx:11
- **问题**: 数据未到时显示"暂无数据"，用户以为系统出错
- **建议**: 加载中时显示 skeleton 占位符

### L6. 网格模式下快捷键提示被隐藏
- **位置**: frontend/src/pages/WorkspacePage.tsx:101
- **问题**: `{uiStore.showShortcutHints && !isGrid && <ShortcutHints />}` 网格模式无快捷键参考
- **建议**: 网格模式也显示适配的快捷键提示

### L7. 缺少 IAA（标注者间一致性）指标
- **位置**: 后端未实现
- **问题**: 生产标注系统需要 Cohen's Kappa / Fleiss' Kappa 等一致性评估
- **建议**: 添加 IAA 计算端点和前端展示面板

### L8. 无标注历史版本
- **位置**: backend/routers/annotations.py
- **问题**: annotation 直接覆写，不留任何修改痕迹
- **建议**: 添加 annotation_history 表记录每次变更

### L9. 健康检查未验证 DB 连接
- **位置**: backend/main.py:37-39
- **问题**: `/health` 返回静态 `{"status": "ok"}`，不检测数据库是否可用
- **建议**: 执行一次简单查询验证 DB 连通性

### L10. 无后台任务处理
- **位置**: backend/routers/items.py
- **问题**: 大文件导入是同步处理，10 万条会阻塞请求超时
- **建议**: 使用 FastAPI BackgroundTasks 或 Celery 异步处理

---

## ⚡ 推荐修复路径

```
阶段 1 · 稳定性（1-2 天）
  C3 异步错误处理 → C7 离开保护 → C5 分页修复 → C6 上传限制 → M11 全局异常处理

阶段 2 · 性能（1-2 天）
  C2 Zustand selector → H2 React.memo → C4 Grid 虚拟化

阶段 3 · 体验（2-3 天）
  H1 组件去重 → H8 按钮视觉平衡 → M2 搜索过滤 → H4 多步撤销 → H5 导航入口

阶段 4 · 生产就绪（3-5 天）
  C1 认证鉴权 → M7 DB 迁移 → H7 流式导出 → M8 审计日志 → M9 CORS 收紧
```
