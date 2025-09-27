# 3D模型生成API接口调用示例

## 基础信息

- **服务器地址**: `http://localhost:8080`
- **API版本**: v1
- **内容类型**: `application/json`

## 1. 健康检查

### GET /health

检查服务器状态

**请求示例:**
```bash
curl -X GET http://localhost:8080/health
```

**响应示例:**
```json
{
  "status": "ok",
  "timestamp": 1695800000,
  "version": "v1.0.0",
  "message": "3D Model Generator Backend is running"
}
```

## 2. 文本生成3D模型

### POST /api/v1/generate/text

从文本描述生成3D模型

**请求体:**
```json
{
  "prompt": "一只可爱的小猫，卡通风格，3D模型",
  "result_format": "obj",
  "enable_pbr": true,
  "face_count": 1000,
  "generate_type": "standard"
}
```

**参数说明:**
- `prompt` (必填): 文本描述，用于生成3D模型
- `result_format` (可选): 输出格式，支持 "obj", "gltf", "fbx"
- `enable_pbr` (可选): 是否启用PBR材质，默认false
- `face_count` (可选): 面数限制，默认1000
- `generate_type` (可选): 生成类型，支持 "standard", "pro", "rapid"

**请求示例:**
```bash
curl -X POST http://localhost:8080/api/v1/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫，卡通风格，3D模型",
    "result_format": "obj",
    "enable_pbr": true,
    "face_count": 1000
  }'
```

**响应示例:**
```json
{
  "job_id": "20230927125500-abc12345",
  "status": "pending",
  "message": "Generation job created successfully",
  "estimated_time": 300
}
```

## 3. 图片生成3D模型

### POST /api/v1/generate/image

从图片生成3D模型

**请求体:**
```json
{
  "image_url": "https://example.com/image.jpg",
  "result_format": "gltf",
  "enable_pbr": true,
  "face_count": 2000,
  "generate_type": "pro"
}
```

**参数说明:**
- `image_url` (必填): 图片URL地址
- `result_format` (可选): 输出格式，支持 "obj", "gltf", "fbx"
- `enable_pbr` (可选): 是否启用PBR材质，默认false
- `face_count` (可选): 面数限制，默认1000
- `generate_type` (可选): 生成类型，支持 "standard", "pro", "rapid"

**请求示例:**
```bash
curl -X POST http://localhost:8080/api/v1/generate/image \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/cat.jpg",
    "result_format": "gltf",
    "enable_pbr": true,
    "face_count": 2000
  }'
```

**响应示例:**
```json
{
  "job_id": "20230927125501-def67890",
  "status": "pending",
  "message": "Generation job created successfully",
  "estimated_time": 240
}
```

## 4. Base64图片生成3D模型

### POST /api/v1/generate/image

使用Base64编码的图片生成3D模型

**请求体:**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "result_format": "obj",
  "enable_pbr": false,
  "face_count": 1500
}
```

**参数说明:**
- `image_base64` (必填): Base64编码的图片数据
- 其他参数同图片URL生成

**请求示例:**
```bash
curl -X POST http://localhost:8080/api/v1/generate/image \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "result_format": "obj",
    "enable_pbr": false
  }'
```

## 5. 查询生成状态

### GET /api/v1/generate/status/{job_id}

查询3D模型生成任务状态

**路径参数:**
- `job_id`: 任务ID

**请求示例:**
```bash
curl -X GET http://localhost:8080/api/v1/generate/status/20230927125500-abc12345
```

**响应示例:**
```json
{
  "job_id": "20230927125500-abc12345",
  "status": "completed",
  "progress": 100,
  "result_files": [
    {
      "type": "obj",
      "url": "https://storage.example.com/models/cat.obj",
      "preview_image_url": "https://storage.example.com/previews/cat.jpg"
    },
    {
      "type": "mtl",
      "url": "https://storage.example.com/models/cat.mtl",
      "preview_image_url": ""
    }
  ],
  "error_msg": "",
  "created_at": "2023-09-27T12:55:00Z",
  "updated_at": "2023-09-27T13:00:00Z"
}
```

**状态说明:**
- `pending`: 等待处理
- `processing`: 正在生成
- `completed`: 生成完成
- `failed`: 生成失败

## 6. 模型评估

### POST /api/v1/evaluate/

对生成的3D模型进行评估

**请求体:**
```json
{
  "job_id": "20230927125500-abc12345",
  "quality_score": 4,
  "accuracy_score": 5,
  "speed_score": 3,
  "feedback": "模型质量很好，但生成速度较慢"
}
```

**参数说明:**
- `job_id` (必填): 要评估的任务ID
- `quality_score` (必填): 质量评分 1-5分
- `accuracy_score` (必填): 准确度评分 1-5分
- `speed_score` (必填): 速度评分 1-5分
- `feedback` (可选): 用户反馈

**请求示例:**
```bash
curl -X POST http://localhost:8080/api/v1/evaluate/ \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "20230927125500-abc12345",
    "quality_score": 4,
    "accuracy_score": 5,
    "speed_score": 3,
    "feedback": "模型质量很好，但生成速度较慢"
  }'
