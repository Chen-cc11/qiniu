 运行前端应用

**打开一个新的终端窗口**，进入前端目录，安装依赖并启动开发服务器。

```bash
# 进入前端目录
cd frontend

# 安装依赖 (仅首次运行时需要)
npm install

# 启动前端开发服务器 (服务将运行在 http://localhost:5173)
npm run dev
```

现在，您可以通过在浏览器中打开 `http://localhost:5173` 来访问Web应用了。前端已经配置了代理，会自动将API请求转发到后端服务器。

---

## 后端接口说明

为了保证前后端顺利联调，前端应用期望后端能提供以下接口。所有接口的请求和响应体均为 `application/json` 格式（文件上传除外）。

### 1. 图片上传

- **Endpoint**: `/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **请求体**:
  - `file`: 用户上传的图片文件 (JPG, PNG, WEBP等)。
- **成功响应 (Code: 0)**:
  ```json
  {
    "code": 0,
    "data": {
      "imageToken": "a-unique-token-for-the-uploaded-image"
    },
    "msg": "success"
  }
  ```

### 2. 创建“文本生成模型”任务

- **Endpoint**: `/tasks/text-to-model`
- **Method**: `POST`
- **请求体**:
  ```json
  {
    "prompt": "一个现代风格的丝绒沙发",
    "faceLimit": 25000,
    "texture": true,
    "pbr": true,
    "textureQuality": "standard", // or "detailed"
    "quad": true // or false
  }
  ```
- **成功响应 (Code: 0)**:
  ```json
  {
    "code": 0,
    "data": {
      "taskID": "some-unique-task-id-12345"
    },
    "msg": "success"
  }
  ```

### 3. 创建“图片生成模型”任务

- **Endpoint**: `/tasks/image-to-model`
- **Method**: `POST`
- **请求体**:
  ```json
  {
    "fileToken": "a-unique-token-for-the-uploaded-image",
    "faceLimit": 25000,
    "texture": true,
    "pbr": true,
    "textureQuality": "original_image",
    "quad": true // or false
  }
  ```
- **成功响应 (Code: 0)**:
  ```json
  {
    "code": 0,
    "data": {
      "taskID": "some-unique-task-id-67890"
    },
    "msg": "success"
  }
  ```

### 4. 查询任务状态

- **Endpoint**: `/tasks/status/:taskId`
- **Method**: `GET`
- **URL 参数**:
  - `taskId`: 创建任务时返回的 `taskID`。
- **成功响应 (Code: 0)**:
  - **处理中**:
    ```json
    {
      "code": 0,
      "data": {
        "taskID": "some-unique-task-id-12345",
        "status": "processing", // or "pending"
        "progress": 50,
        "result": null
      },
      "msg": "success"
    }
    ```
  - **已完成**:
    ```json
    {
      "code": 0,
      "data": {
        "taskID": "some-unique-task-id-12345",
        "status": "completed",
        "progress": 100,
        "result": {
          "modelURL": "https://example.com/path/to/model.glb",
          "thumbnailURL": "https://example.com/path/to/thumbnail.jpg"
        }
      },
      "msg": "success"
    }
    ```
  - **失败**:
    ```json
    {
      "code": 0,
      "data": {
        "taskID": "some-unique-task-id-12345",
        "status": "failed",
        "progress": 0,
        "error": "生成失败的具体原因"
      },
      "msg": "success"
    }
    ```
