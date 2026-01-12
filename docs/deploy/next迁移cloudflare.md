# Next.js → Cloudflare (OpenNext) 落地指引

面向当前仓库（Next 16.0.10、App Router，已安装 `@opennextjs/cloudflare@1.14.7`）。目标：把 Node Runtime 的 Next.js 应用转换为 Cloudflare Workers 形态，具备 ISR/Tag Cache/队列能力。

## 基本要求
- 必须使用 Node.js Runtime（避免在页面或路由中声明 `runtime = "edge"`）。
- 依赖版本：Next ^14.2.35 / ^15.x / ^16.0.10；Wrangler 需要 ≥4.53（peer 依赖）。
- Cloudflare 资源准备：一个 R2 桶、一个 D1 数据库、一个 Durable Object 命名空间（队列），以及一个指向自身的 Service 绑定。

## 步骤概览
1) 安装工具  
`npm install -D wrangler@^4.53.0`（可选：`@cloudflare/workers-types` 仅供类型提示）。

2) 新建 `open-next.config.ts`（根目录）  
```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache, // R2: 绑定名 NEXT_INC_CACHE_R2_BUCKET
  tagCache: d1NextTagCache,            // D1: 绑定名 NEXT_TAG_CACHE_D1
  queue: doQueue,                      // Durable Object: 绑定名 NEXT_CACHE_DO_QUEUE
});
```

3) 创建 `wrangler.toml` 模板（按需替换占位符）  
```toml
name = "zhidingagent-next"          # Worker 名称
main = ".open-next/worker.js"
compatibility_date = "2025-01-20"
compatibility_flags = ["nodejs_compat"]
workers_dev = true                  # 或设置 routes/zone_id 走自定义域
assets = { directory = ".open-next/assets", binding = "ASSETS" }

[build]
command = "npm run build:cf"

[[r2_buckets]]
binding = "NEXT_INC_CACHE_R2_BUCKET"
bucket_name = "your-r2-bucket"
# 可选：在 [vars] 里设置 NEXT_INC_CACHE_R2_PREFIX 用于多环境前缀

[[d1_databases]]
binding = "NEXT_TAG_CACHE_D1"
database_name = "your-d1-db"
database_id = "xxxxx-xxxxx"

[[durable_objects.bindings]]
name = "NEXT_CACHE_DO_QUEUE"
class_name = "DOQueueHandler"

[[services]]
binding = "WORKER_SELF_REFERENCE"
service = "zhidingagent-next"       # 指向同名 Worker（用于队列 revalidate）
environment = "production"

# 若需要标签缓存的 DO 版本，可再绑定：
# [[durable_objects.bindings]]
# name = "NEXT_TAG_CACHE_DO_SHARDED"
# class_name = "DOShardedTagCache"
# [[queues.producers]]
# binding = "NEXT_TAG_CACHE_DO_SHARDED_DLQ"
# queue = "your-dead-letter-queue-name"

[vars]
NEXT_PRIVATE_RUNTIME_TARGET = "cloudflare"
# 其余环境变量/密钥用 wrangler secret put 或 vars 配置
```

4) D1 表结构  
在 `NEXT_TAG_CACHE_D1` 中执行一次：  
```sql
CREATE TABLE IF NOT EXISTS revalidations (tag TEXT PRIMARY KEY, revalidatedAt INTEGER);
```

5) NPM 脚本（建议）  
```json
"build:cf": "opennextjs-cloudflare build",
"dev:cf": "npm run build:cf && wrangler dev",
"deploy:cf": "npm run build:cf && opennextjs-cloudflare deploy"
```
平时本地开发仍用 `npm run dev`。

6) 构建与部署流程  
- 本地预览：`npm run dev:cf`（会生成 `.open-next`，Wrangler 在本地起 Worker）。  
- 生产部署：`npm run deploy:cf`（内部调用 Wrangler 推送）。如需 CI，可直接运行 `npm ci && npm run deploy:cf`。

## 资源与变量清单
- R2：绑定 `NEXT_INC_CACHE_R2_BUCKET`，可用 `NEXT_INC_CACHE_R2_PREFIX` 做环境隔离。
- D1：绑定 `NEXT_TAG_CACHE_D1`，需提前创建 `revalidations` 表。
- 队列 DO：绑定 `NEXT_CACHE_DO_QUEUE`；可用环境变量调优  
  `NEXT_CACHE_DO_QUEUE_MAX_REVALIDATION`、`NEXT_CACHE_DO_QUEUE_REVALIDATION_TIMEOUT_MS`、`NEXT_CACHE_DO_QUEUE_MAX_RETRIES`。  
- Service 绑定：`WORKER_SELF_REFERENCE` 必须指回同一个 Worker，供 ISR revalidate 使用。  
- 其他 Next 环境变量：用 `[vars]` 存放非敏感值，密钥用 `wrangler secret put`。

## 验证与限制
- Worker 体积：压缩后免费版 ≤3 MiB，付费版 ≤10 MiB；`opennextjs-cloudflare build` 结束会显示压缩大小，超限需精简依赖或拆包。
- PPR/Composable cache：默认 `enableCacheInterception=false`，如开启 PPR，请保持默认或在 `defineCloudflareConfig` 里关闭拦截。
- 图片优化：若使用 Next Image Loader，生产上推荐改用 Cloudflare Images 或自定义 loader；`/cdn-cgi/image/...` 本地预览可由模板处理。
- Windows 开发：编译建议在 WSL 或 CI (Linux/macOS) 运行。

## 参考
- 官方文档：https://opennext.js.org/cloudflare/get-started
