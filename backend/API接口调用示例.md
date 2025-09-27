# 3D模型生成后端API接口调用示例

## 项目概述
这是一个基于腾讯云混元生3D API的3D模型生成后端服务，支持文本和图片输入，提供完整的评估系统和API调用优化功能。

## 服务地址
- 基础URL: `http://localhost:8080` (根据config.json配置)
- API版本: v1
- 基础路径: `/api/v1`

## 认证说明
当前版本使用简单的用户ID标识，实际生产环境应配置JWT认证。

---

## 1. 健康检查

### 检查服务状态
```http
GET /health
```

**响应示例:**
```json
{
  "status": "ok",
  "timestamp": 1703123456,
  "version": "v1.0.0"
}
```

---

## 2. 3D模型生成接口

### 2.1 文本生成3D模型

**接口地址:** `POST /api/v1/generate/text`

**请求头:**
```
Content-Type: application/json
```

**请求体参数:**
```json
{
  "prompt": "一只可爱的小猫",
  "result_format": "obj",
  "enable_pbr": true,
  "face_count": 1000,
  "generate_type": "standard"
}
```

**参数说明:**
- `prompt` (必填): 文本描述，用于生成3D模型
- `result_format` (可选): 输出格式，支持 "obj", "glb", "stl", "usdz", "fbx", "mp4"
- `enable_pbr` (可选): 是否启用PBR材质，默认false
- `face_count` (可选): 面数限制，默认1000
- `generate_type` (可选): 生成类型，支持 "standard", "pro", "rapid"

**响应示例:**
```json
{
  "job_id": "job_1703123456789-abc12345",
  "status": "processing",
  "message": "Generation job created successfully",
  "estimated_time": 300
}
```

**cURL示例:**
```bash
curl -X POST http://localhost:8080/api/v1/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫",
    "result_format": "obj",
    "enable_pbr": true
  }'
```

### 2.2 图片生成3D模型

**接口地址:** `POST /api/v1/generate/image`

**请求头:**
```
Content-Type: application/json
```

**请求体参数 (方式一 - 图片URL):**
```json
{
  "image_url": "https://example.com/image.jpg",
  "result_format": "glb",
  "enable_pbr": true,
  "face_count": 2000,
  "generate_type": "pro"
}
```

**请求体参数 (方式二 - Base64图片):**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "result_format": "glb",
  "enable_pbr": true,
  "face_count": 2000,
  "generate_type": "pro"
}
```

**参数说明:**
- `image_url` (可选): 图片URL地址
- `image_base64` (可选): Base64编码的图片数据
- 其他参数同文本生成接口

**响应示例:**
```json
{
  "job_id": "job_1703123456789-def67890",
  "status": "processing",
  "message": "Generation job created successfully",
  "estimated_time": 300
}
```

**cURL示例:**
```bash
curl -X POST http://localhost:8080/api/v1/generate/image \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "result_format": "glb",
    "enable_pbr": true
  }'
```

### 2.3 文件上传生成3D模型

**接口地址:** `POST /api/v1/upload/image`

**请求头:**
```
Content-Type: multipart/form-data
```

**请求参数:**
- `file` (必填): 图片文件，支持JPG、JPEG、PNG、WEBP格式，大小限制8MB

**响应示例:**
```json
{
  "image_url": "http://localhost:8080/uploads/images/1703123456_cat.jpg",
  "filename": "1703123456_cat.jpg",
  "size": 1024000,
  "message": "Image uploaded successfully"
}
```

**cURL示例:**
```bash
curl -X POST http://localhost:8080/api/v1/upload/image \
  -F "file=@/path/to/your/image.jpg"
```

**使用上传的图片生成3D模型:**

**接口地址:** `POST /api/v1/generate/uploaded-image`

**请求体:**
```json
{
  "image_url": "http://localhost:8080/uploads/images/1703123456_cat.jpg",
  "result_format": "glb",
  "enable_pbr": true,
  "face_count": 2000,
  "generate_type": "pro"
}
```

**cURL示例:**
```bash
curl -X POST http://localhost:8080/api/v1/generate/uploaded-image \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "http://localhost:8080/uploads/images/1703123456_cat.jpg",
    "result_format": "glb",
    "enable_pbr": true
  }'
