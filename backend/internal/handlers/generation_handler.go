package handlers

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"3d-model-generator-backend/internal/models"
	"3d-model-generator-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type GenerationHandler struct {
	generationService *services.GenerationService
}

// partFileWrapper 包装multipart.Part以实现multipart.File接口
type partFileWrapper struct {
	part *multipart.Part
}

func (p *partFileWrapper) Read(b []byte) (n int, err error) {
	return p.part.Read(b)
}

func (p *partFileWrapper) Close() error {
	return p.part.Close()
}

func (p *partFileWrapper) ReadAt(b []byte, off int64) (n int, err error) {
	// 对于我们的用例，ReadAt不是必需的，返回错误
	return 0, fmt.Errorf("ReadAt not supported")
}

func (p *partFileWrapper) Seek(offset int64, whence int) (int64, error) {
	// 对于我们的用例，Seek不是必需的，返回错误
	return 0, fmt.Errorf("Seek not supported")
}

func NewGenerationHandler(generationService *services.GenerationService) *GenerationHandler {
	return &GenerationHandler{
		generationService: generationService,
	}
}

// GenerateFromText 从文本生成3D模型
// @Summary 从文本生成3D模型
// @Description 根据文本描述生成3D模型
// @Tags Generation
// @Accept json
// @Produce json
// @Param request body models.GenerationRequest true "生成请求"
// @Success 200 {object} models.GenerationResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/generate/text [post]
func (h *GenerationHandler) GenerateFromText(c *gin.Context) {
	var req models.GenerationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// 验证请求
	if req.Prompt == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing required field",
			Message: "prompt is required",
		})
		return
	}

	// 获取用户ID（从认证中间件获取）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "用户未认证",
		})
		return
	}

	// 转换选项
	options := &services.GenerationOptions{
		ResultFormat: req.ResultFormat,
		EnablePBR:    req.EnablePBR,
		FaceCount:    req.FaceCount,
		GenerateType: req.GenerateType,
	}

	// 调用服务
	response, err := h.generationService.GenerateFromText(c.Request.Context(), userID.(string), req.Prompt, options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Generation failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GenerateFromImage 从图片生成3D模型
// @Summary 从图片生成3D模型
// @Description 根据图片生成3D模型
// @Tags Generation
// @Accept json
// @Produce json
// @Param request body models.GenerationRequest true "生成请求"
// @Success 200 {object} models.GenerationResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/generate/image [post]
func (h *GenerationHandler) GenerateFromImage(c *gin.Context) {
	var req models.GenerationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// 验证请求
	if req.ImageURL == "" && req.ImageBase64 == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing required field",
			Message: "image_url or image_base64 is required",
		})
		return
	}

	// 获取用户ID（从认证中间件获取）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "用户未认证",
		})
		return
	}

	// 转换选项
	options := &services.GenerationOptions{
		ResultFormat: req.ResultFormat,
		EnablePBR:    req.EnablePBR,
		FaceCount:    req.FaceCount,
		GenerateType: req.GenerateType,
	}

	// 调用服务
	var response *models.GenerationResponse
	var err error

	if req.ImageURL != "" {
		response, err = h.generationService.GenerateFromImage(c.Request.Context(), userID.(string), req.ImageURL, options)
	} else {
		// 处理base64图片
		response, err = h.generationService.GenerateFromImageBase64(c.Request.Context(), userID.(string), req.ImageBase64, options)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Generation failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetJobStatus 获取任务状态
// @Summary 获取任务状态
// @Description 根据任务ID获取生成状态
// @Tags Generation
// @Produce json
// @Param job_id path string true "任务ID"
// @Success 200 {object} models.JobStatusResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/jobs/{job_id} [get]
func (h *GenerationHandler) GetJobStatus(c *gin.Context) {
	jobID := c.Param("job_id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing job ID",
			Message: "job_id is required",
		})
		return
	}

	response, err := h.generationService.GetJobStatus(c.Request.Context(), jobID)
	if err != nil {
		if err.Error() == "job not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error:   "Job not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get job status",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetUserJobs 获取用户任务列表
// @Summary 获取用户任务列表
// @Description 获取当前用户的所有生成任务
// @Tags Generation
// @Produce json
// @Param limit query int false "限制数量" default(10)
// @Param offset query int false "偏移量" default(0)
// @Success 200 {object} []models.GenerationJob
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/jobs [get]
func (h *GenerationHandler) GetUserJobs(c *gin.Context) {
	// 获取用户ID（从认证中间件获取）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "用户未认证",
		})
		return
	}

	// 解析查询参数
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	jobs, err := h.generationService.GetUserJobs(c.Request.Context(), userID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get user jobs",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

// GetStatistics 获取统计信息
// @Summary 获取统计信息
// @Description 获取用户的生成统计信息
// @Tags Generation
// @Produce json
// @Success 200 {object} models.StatisticsResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/statistics [get]
func (h *GenerationHandler) GetStatistics(c *gin.Context) {
	// 获取用户ID（从认证中间件获取）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "用户未认证",
		})
		return
	}

	stats, err := h.generationService.GetStatistics(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get statistics",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// DownloadModel 下载3D模型
// @Summary 下载3D模型
// @Description 下载生成的3D模型文件
// @Tags Generation
// @Produce application/octet-stream
// @Param job_id path string true "任务ID"
// @Param file_type query string false "文件类型" default("obj")
// @Success 200 {file} binary
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/jobs/{job_id}/download [get]
func (h *GenerationHandler) DownloadModel(c *gin.Context) {
	jobID := c.Param("job_id")
	fileType := c.DefaultQuery("file_type", "obj")

	if jobID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing job ID",
			Message: "job_id is required",
		})
		return
	}

	// 获取任务状态
	status, err := h.generationService.GetJobStatus(c.Request.Context(), jobID)
	if err != nil {
		if err.Error() == "job not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error:   "Job not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get job status",
			Message: err.Error(),
		})
		return
	}

	if status.Status != "completed" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Job not completed",
			Message: "The generation job is not completed yet",
		})
		return
	}

	// 查找指定类型的文件
	var downloadURL string
	for _, file := range status.ResultFiles {
		if file.Type == fileType {
			downloadURL = file.URL
			break
		}
	}

	if downloadURL == "" {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "File not found",
			Message: "The requested file type is not available",
		})
		return
	}

	// 重定向到下载URL
	c.Redirect(http.StatusFound, downloadURL)
}