```

**响应示例:**
```json
{
  "evaluation_id": "eval-20230927130000-xyz789",
  "overall_score": 4.0,
  "message": "Evaluation submitted successfully"
}
```

## 7. 查询评估状态

### GET /api/v1/evaluate/{evaluation_id}

查询模型评估状态

**路径参数:**
- `evaluation_id`: 评估ID

**请求示例:**
```bash
curl -X GET http://localhost:8080/api/v1/evaluate/eval-20230927130000-xyz789
```

**响应示例:**
```json
{
  "evaluation_id": "eval-20230927130000-xyz789",
  "status": "completed",
  "overall_score": 4.0,
  "message": "Evaluation completed"
}
```

## 8. 用户信息

### GET /api/v1/users/profile

获取用户信息

**请求示例:**
```bash
curl -X GET http://localhost:8080/api/v1/users/profile
```

**响应示例:**
```json
{
  "user_id": "user-12345",
  "email": "user@example.com",
  "name": "张三",
  "created_at": "2023-09-27T10:00:00Z"
}
```

## 9. 生成历史

### GET /api/v1/users/history

获取用户生成历史

**查询参数:**
- `limit` (可选): 限制返回数量，默认10
- `offset` (可选): 偏移量，默认0

**请求示例:**
```bash
curl -X GET "http://localhost:8080/api/v1/users/history?limit=5&offset=0"
```

**响应示例:**
```json
[
  {
    "id": "20230927125500-abc12345",
    "user_id": "user-12345",
    "prompt": "一只可爱的小猫，卡通风格，3D模型",
    "input_type": "text",
    "status": "completed",
    "result_files": [
      {
        "type": "obj",
        "url": "https://storage.example.com/models/cat.obj",
        "preview_image_url": "https://storage.example.com/previews/cat.jpg"
      }
    ],
    "created_at": "2023-09-27T12:55:00Z",
    "completed_at": "2023-09-27T13:00:00Z"
  }
]
```

## 10. 管理统计

### GET /api/v1/admin/stats

获取系统统计信息

**请求示例:**
```bash
curl -X GET http://localhost:8080/api/v1/admin/stats
```

**响应示例:**
```json
{
  "total_jobs": 150,
  "completed_jobs": 120,
  "failed_jobs": 5,
  "average_score": 4.2,
  "api_call_count": 500,
  "cache_hit_rate": 0.75,
  "average_time": 280
}
```

## 11. 任务管理

### GET /api/v1/admin/jobs

获取所有任务列表

**查询参数:**
- `limit` (可选): 限制返回数量，默认20
- `offset` (可选): 偏移量，默认0
- `status` (可选): 按状态筛选

**请求示例:**
```bash
curl -X GET "http://localhost:8080/api/v1/admin/jobs?limit=10&status=completed"
```

**响应示例:**
```json
[
  {
    "id": "20230927125500-abc12345",
    "user_id": "user-12345",
    "prompt": "一只可爱的小猫，卡通风格，3D模型",
    "input_type": "text",
    "status": "completed",
    "created_at": "2023-09-27T12:55:00Z",
    "completed_at": "2023-09-27T13:00:00Z"
  }
]
```

## 错误响应

所有接口在出错时都会返回统一的错误格式：

```json
{
  "error": "错误类型",
  "message": "详细错误信息",
  "code": 400
}
```

**常见错误码:**
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## JavaScript调用示例

```javascript
// 文本生成3D模型
async function generateFromText(prompt) {
  const response = await fetch('http://localhost:8080/api/v1/generate/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      result_format: 'obj',
      enable_pbr: true,
      face_count: 1000
    })
  });
  
  return await response.json();
}

// 查询任务状态
async function getJobStatus(jobId) {
  const response = await fetch(`http://localhost:8080/api/v1/generate/status/${jobId}`);
  return await response.json();
}

// 使用示例
generateFromText('一只可爱的小猫')
  .then(result => {
    console.log('任务创建成功:', result);
    return getJobStatus(result.job_id);
  })
  .then(status => {
    console.log('任务状态:', status);
  })
  .catch(error => {
    console.error('错误:', error);
  });
```

## Python调用示例

```python
import requests
import time

# 文本生成3D模型
def generate_from_text(prompt):
    url = 'http://localhost:8080/api/v1/generate/text'
    data = {
        'prompt': prompt,
        'result_format': 'obj',
        'enable_pbr': True,
        'face_count': 1000
    }
    response = requests.post(url, json=data)
    return response.json()

# 查询任务状态
def get_job_status(job_id):
    url = f'http://localhost:8080/api/v1/generate/status/{job_id}'
    response = requests.get(url)
    return response.json()

# 使用示例
if __name__ == '__main__':
    # 创建生成任务
    result = generate_from_text('一只可爱的小猫')
    print('任务创建成功:', result)
    
    job_id = result['job_id']
    
    # 轮询任务状态
    while True:
        status = get_job_status(job_id)
        print(f'任务状态: {status["status"]}, 进度: {status["progress"]}%')
        
        if status['status'] in ['completed', 'failed']:
            break
            
        time.sleep(5)  # 等待5秒后再次查询
```

## 注意事项

1. **异步处理**: 3D模型生成是异步过程，需要轮询状态接口获取结果
2. **文件格式**: 支持OBJ、GLTF、FBX等主流3D格式
3. **图片要求**: 图片URL需要可公开访问，支持JPG、PNG格式
4. **面数限制**: 建议根据需求设置合适的面数，影响生成质量和速度
5. **缓存机制**: 相同输入会使用缓存结果，提高响应速度
6. **错误处理**: 请妥善处理各种错误情况，特别是网络超时


