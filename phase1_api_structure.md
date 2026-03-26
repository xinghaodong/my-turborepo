# 第一阶段完成 - API 后端搭建总结

## 📁 新增文件结构

```
apps/api/src/
├── main.ts                            # 入口（全局 API 前缀 /api + 校验管道）
├── app.module.ts                      # 根模块（全局 JWT 守卫）
├── app.controller.ts                  # 根控制器
├── app.service.ts                     # 根服务
│
├── prisma/
│   ├── prisma.module.ts               # Prisma 全局模块
│   └── prisma.service.ts              # 数据库连接管理
│
├── auth/                              # 🔐 认证模块
│   ├── auth.module.ts
│   ├── auth.service.ts                # 注册/登录/获取用户信息
│   ├── auth.controller.ts            # POST /api/auth/register, login, GET profile
│   ├── jwt.strategy.ts               # JWT 验证策略
│   ├── dto/
│   │   └── auth.dto.ts               # 注册/登录 DTO
│   ├── guards/
│   │   ├── jwt-auth.guard.ts         # JWT 认证守卫（全局）
│   │   └── roles.guard.ts           # 角色权限守卫
│   └── decorators/
│       ├── public.decorator.ts       # @Public() - 跳过认证
│       ├── roles.decorator.ts        # @Roles() - 角色要求
│       └── current-user.decorator.ts # @CurrentUser() - 获取当前用户
│
├── board/                             # 📋 看板模块
│   ├── board.module.ts
│   ├── board.service.ts               # CRUD + 成员管理 + 权限校验
│   ├── board.controller.ts
│   └── dto/
│       └── board.dto.ts
│
├── column/                            # 📊 列模块
│   ├── column.module.ts
│   ├── column.service.ts              # CRUD + 位置排序
│   ├── column.controller.ts
│   └── dto/
│       └── column.dto.ts
│
├── card/                              # 🃏 卡片模块
│   ├── card.module.ts
│   ├── card.service.ts                # CRUD + 跨列拖拽 + 成员分配 + 评论
│   ├── card.controller.ts
│   └── dto/
│       └── card.dto.ts
│
└── user/                              # 👥 用户管理模块（管理员）
    ├── user.module.ts
    ├── user.service.ts                # 用户列表/角色修改/封禁
    └── user.controller.ts
```

## 🔐 权限体系（双层 RBAC）

### 系统角色（SystemRole）
| 角色 | 权限 |
|------|------|
| `SUPER_ADMIN` | 所有权限 + 修改用户角色 |
| `ADMIN` | 用户管理（列表、封禁/解封） |
| `USER` | 普通用户，只能操作自己参与的看板 |

### 看板角色（BoardRole）
| 角色 | 权限 |
|------|------|
| `OWNER` | 完全控制看板（删除、管理成员） |
| `ADMIN` | 管理看板设置和成员 |
| `MEMBER` | 编辑卡片和列 |
| `VIEWER` | 只读查看 |

## 📡 API 接口一览

### 认证（无需登录）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

### 用户（需要登录）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/profile` | 获取当前用户信息 |

### 看板
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/boards` | 创建看板 |
| GET | `/api/boards` | 获取用户所有看板 |
| GET | `/api/boards/:id` | 获取看板详情（含列+卡片） |
| PUT | `/api/boards/:id` | 更新看板 |
| DELETE | `/api/boards/:id` | 删除看板 |
| POST | `/api/boards/:id/members` | 邀请成员 |
| DELETE | `/api/boards/:id/members/:userId` | 移除成员 |

### 列
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/boards/:boardId/columns` | 创建列 |
| PUT | `/api/boards/:boardId/columns/:id` | 更新列 |
| DELETE | `/api/boards/:boardId/columns/:id` | 删除列 |
| PATCH | `/api/boards/:boardId/columns/:id/move` | 移动列 |

### 卡片
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/columns/:columnId/cards` | 创建卡片 |
| GET | `/api/cards/:id` | 获取卡片详情 |
| PUT | `/api/cards/:id` | 更新卡片 |
| PATCH | `/api/cards/:id/move` | 移动/拖拽卡片 |
| DELETE | `/api/cards/:id` | 删除卡片 |
| POST | `/api/cards/:id/assignees` | 分配成员 |
| DELETE | `/api/cards/:id/assignees/:userId` | 移除成员 |
| POST | `/api/cards/:id/comments` | 添加评论 |

### 管理员
| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/users` | ADMIN+ | 用户列表 |
| PATCH | `/api/users/:id/role` | SUPER_ADMIN | 修改角色 |
| PATCH | `/api/users/:id/toggle-active` | ADMIN+ | 封禁/解封 |

## ⚠️ 下一步操作

在运行项目之前，你需要：

1. **确保 PostgreSQL 已安装并运行**
2. **修改 [.env](file:///d:/codeFile/xuexi/React/my-turborepo/apps/api/.env) 中的数据库连接信息**（用户名、密码、数据库名）
3. **创建数据库并执行迁移**：
   ```bash
   npx prisma migrate dev --name init
   ```
4. **启动项目**：
   ```bash
   pnpm run start:dev
   ```
