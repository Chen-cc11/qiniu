# 3D模型生成API快速开始

## 🚀 快速启动

```bash
# 启动服务器
.\start.bat

# 或使用PowerShell
.\start.ps1
```

服务器启动后访问: http://localhost:8080

## 📋 核心API接口

### 1. 文本生成3D模型
```bash
curl -X POST http://localhost:8080/api/v1/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫，卡通风格",
    "result_format": "obj",
    "enable_pbr": true
  }'
```

### 2. 图片生成3D模型
```bash
curl -X POST http://localhost:8080/api/v1/generate/image \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "result_format": "gltf"
  }'
```

### 3. 查询生成状态
```bash
curl -X GET http://localhost:8080/api/v1/generate/status/{job_id}
```

### 4. 健康检查
```bash
curl -X GET http://localhost:8080/health
```

## 🔧 请求参数说明

### 生成参数
- `prompt`: 文本描述（文本生成必填）
- `image_url`: 图片URL（图片生成必填）
- `result_format`: 输出格式 `obj|gltf|fbx`
- `enable_pbr`: 是否启用PBR材质 `true|false`
- `face_count`: 面数限制，默认1000
- `generate_type`: 生成类型 `standard|pro|rapid`

### 状态值
- `pending`: 等待处理
- `processing`: 正在生成
- `completed`: 生成完成
- `failed`: 生成失败

## 📱 前端集成示例

### JavaScript
```javascript
// 生成3D模型
async function generateModel(prompt) {
  const response = await fetch('/api/v1/generate/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, result_format: 'obj' })
  });
  return response.json();
}

// 查询状态
async function checkStatus(jobId) {
  const response = await fetch(`/api/v1/generate/status/${jobId}`);
  return response.json();
}
```

### Python
```python
import requests

# 生成模型
def generate_model(prompt):
    response = requests.post('http://localhost:8080/api/v1/generate/text', 
                           json={'prompt': prompt, 'result_format': 'obj'})
    return response.json()

# 查询状态
def check_status(job_id):
    response = requests.get(f'http://localhost:8080/api/v1/generate/status/{job_id}')
    return response.json()
```

## 🎯 完整工作流程

1. **创建任务** → 调用生成接口获取 `job_id`
2. **轮询状态** → 定期查询状态直到完成
3. **获取结果** → 从状态响应中获取3D文件URL
4. **下载文件** → 使用URL下载3D模型文件

## ⚡ 快速测试

```bash
# 1. 检查服务状态
curl http://localhost:8080/health

# 2. 创建生成任务
curl -X POST http://localhost:8080/api/v1/generate/text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "一个简单的立方体"}'

# 3. 查询任务状态（替换为实际的job_id）
curl http://localhost:8080/api/v1/generate/status/YOUR_JOB_ID
```

## 📚 更多信息

- 详细API文档: [API_EXAMPLES.md](./API_EXAMPLES.md)
- 服务器配置: [config.json](./config.json)
- 项目说明: [README.md](./README.md)


