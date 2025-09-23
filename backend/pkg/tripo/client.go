package tripo

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Chen-cc11/qiniu/backend/internal/models"
)

// TripoClient
//
// @Description: Tripo3D API客户端
type TripoClient struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewTripoClient
//
// @Description: 创建新的Tripo3D客户端
func NewTripoClient(apiKey, baseURL string) *TripoClient {
	return &TripoClient{
		apiKey:  apiKey,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 100,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

// CreateTextToModelTask
//
// @Description: 创建文本转3D模型任务
func (c *TripoClient) CreateTextToModelTask(ctx context.Context, req models.TextToModelRequest) (*models.TripoTaskResponse, error) {
	payload := map[string]interface{}{
		"type": "text_to_model",
	}
	// 设置默认值
	if req.ModelVersion == "" {
		req.ModelVersion = "v2.5-20250123"
	}
	if req.TextureQuality == "" {
		req.TextureQuality = "standard"
	}
	// 添加非空字段
	if req.Prompt != "" {
		payload["prompt"] = req.Prompt
	}
	if req.ModelVersion != "" {
		payload["modelVersion"] = req.ModelVersion
	}
	if req.NegativePrompt != "" {
		payload["negativePrompt"] = req.NegativePrompt
	}
	if req.FaceLimit > 0 {
		payload["faceLimit"] = req.FaceLimit
	}
	if req.Texture {
		payload["texture"] = req.Texture
	}
	if req.PBR {
		payload["pbr"] = req.PBR
	}
	if req.ModelSeed > 0 {
		payload["modelSeed"] = req.ModelSeed
	}
	if req.TextureSeed > 0 {
		payload["textureSeed"] = req.TextureSeed
	}
	if req.TextureQuality != "" {
		payload["textureQuality"] = req.TextureQuality
	}
	if req.Style != "" {
		payload["style"] = req.Style
	}
	if req.AutoSize {
		payload["autoSize"] = req.AutoSize
	}
	if req.Quad {
		payload["quad"] = req.Quad
	}
	return c.makeRequest(ctx, "POST", "/task", payload)
}

// CreateImageToModelTask
//
// @Description: 创建图片转3D模型任务
func (c *TripoClient) CreateImageToModelTask(ctx context.Context, req models.ImageToModelRequest) (*models.TripoTaskResponse, error) {
	// 互斥校验：file_path, file_token, url, object 只能有一个
	inputCount := 0
	if req.FilePath != "" {
		inputCount++
	}
	if req.FileToken != "" {
		inputCount++
	}
	if req.URL != "" {
		inputCount++
	}
	if req.Object != nil {
		inputCount++
	}
	if inputCount != 1 {
		return nil, fmt.Errorf("exactly one of file_path, file_token, url, object must be provided")
	}
	payload := map[string]interface{}{
		"type": "image_to_model",
	}
	// 设置默认值
	if req.ModelVersion == "" {
		req.ModelVersion = "v2.5-20250123"
	}
	if req.FileType == "" {
		req.FileType = "jpeg"
	}
	if req.TextureQuality == "" {
		req.TextureQuality = "original_image"
	}
	if req.Orientation == "" {
		req.Orientation = "default"
	}
	// 处理不同的输入方式
	if req.FilePath != "" && fileExists(req.FilePath) {
		// 本地文件优先，需要先上传获取token
		uploadResp, err := c.UploadImage(ctx, req.FilePath)
		if err != nil {
			return nil, fmt.Errorf("upload image failed: %w", err)
		}
		payload["file"] = map[string]interface{}{
			"type":       req.FileType,
			"file_token": uploadResp.Data.ImageToken,
		}
	} else if req.URL != "" {
		payload["file"] = map[string]interface{}{
			"type":       req.FileType,
			"file_token": req.URL,
		}
	} else if req.Object != nil {
		payload["file"] = map[string]interface{}{
			"type":   req.FileType,
			"object": req.Object,
		}
	}
	// 添加其他非空字段
	if req.ModelVersion != "" {
		payload["model_version"] = req.ModelVersion
	}
	if req.FaceLimit > 0 {
		payload["face_limit"] = req.FaceLimit
	}
	if req.Texture {
		payload["texture"] = req.Texture
	}
	if req.PBR {
		payload["pbr"] = req.PBR
	}
	if req.ModelSeed > 0 {
		payload["model_seed"] = req.ModelSeed
	}
	if req.TextureSeed > 0 {
		payload["texture_seed"] = req.TextureSeed
	}
	if req.TextureQuality != "" {
		payload["texture_quality"] = req.TextureQuality
	}
	if req.TextureAlignment != "" {
		payload["texture_alignment"] = req.TextureAlignment
	}
	if req.Style != "" {
		payload["style"] = req.Style
	}
	if req.AutoSize {
		payload["auto_size"] = req.AutoSize
	}
	if req.Orientation != "" {
		payload["orientation"] = req.Orientation
	}
	if req.Quad {
		payload["quad"] = req.Quad
	}

	return c.makeRequest(ctx, "POST", "/task", payload)
}

// GetTaskStatus
//
// @Description: 获取任务状态
func (c *TripoClient) GetTaskStatus(ctx context.Context, taskID string) (*models.TripoTaskStatusResponse, error) {
	url := fmt.Sprintf("%s/task/%s", c.baseURL, taskID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fail to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("fail to read response body: %w", err)
	}

	var result models.TripoTaskStatusResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("fail to unmarshal response body: %w", err)
	}
	return &result, nil
}

// UploadImage
//
// @Description: 上传图片
func (c *TripoClient) UploadImage(ctx context.Context, filePath string) (*models.TripoUploadResponse, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("fail to open file: %w", err)
	}
	defer file.Close()

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return nil, fmt.Errorf("fail to create form file: %w", err)
	}

	if _, err := io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("fail to copy file: %w", err)
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("fail to close writer: %w", err)
	}

	url := fmt.Sprintf("%s/upload", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, &buf)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fail to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("fail to read response body: %w", err)
	}

	var result models.TripoUploadResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("fail to unmarshal response body: %w", err)
	}
	return &result, nil

}

// GetBalance
//
// @Description: 获取账户余额
func (c *TripoClient) GetBalance(ctx context.Context) (*models.TripoBalanceResponse, error) {
	url := fmt.Sprintf("%s/user/balance", c.baseURL)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fail to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("fail to read response body: %w", err)
	}

	var result models.TripoBalanceResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("fail to unmarshal response body: %w", err)
	}
	return &result, nil
}

// makeRequest 发送HTTP请求的通用方法
func (c *TripoClient) makeRequest(ctx context.Context, method string, path string, payload map[string]interface{}) (*models.TripoTaskResponse, error) {
	var body io.Reader
	if payload != nil {
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal payload: %w", err)
		}
		body = bytes.NewBuffer(jsonData)
	}
	url := fmt.Sprintf("%s%s", c.baseURL, path)
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var result models.TripoTaskResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response body: %w", err)
	}
	return &result, nil
}

// fileExists 检查文件是否存在
func fileExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}
