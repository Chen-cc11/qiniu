# API测试工具配置建议

## 问题分析
你的API测试工具返回400错误 "No file found in request"，但curl可以成功上传。这说明问题出在API测试工具的配置上。

## 解决方案

### 1. 检查字段名
确保你的API测试工具中，form-data的字段名设置为以下之一：
- `file` (推荐)
- `image`
- `upload`

### 2. 检查Content-Type头
**不要手动设置Content-Type头！** 让工具自动设置：
- 移除手动设置的 `Content-Type: multipart/form-data`
- 让工具自动生成正确的boundary

### 3. 正确的配置示例

#### Postman/Insomnia配置：
```
Method: POST
URL: http://localhost:8080/api/v1/upload/image
Body: form-data
字段名: file
类型: File
值: 选择你的图片文件
```

#### curl命令：
```bash
curl -X POST -F "file=@your_image.png" http://localhost:8080/api/v1/upload/image
```

### 4. 常见错误配置

❌ **错误配置1**: 手动设置Content-Type
```
Content-Type: multipart/form-data
```

✅ **正确配置**: 让工具自动设置
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

❌ **错误配置2**: 字段名错误
```
字段名: image_file
字段名: upload_file
```

✅ **正确配置**: 使用支持的字段名
```
字段名: file
字段名: image
字段名: upload
```

### 5. 测试步骤

1. 在API测试工具中：
   - 选择POST方法
   - URL: `http://localhost:8080/api/v1/upload/image`
   - Body类型: `form-data`
   - 添加字段：`file` (类型: File)
   - 选择图片文件
   - **不要设置任何Header**

2. 发送请求

3. 预期响应：
```json
{
    "image_url": "http://localhost:8080/uploads/images/1758985412_test1.png",
    "filename": "1758985412_test1.png",
    "size": 5,
    "message": "Image uploaded successfully"
}
```

## 调试信息
如果仍然有问题，服务器会输出调试信息：
```
Debug: Found part - FormName: 'file', FileName: 'your_image.png'
```

这可以帮助确认multipart解析是否正常工作。

