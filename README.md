# My Turborepo Project

这是一个基于 **Turborepo** 构建的高性能全栈 **Monorepo** 项目，旨在通过高度整合的前后端架构，提供极致的开发体验与代码复用能力。

### 🚀 核心亮点

*   **全栈 TypeScript 覆盖**：通过 `@repo/types` 共享包，实现了从数据库模型（Prisma）到 NestJS 后端，再到 React 前端的全链路类型安全。
*   **强大的后端架构**：`apps/api` 基于 **NestJS**，内置了标准化的响应拦截器（Interceptor）与全局异常过滤器（Filter），确保 API 接口的高一致性。
*   **现代化的前端体系**：集成了 **React** 后台管理系统 (`admin`) 及用户端应用，封装了健壮的 Axios 请求拦截器与业务工具类。
*   **工程化规范**：统一管理 ESLint、TypeScript 配置及 UI 组件库，借助 Turborepo 的缓存技术显著提升构建速度。

---

### 📂 项目结构

- `apps/api`: 基于 NestJS 的 RESTful API 
- `apps/web/admin`: 基于 React 的后台管理系统
- `apps/web/clientWeb`: 客户端展示端
- `packages/types`: 共享类型定义
- `packages/ui`: 共享组件库
- `packages/eslint-config`: 共享代码规范
- `packages/typescript-config`: 共享 TS 配置

### 🛠️ 技术栈

- **Monorepo**: Turborepo
- **包管理**: pnpm
- **后端**: NestJS + Prisma (ORM)
- **前端**: React + Vite + Axios
- **语言**: TypeScript
