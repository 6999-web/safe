# WhiteHat Security Hub

面向企业安全需求方、白帽研究员和平台治理团队的一体化安全众测社区。
项目融合 HackerOne/Bugcrowd 的漏洞众包流程、Taiga 式任务协作、CTFd
成长体系、Flarum 社区模式和 DefectDojo 漏洞生命周期理念。

## 已实现能力

- BCrypt 密码、JWT 无状态认证、白帽/企业/管理员三级权限
- 企业授权任务发布、检索、申请和个人任务工作台
- 每日工作报告与任务成员校验
- 漏洞提交、企业审核、严重度积分、等级和排行榜联动
- 社区分类、文章发布与评论 API
- PDF/图片/文本/ZIP 上传白名单、大小限制与随机存储名
- 平台安全态势大屏、任务大厅、白帽中心、企业工作台和安全社区
- PostgreSQL Flyway 迁移、Redis、Docker Compose 与第三方集成适配器

详细设计见 [架构](docs/ARCHITECTURE.md)、[ER 图](docs/ER.md) 和
[API 文档](docs/API.md)。

## 目录

```text
backend/            Spring Boot 3.3 / Java 21 / MyBatis Plus
frontend/           Vue 3 / TypeScript / Element Plus / ECharts / TailwindCSS
docs/               架构、数据模型和 REST API 文档
docker-compose.yml  Linux / 本地容器编排
```

## 快速启动

要求 Docker Engine 24+ 和 Compose v2。

```bash
cp .env.example .env
# 务必修改 .env 中的数据库密码和 JWT_SECRET
docker compose up -d --build
docker compose ps
```

访问 `http://localhost:5001`。后端在 Compose 网络内由 Nginx 反向代理，
同时可通过 `http://localhost:39999` 直接访问 API。数据库和 Redis 不暴露端口。

停止服务：

```bash
docker compose down
```

如需同时拉起第三方系统容器：

```bash
docker compose --profile integrations up -d
```

| 服务 | 地址 | 用途 |
|---|---|---|
| WhiteHat Hub | `http://localhost:5001` | 主平台 |
| CTFd | `http://localhost:5004` | 挑战与积分同步 |
| Taiga API | `http://localhost:5005` | 项目协作同步 |
| Flarum | `http://localhost:5006` | 外部论坛同步 |
| DefectDojo | `http://localhost:5007` | 漏洞生命周期同步 |

第三方产品首次运行仍需按各自官方部署文档完成管理员初始化和 API Token
配置。主平台在它们不可用时仍可独立运行，管理员可通过
`GET /api/admin/integrations` 查看连通性。生产环境建议将第三方系统拆分到
独立数据库与主机，并固定镜像版本。

## 测试账号

首次启动会幂等创建以下账号。密码可通过 `.env` 覆盖。

| 角色 | 用户名 | 默认密码 |
|---|---|---|
| 白帽研究员 | `whitehat` | `WhiteHat@123` |
| 企业管理员 | `acme` | `Company@123` |
| 平台管理员 | `admin` | `Admin@123456` |

生产环境第一次登录后应立即修改所有初始化密码，并关闭或替换示例数据。

## 本地开发

后端要求 Java 21、Maven 3.9、PostgreSQL 16 和 Redis 7：

```bash
cd backend
mvn spring-boot:run
```

前端要求 Node.js 20+：

```bash
cd frontend
npm install
npm run dev
```

Vite 开发服务器为 `http://localhost:5173`，并将 `/api` 代理到
`http://localhost:8080`。

## 关键业务规则

- 仅认证企业可发布任务，只有任务成员可提交日报和漏洞。
- 低/中/高/严重漏洞确认后分别奖励 10/50/200/500 分。
- 漏洞终审和积分发放处于同一事务，唯一约束保证一个漏洞只奖励一次。
- 所有测试必须限定在任务声明的资产、时间和方法范围内。
- 前端角色控制仅用于体验，最终授权统一由 Spring Security 服务端执行。

## 生产部署清单

1. 使用至少 32 字节随机 JWT 密钥并通过 Secret Manager 注入。
2. 为 PostgreSQL/Redis 启用认证、TLS、备份与最小网络暴露。
3. 在前置网关启用 HTTPS、速率限制、WAF 和请求日志脱敏。
4. 对上传文件接入杀毒/沙箱扫描和独立对象存储，不直接公开执行权限。
5. 固定所有镜像版本，建立依赖与容器镜像漏洞扫描。
6. 为登录、企业认证、任务范围变更、漏洞审核和积分调整补充审计日志。
7. 第三方同步采用 Outbox + 重试队列；API Token 使用独立低权限账号。

## 当前边界

这是可运行的企业级 MVP，而非四个外部项目的源码合并包。CTFd、Taiga、
Flarum、DefectDojo 通过隔离适配器和可选容器接入。正式上线前还需按组织
流程补充企业实名材料、支付结算、消息通知、内容风控、审计留存和灾备演练。
