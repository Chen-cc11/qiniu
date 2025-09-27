# 用户认证功能使用指南

## 概述

3D模型生成器现在支持用户认证功能，所有生成相关的API都需要用户登录后才能使用。

## 认证方式

- **认证类型**: JWT (JSON Web Token)
- **用户标识**: 电子邮箱
- **密码要求**: 最少6位字符
- **Token有效期**: 24小时

## API接口

### 1. 用户注册

**POST** `/api/v1/auth/register`

```json
{
    "email": "user@example.com",
    "password": "password123",
    "name": "用户名"
}
```

**响应**:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "20250127123456-ABCDEFGH",
        "email": "user@example.com",
        "name": "用户名",
        "is_active": true,
        "created_at": "2025-01-27T12:34:56Z"
    },
    "expires_at": "2025-01-28T12:34:56Z",
    "message": "注册成功"
}
```

### 2. 用户登录

**POST** `/api/v1/auth/login`

```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**响应**: 同注册响应

### 3. 获取用户资料

**GET** `/api/v1/auth/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
    "id": "20250127123456-ABCDEFGH",
    "email": "user@example.com",
    "name": "用户名",
    "is_active": true,
    "created_at": "2025-01-27T12:34:56Z"
}
```

### 4. 更新用户资料

**PUT** `/api/v1/auth/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
    "name": "新用户名"
}
```

### 5. 修改密码

**POST** `/api/v1/auth/change-password`

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
    "old_password": "旧密码",
    "new_password": "新密码123"
}
```

### 6. 用户登出

**POST** `/api/v1/auth/logout`

**请求头**:
```
Authorization: Bearer <token>
```

## 受保护的API

以下API现在需要认证才能访问：

- `POST /api/v1/generate/text` - 从文本生成3D模型
- `POST /api/v1/generate/image` - 从图片生成3D模型
- `POST /api/v1/generate/uploaded-image` - 从上传图片生成3D模型
- `POST /api/v1/upload/image` - 上传图片
- `GET /api/v1/jobs` - 获取用户任务列表
- `GET /api/v1/jobs/:job_id` - 获取任务状态
- `GET /api/v1/jobs/:job_id/download` - 下载3D模型
- `POST /api/v1/evaluations` - 提交评估
- `GET /api/v1/evaluations` - 获取用户评估
- `GET /api/v1/statistics` - 获取统计信息

## 使用示例

### JavaScript/前端

```javascript
// 1. 用户注册
const register = async (email, password, name) => {
    const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name })
    });
    return await response.json();
};

// 2. 用户登录
const login = async (email, password) => {
    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    });
    return await response.json();
};

// 3. 使用token调用受保护的API
const generateModel = async (prompt, token) => {
    const response = await fetch('/api/v1/generate/text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, input_type: 'text' })
    });
    return await response.json();
};
```

### PowerShell/测试

```powershell
# 1. 注册用户
$registerData = @{
    email = "test@example.com"
    password = "password123"
    name = "测试用户"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/register" -Method POST -Body $registerData -ContentType "application/json"
$token = $registerResponse.token

# 2. 使用token调用API
$headers = @{
    "Authorization" = "Bearer $token"
}

$generateData = @{
    prompt = "一个简单的立方体"
    input_type = "text"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/generate/text" -Method POST -Body $generateData -ContentType "application/json" -Headers $headers
```

## 错误处理

### 认证错误

- **401 Unauthorized**: Token无效或已过期
- **400 Bad Request**: 请求参数错误

### 常见错误响应

```json
{
    "error": "unauthorized",
    "message": "用户未认证"
}
```

```json
{
    "error": "login_failed",
    "message": "邮箱或密码错误"
}
```

```json
{
    "error": "registration_failed",
    "message": "邮箱已被注册"
}
```

## 安全注意事项

1. **JWT密钥**: 生产环境中请修改`config.json`中的`jwtSecret`
2. **HTTPS**: 生产环境建议使用HTTPS传输
3. **密码强度**: 建议实施更强的密码策略
4. **Token存储**: 客户端应安全存储JWT token
5. **Token刷新**: 实现token自动刷新机制

## 测试

运行测试脚本验证认证功能：

```powershell
.\test_auth.ps1
```

这将测试注册、登录、获取资料和生成模型等完整流程。
