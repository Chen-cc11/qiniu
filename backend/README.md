# 3D模型生成后端服务

基于腾讯云混元生3D API的3D模型生成后端服务，支持文本和图片输入，提供完整的评估系统和API调用优化功能。

## 项目特性

### 核心功能
- **文本生成3D**：支持中文提示词生成3D模型
- **图片生成3D**：支持图片URL和Base64输入
- **多格式输出**：支持OBJ、GLB、STL、USDZ、FBX、MP4等格式
- **异步处理**：任务队列管理，支持实时状态查询
- **结果缓存**：智能缓存机制，减少重复API调用

### 评估系统
- **多维度评分**：质量、准确性、速度三维评分
- **统计分析**：用户评分统计和趋势分析
- **A/B测试**：支持不同API版本的对比测试
- **持续优化**：基于评估数据的模型优化

### API优化
- **缓存策略**：Redis缓存，支持相似度检测
- **限流控制**：防止API滥用，保护服务稳定
- **智能降级**：根据负载自动选择API版本
- **成本控制**：API调用统计和成本分析

## 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   后端服务      │    │   腾讯云API     │
│                 │    │                 │    │                 │
│  - 文本输入     │───▶│  - Gin框架      │───▶│  - 混元生3D     │
│  - 图片上传     │    │  - 异步处理     │    │  - 多版本API    │
│  - 结果展示     │    │  - 缓存优化     │    │  - 结果存储     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   数据存储      │
                       │                 │
                       │  - SQLite       │
                       │  - Redis        │
                       │  - 文件存储     │
                       └─────────────────┘
```

## 快速开始

### 环境要求
- Go 1.21+
- Redis 6.0+ (可选，用于缓存)
- 腾讯云账号和API密钥

### 安装依赖
```bash
go mod tidy
```

### 配置环境变量
```bash
cp env.example .env
# 编辑.env文件，填入你的腾讯云API密钥
```

### 启动服务

**方法一：使用启动脚本（推荐）**
```bash
# Windows批处理
start.bat

# PowerShell
.\start.ps1
```

**方法二：直接运行**
```bash
# 简化版（避免CGO依赖问题）
go run cmd/server/main_simple.go

# 完整版（需要CGO支持）
go run cmd/server/main.go
```

### 启动脚本说明

项目提供了多种启动方式来解决不同环境下的依赖问题：

- `start.bat` / `start.ps1`: 自动检查环境并启动简化版服务器
- `main_simple.go`: 简化版服务器，无需数据库和Redis依赖
- `main.go`: 完整版服务器，包含所有功能但需要CGO支持

**推荐使用启动脚本**，它会自动处理环境检查和依赖问题。

服务将在 `http://localhost:8080` 启动

## API文档

### 生成3D模型

#### 文本生成
```http
POST /api/v1/generate/text
Content-Type: application/json

{
  "prompt": "一只可爱的小猫",
  "result_format": "obj",
  "enable_pbr": true
}
```

#### 图片生成
```http
POST /api/v1/generate/image
Content-Type: application/json

{
  "image_url": "https://example.com/image.jpg",
  "result_format": "glb",
  "enable_pbr": true
}
```

### 查询任务状态
```http
GET /api/v1/jobs/{job_id}
```

### 提交评估
```http
POST /api/v1/evaluations
Content-Type: application/json

{
  "job_id": "job_123",
  "quality_score": 5,
  "accuracy_score": 4,
  "speed_score": 5,
  "feedback": "生成效果很好！"
}
```

### 获取统计信息
```http
GET /api/v1/statistics
```

## 项目结构

```
3d-model-generator-backend/
├── cmd/
│   └── server/           # 主程序入口
├── config/               # 配置管理
├── internal/
│   ├── handlers/         # HTTP处理器
│   ├── services/         # 业务逻辑服务
│   ├── models/           # 数据模型
│   ├── middleware/       # 中间件
│   ├── cache/           # 缓存服务
│   └── evaluation/      # 评估系统
├── pkg/
│   └── tencentcloud/    # 腾讯云API封装
├── docs/                # 文档
├── go.mod
├── go.sum
└── README.md
```

## 配置说明

### 环境变量
- `TENCENT_SECRET_ID`: 腾讯云SecretId
- `TENCENT_SECRET_KEY`: 腾讯云SecretKey
- `TENCENT_REGION`: 腾讯云地域
- `REDIS_ADDR`: Redis地址
- `DATABASE_DSN`: 数据库连接字符串

### 缓存配置
- 默认缓存时间：24小时
- 清理间隔：1小时
- 支持相似度检测和结果复用

## 评估系统设计

### 评分维度
1. **质量评分** (1-5分)：模型细节和逼真度
2. **准确性评分** (1-5分)：与输入描述的匹配度
3. **速度评分** (1-5分)：生成速度满意度

### 统计指标
- 平均评分趋势
- 评分分布分析
- 用户反馈统计
- A/B测试结果

## API调用优化

### 缓存策略
- **提示词缓存**：相同提示词直接返回缓存结果
- **图片哈希缓存**：相同图片内容复用结果
- **结果缓存**：24小时有效期，自动清理

### 限流控制
- IP级别限流：100次/分钟
- 用户级别限流：基于用户配额
- 智能降级：高负载时使用快速版API

### 成本优化
- API调用统计
- 成本分析报告
- 智能API选择

## 部署说明

### Docker部署
```bash
# 构建镜像
docker build -t 3d-model-generator-backend .

# 运行容器
docker run -p 8080:8080 --env-file .env 3d-model-generator-backend
```

### 生产环境
1. 配置负载均衡
2. 设置Redis集群
3. 配置监控和日志
4. 设置备份策略

## 监控和日志

### 健康检查
```http
GET /health
```

### 指标监控
- API调用次数
- 缓存命中率
- 平均响应时间
- 错误率统计

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系开发团队。