```

---

## 3. 任务管理接口

### 3.1 查询任务状态

**接口地址:** `GET /api/v1/jobs/{job_id}`

**路径参数:**
- `job_id`: 任务ID

**响应示例:**
```json
{
  "job_id": "job_1703123456789-abc12345",
  "status": "completed",
  "progress": 100,
  "result_files": [
    {
      "type": "OBJ",
      "url": "https://example.com/model.obj",
      "preview_image_url": "https://example.com/preview.jpg"
    },
    {
      "type": "GLB",
      "url": "https://example.com/model.glb",
      "preview_image_url": "https://example.com/preview.jpg"
    }
  ],
  "created_at": "2023-12-21T10:30:00Z",
  "updated_at": "2023-12-21T10:35:00Z"
}
```

**cURL示例:**
```bash
curl -X GET http://localhost:8080/api/v1/jobs/job_1703123456789-abc12345
```

### 3.2 获取用户任务列表

**接口地址:** `GET /api/v1/jobs`

**查询参数:**
- `limit` (可选): 限制数量，默认10
- `offset` (可选): 偏移量，默认0

**响应示例:**
```json
[
  {
    "id": "job_1703123456789-abc12345",
    "user_id": "anonymous",
    "prompt": "一只可爱的小猫",
    "input_type": "text",
    "status": "completed",
    "result_files": [...],
    "created_at": "2023-12-21T10:30:00Z",
    "updated_at": "2023-12-21T10:35:00Z"
  }
]
```

**cURL示例:**
```bash
curl -X GET "http://localhost:8080/api/v1/jobs?limit=10&offset=0"
```

### 3.3 下载3D模型

**接口地址:** `GET /api/v1/jobs/{job_id}/download`

**路径参数:**
- `job_id`: 任务ID

**查询参数:**
- `file_type` (可选): 文件类型，默认"obj"

**响应:** 直接重定向到下载URL或返回文件流

**cURL示例:**
```bash
curl -X GET "http://localhost:8080/api/v1/jobs/job_1703123456789-abc12345/download?file_type=obj"
```

---

## 4. 评估系统接口

### 4.1 提交评估

**接口地址:** `POST /api/v1/evaluations`

**请求头:**
```
Content-Type: application/json
```

**请求体参数:**
```json
{
  "job_id": "job_1703123456789-abc12345",
  "quality_score": 5,
  "accuracy_score": 4,
  "speed_score": 5,
  "feedback": "生成效果很好！"
}
```

**参数说明:**
- `job_id` (必填): 任务ID
- `quality_score` (必填): 质量评分，1-5分
- `accuracy_score` (必填): 准确性评分，1-5分
- `speed_score` (必填): 速度评分，1-5分
- `feedback` (可选): 用户反馈

**响应示例:**
```json
{
  "evaluation_id": "eval_1703123456789-xyz12345",
  "overall_score": 4.67,
  "message": "Evaluation submitted successfully"
}
```

**cURL示例:**
```bash
curl -X POST http://localhost:8080/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_1703123456789-abc12345",
    "quality_score": 5,
    "accuracy_score": 4,
    "speed_score": 5,
    "feedback": "生成效果很好！"
  }'
```

### 4.2 获取评估统计

**接口地址:** `GET /api/v1/evaluations/stats`

**查询参数:**
- `time_range` (可选): 时间范围，支持 "day", "week", "month", "all"，默认"all"

**响应示例:**
```json
{
  "total_evaluations": 150,
  "average_quality": 4.2,
  "average_accuracy": 4.1,
  "average_speed": 4.3,
  "overall_average": 4.2,
  "score_distribution": {
    "1": 5,
    "2": 10,
    "3": 25,
    "4": 60,
    "5": 50
  }
}
```

**cURL示例:**
```bash
curl -X GET "http://localhost:8080/api/v1/evaluations/stats?time_range=month"
```

### 4.3 获取任务评估

**接口地址:** `GET /api/v1/jobs/{job_id}/evaluation`

**路径参数:**
- `job_id`: 任务ID

**响应示例:**
```json
{
  "id": "eval_1703123456789-xyz12345",
  "job_id": "job_1703123456789-abc12345",
  "user_id": "anonymous",
  "quality_score": 5,
  "accuracy_score": 4,
  "speed_score": 5,
  "overall_score": 4.67,
  "feedback": "生成效果很好！",
  "created_at": "2023-12-21T10:40:00Z"
}
```

**cURL示例:**
```bash
curl -X GET http://localhost:8080/api/v1/jobs/job_1703123456789-abc12345/evaluation
```

### 4.4 获取用户评估列表

**接口地址:** `GET /api/v1/evaluations`

**查询参数:**
- `limit` (可选): 限制数量，默认10
- `offset` (可选): 偏移量，默认0

**响应示例:**
```json
[
  {
    "id": "eval_1703123456789-xyz12345",
    "job_id": "job_1703123456789-abc12345",
    "user_id": "anonymous",
    "quality_score": 5,
    "accuracy_score": 4,
    "speed_score": 5,
    "overall_score": 4.67,
    "feedback": "生成效果很好！",
    "created_at": "2023-12-21T10:40:00Z"
  }
]
```

**cURL示例:**
```bash
curl -X GET "http://localhost:8080/api/v1/evaluations?limit=10&offset=0"
```

---

## 5. A/B测试接口

### 5.1 创建A/B测试

**接口地址:** `POST /api/v1/ab-tests`

**请求头:**
```
Content-Type: application/json
```

**请求体参数:**
```json
{
  "test_name": "api_version_test",
  "variant_a": "standard",
  "variant_b": "pro",
  "description": "测试标准版和Pro版API的效果差异",
  "traffic_split": 0.5
}
```

**参数说明:**
- `test_name` (必填): 测试名称
- `variant_a` (必填): 变体A名称
- `variant_b` (必填): 变体B名称
- `description` (可选): 测试描述
- `traffic_split` (可选): 流量分配比例，默认0.5

**响应示例:**
```json
{
  "message": "AB test created successfully"
}
```

**cURL示例:**
```bash
curl -X POST http://localhost:8080/api/v1/ab-tests \
  -H "Content-Type: application/json" \
  -d '{
    "test_name": "api_version_test",
    "variant_a": "standard",
    "variant_b": "pro",
    "description": "测试标准版和Pro版API的效果差异"
  }'
