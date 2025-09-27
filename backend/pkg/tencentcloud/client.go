package tencentcloud

import (
	"context"
	"fmt"
	"time"

	"3d-model-generator-backend/internal/models"

	ai3d "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/ai3d/v20250513"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
)

type Client struct {
	secretId   string
	secretKey  string
	region     string
	ai3dClient *ai3d.Client
}

type TencentConfig struct {
	SecretId  string
	SecretKey string
	Region    string
}

func NewClient(config TencentConfig) (*Client, error) {
	// 创建腾讯云凭证
	credential := common.NewCredential(config.SecretId, config.SecretKey)

	// 创建客户端配置
	cpf := profile.NewClientProfile()

	// 设置HTTP配置
	cpf.HttpProfile.ReqTimeout = 300 // 设置请求超时为300秒

	// 创建AI3D客户端
	ai3dClient, err := ai3d.NewClient(credential, config.Region, cpf)
	if err != nil {
		return nil, fmt.Errorf("failed to create AI3D client: %w", err)
	}

	return &Client{
		secretId:   config.SecretId,
		secretKey:  config.SecretKey,
		region:     config.Region,
		ai3dClient: ai3dClient,
	}, nil
}

// SubmitTextTo3DJob 提交文本生成3D任务
func (c *Client) SubmitTextTo3DJob(ctx context.Context, prompt string, options *GenerationOptions) (*models.GenerationResponse, error) {
	// 创建请求
	request := ai3d.NewSubmitHunyuanTo3DJobRequest()
	request.Prompt = &prompt

	// 设置选项
	if options != nil {
		if options.ResultFormat != "" {
			request.ResultFormat = &options.ResultFormat
		}
		request.EnablePBR = &options.EnablePBR
	}

	// 重试机制
	var response *ai3d.SubmitHunyuanTo3DJobResponse
	var err error
	maxRetries := 3

	for i := 0; i < maxRetries; i++ {
		// 为每次重试创建新的context，避免context被取消
		retryCtx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
		response, err = c.ai3dClient.SubmitHunyuanTo3DJobWithContext(retryCtx, request)
		cancel()

		if err == nil {
			break
		}

		// 如果是最后一次重试，直接返回错误
		if i == maxRetries-1 {
			return nil, fmt.Errorf("failed to submit job after %d retries: %w", maxRetries, err)
		}

		// 等待一段时间后重试
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
	}

	return &models.GenerationResponse{
		JobID:         *response.Response.JobId,
		Status:        "processing",
		Message:       "Job submitted successfully",
		EstimatedTime: 300, // 5分钟
	}, nil
}

// SubmitImageTo3DJob 提交图片生成3D任务
func (c *Client) SubmitImageTo3DJob(ctx context.Context, imageBase64 string, options *GenerationOptions) (*models.GenerationResponse, error) {
	fmt.Printf("DEBUG: Submitting image to 3D job, base64 length: %d\n", len(imageBase64))
	// 创建请求
	request := ai3d.NewSubmitHunyuanTo3DJobRequest()
	request.ImageBase64 = &imageBase64

	// 设置选项
	if options != nil {
		if options.ResultFormat != "" {
			request.ResultFormat = &options.ResultFormat
		}
		request.EnablePBR = &options.EnablePBR
	}

	// 重试机制
	var response *ai3d.SubmitHunyuanTo3DJobResponse
	var err error
	maxRetries := 3

	for i := 0; i < maxRetries; i++ {
		// 为每次重试创建新的context，避免context被取消
		retryCtx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
		response, err = c.ai3dClient.SubmitHunyuanTo3DJobWithContext(retryCtx, request)
		cancel()

		if err == nil {
			break
		}

		// 如果是最后一次重试，直接返回错误
		if i == maxRetries-1 {
			return nil, fmt.Errorf("failed to submit job after %d retries: %w", maxRetries, err)
		}

		// 等待一段时间后重试
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
	}

	return &models.GenerationResponse{
		JobID:         *response.Response.JobId,
		Status:        "processing",
		Message:       "Job submitted successfully",
		EstimatedTime: 300, // 5分钟
	}, nil
}

// QueryJobStatus 查询任务状态
func (c *Client) QueryJobStatus(ctx context.Context, jobID string, jobType JobType) (*JobStatus, error) {
	// 创建请求
	request := ai3d.NewQueryHunyuanTo3DJobRequest()
	request.JobId = &jobID

	// 重试机制
	var response *ai3d.QueryHunyuanTo3DJobResponse
	var err error
	maxRetries := 3

	for i := 0; i < maxRetries; i++ {
		// 为每次重试创建新的context，避免context被取消
		retryCtx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
		response, err = c.ai3dClient.QueryHunyuanTo3DJobWithContext(retryCtx, request)
		cancel()

		if err == nil {
			break
		}

		// 如果是最后一次重试，直接返回错误
		if i == maxRetries-1 {
			return nil, fmt.Errorf("failed to query job status after %d retries: %w", maxRetries, err)
		}

		// 等待一段时间后重试
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
	}

	// 转换响应
	status := &JobStatus{
		JobType: jobType,
		Status:  mapTencentStatus(*response.Response.Status),
	}

	// 设置错误信息
	if response.Response.ErrorCode != nil {
		status.ErrorCode = response.Response.ErrorCode
	}
	if response.Response.ErrorMessage != nil {
		status.ErrorMessage = response.Response.ErrorMessage
	}
	if response.Response.RequestId != nil {
		status.RequestId = response.Response.RequestId
	}

	// 转换结果文件
	if response.Response.ResultFile3Ds != nil {
		status.ResultFiles = make([]File3D, len(response.Response.ResultFile3Ds))
		for i, file := range response.Response.ResultFile3Ds {
			status.ResultFiles[i] = File3D{
				Type:            *file.Type,
				URL:             *file.Url,
				PreviewImageURL: *file.PreviewImageUrl,
			}
		}
	}

	return status, nil
}

// mapTencentStatus 映射腾讯云API状态到内部状态
func mapTencentStatus(tencentStatus string) string {
	switch tencentStatus {
	case "WAIT":
		return "waiting"
	case "RUN":
		return "processing"
	case "SUCCESS", "DONE":
		return "completed"
	case "FAILED":
		return "failed"
	default:
		return tencentStatus // 保持原状态
	}
}

// 类型定义
type JobType string

const (
	JobTypeStandard JobType = "standard"
	JobTypePro      JobType = "pro"
	JobTypeRapid    JobType = "rapid"
)

type GenerationOptions struct {
	ResultFormat string
	EnablePBR    bool
}

type File3D struct {
	Type            string `json:"type"`
	URL             string `json:"url"`
	PreviewImageURL string `json:"preview_image_url"`
}

type JobStatus struct {
	JobType      JobType  `json:"job_type"`
	Status       string   `json:"status"`
	ErrorCode    *string  `json:"error_code,omitempty"`
	ErrorMessage *string  `json:"error_message,omitempty"`
	RequestId    *string  `json:"request_id,omitempty"`
	ResultFiles  []File3D `json:"result_files,omitempty"`
}

// IsCompleted 检查任务是否完成
func (js *JobStatus) IsCompleted() bool {
	return js.Status == "completed"
}

// IsFailed 检查任务是否失败
func (js *JobStatus) IsFailed() bool {
	return js.Status == "failed"
}

// IsProcessing 检查任务是否处理中
func (js *JobStatus) IsProcessing() bool {
	return js.Status == "processing"
}

// IsWaiting 检查任务是否等待中
func (js *JobStatus) IsWaiting() bool {
	return js.Status == "waiting"
}