// UploadImage 上传图片文件
// @Summary 上传图片文件
// @Description 上传图片文件用于3D模型生成
// @Tags Generation
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "图片文件"
// @Success 200 {object} UploadResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/upload/image [post]
func (h *GenerationHandler) UploadImage(c *gin.Context) {
	// 检查Content-Type
	contentType := c.GetHeader("Content-Type")
	if !strings.Contains(contentType, "multipart/form-data") {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid content type",
			Message: "Content-Type must be multipart/form-data",
		})
		return
	}

	// 使用原生multipart解析，避免Gin的ParseMultipartForm问题
	reader, err := c.Request.MultipartReader()
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "File upload failed",
			Message: "Failed to create multipart reader: " + err.Error(),
		})
		return
	}

	var file io.Reader
	var filename string
	var found bool

	// 遍历multipart部分
	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			// 忽略解析错误，继续尝试下一个part
			fmt.Printf("Debug: Error reading part: %v\n", err)
			continue
		}

		// 安全地获取FormName和FileName
		formName := part.FormName()
		fileName := part.FileName()

		fmt.Printf("Debug: Found part - FormName: '%s', FileName: '%s'\n", formName, fileName)

		// 检查是否是文件字段
		if fileName != "" || formName == "file" || formName == "image" || formName == "upload" {
			file = part
			if fileName != "" {
				filename = fileName
			} else {
				filename = "uploaded_file"
			}
			found = true
			break
		}
		part.Close()
	}

	if !found {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "File upload failed",
			Message: "No file found in request. Please use field name 'file', 'image', or 'upload'",
		})
		return
	}

	// 验证文件类型
	allowedTypes := []string{".jpg", ".jpeg", ".png", ".webp"}
	ext := strings.ToLower(filepath.Ext(filename))
	isValidType := false
	for _, allowedType := range allowedTypes {
		if ext == allowedType {
			isValidType = true
			break
		}
	}

	if !isValidType {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid file type",
			Message: "Only JPG, JPEG, PNG, and WEBP files are allowed",
		})
		return
	}

	// 创建唯一文件名
	timestamp := time.Now().Unix()
	uniqueFilename := fmt.Sprintf("%d_%s", timestamp, filename)
	filePath := filepath.Join("uploads", "images", uniqueFilename)

	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Directory creation failed",
			Message: "Failed to create upload directory: " + err.Error(),
		})
		return
	}

	// 读取文件内容到内存
	fileData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "File upload failed",
			Message: "Failed to read file: " + err.Error(),
		})
		return
	}

	// 验证文件大小
	if len(fileData) > 8*1024*1024 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "File too large",
			Message: "File size must be less than 8MB",
		})
		return
	}

	// 保存文件
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "File save failed",
			Message: "Failed to save file: " + err.Error(),
		})
		return
	}
	defer dst.Close()

	written, err := dst.Write(fileData)
	if err != nil {
		os.Remove(filePath) // 删除部分写入的文件
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "File write failed",
			Message: "Failed to write file: " + err.Error(),
		})
		return
	}

	fmt.Printf("Debug: File saved successfully, size: %d bytes\n", written)

	// 生成访问URL
	imageURL := fmt.Sprintf("http://localhost:8080/uploads/images/%s", uniqueFilename)

	c.JSON(http.StatusOK, UploadResponse{
		ImageURL: imageURL,
		Filename: uniqueFilename,
		Size:     int64(written),
		Message:  "Image uploaded successfully",
	})
}

// GenerateFromUploadedImage 从上传的图片生成3D模型
// @Summary 从上传的图片生成3D模型
// @Description 使用已上传的图片生成3D模型
// @Tags Generation
// @Accept json
// @Produce json
// @Param request body models.GenerationRequest true "生成请求"
// @Success 200 {object} models.GenerationResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/generate/uploaded-image [post]
func (h *GenerationHandler) GenerateFromUploadedImage(c *gin.Context) {
	var req models.GenerationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// 验证请求
	if req.ImageURL == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing required field",
			Message: "image_url is required",
		})
		return
	}

	// 获取用户ID（从认证中间件获取）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "用户未认证",
		})
		return
	}

	// 转换选项
	options := &services.GenerationOptions{
		ResultFormat: req.ResultFormat,
		EnablePBR:    req.EnablePBR,
		FaceCount:    req.FaceCount,
		GenerateType: req.GenerateType,
	}

	// 调用服务
	response, err := h.generationService.GenerateFromImage(c.Request.Context(), userID.(string), req.ImageURL, options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Generation failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UploadResponse 上传响应结构
type UploadResponse struct {
	ImageURL string `json:"image_url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
	Message  string `json:"message"`
}