```

### 5.2 获取A/B测试结果

**接口地址:** `GET /api/v1/ab-tests/{test_name}/result`

**路径参数:**
- `test_name`: 测试名称

**响应示例:**
```json
{
  "test_name": "api_version_test",
  "variant_a_stats": {
    "name": "standard",
    "total_users": 50,
    "average_score": 4.1,
    "conversion_rate": 0.85
  },
  "variant_b_stats": {
    "name": "pro",
    "total_users": 50,
    "average_score": 4.5,
    "conversion_rate": 0.92
  },
  "winner": "variant_b",
  "confidence_level": 0.95
}
```

**cURL示例:**
```bash
curl -X GET http://localhost:8080/api/v1/ab-tests/api_version_test/result
```

---

## 6. 统计信息接口

### 6.1 获取统计信息

**接口地址:** `GET /api/v1/statistics`

**响应示例:**
```json
{
  "total_jobs": 1000,
  "completed_jobs": 950,
  "failed_jobs": 50,
  "average_score": 4.2,
  "api_call_count": 1200,
  "cache_hit_rate": 0.75,
  "average_time": 280
}
```

**cURL示例:**
```bash
curl -X GET http://localhost:8080/api/v1/statistics
```

---

## 7. 错误响应格式

所有接口在出错时都会返回统一的错误格式：

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**常见HTTP状态码:**
- `200`: 成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 8. 完整调用流程示例

### 文本生成3D模型的完整流程：

1. **提交生成任务**
```bash
curl -X POST http://localhost:8080/api/v1/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫",
    "result_format": "obj",
    "enable_pbr": true
  }'
```

2. **轮询任务状态**
```bash
curl -X GET http://localhost:8080/api/v1/jobs/job_1703123456789-abc12345
```

3. **下载生成的模型**
```bash
curl -X GET "http://localhost:8080/api/v1/jobs/job_1703123456789-abc12345/download?file_type=obj"
```

4. **提交评估**
```bash
curl -X POST http://localhost:8080/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_1703123456789-abc12345",
    "quality_score": 5,
    "accuracy_score": 4,
    "speed_score": 5,
    "feedback": "生成效果很好！"
  }'
```

---

## 9. 注意事项

1. **服务启动**: 确保服务已启动，默认端口为8080
2. **配置检查**: 确保腾讯云API密钥配置正确
3. **异步处理**: 3D模型生成是异步过程，需要通过轮询获取结果
4. **缓存机制**: 相同提示词或图片会返回缓存结果
5. **限流控制**: 系统有IP级别限流，每分钟100次请求
6. **文件格式**: 支持多种3D文件格式输出
7. **评分系统**: 评估采用1-5分制，综合评分为三个维度的平均值

---

## 10. 开发环境配置

### 环境变量配置 (.env文件):
```
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_REGION=ap-guangzhou
REDIS_ADDR=localhost:6379
DATABASE_DSN=3d_models.db
```

### 启动服务:
```bash
# 使用启动脚本（推荐）
./start.bat  # Windows
./start.ps1  # PowerShell

# 或直接运行
go run cmd/server/main_simple.go
```
