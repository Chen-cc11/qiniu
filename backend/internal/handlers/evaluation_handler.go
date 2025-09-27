package handlers

import (
	"net/http"
	"strconv"

	"3d-model-generator-backend/internal/evaluation"
	"3d-model-generator-backend/internal/models"

	"github.com/gin-gonic/gin"
)

type EvaluationHandler struct {
	evaluationService *evaluation.EvaluationService
}

func NewEvaluationHandler(evaluationService *evaluation.EvaluationService) *EvaluationHandler {
	return &EvaluationHandler{
		evaluationService: evaluationService,
	}
}

// SubmitEvaluation 提交评估
// @Summary 提交评估
// @Description 对生成的3D模型进行评分和反馈
// @Tags Evaluation
// @Accept json
// @Produce json
// @Param request body models.EvaluationRequest true "评估请求"
// @Success 200 {object} models.EvaluationResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/evaluations [post]
func (h *EvaluationHandler) SubmitEvaluation(c *gin.Context) {
	var req models.EvaluationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// 验证请求
	if req.JobID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing required field",
			Message: "job_id is required",
		})
		return
	}

	if req.QualityScore < 1 || req.QualityScore > 5 ||
		req.AccuracyScore < 1 || req.AccuracyScore > 5 ||
		req.SpeedScore < 1 || req.SpeedScore > 5 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid score range",
			Message: "Scores must be between 1 and 5",
		})
		return
	}

	// 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		userID = "anonymous"
	}

	// 创建评估指标
	metrics := evaluation.EvaluationMetrics{
		QualityScore:  req.QualityScore,
		AccuracyScore: req.AccuracyScore,
		SpeedScore:    req.SpeedScore,
	}

	// 提交评估
	evaluationID, err := h.evaluationService.SubmitEvaluation(
		c.Request.Context(),
		req.JobID,
		userID,
		metrics,
		req.Feedback,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to submit evaluation",
			Message: err.Error(),
		})
		return
	}

	// 计算综合评分
	overallScore := float64(req.QualityScore+req.AccuracyScore+req.SpeedScore) / 3.0

	response := models.EvaluationResponse{
		EvaluationID: evaluationID,
		OverallScore: overallScore,
		Message:      "Evaluation submitted successfully",
	}

	c.JSON(http.StatusOK, response)
}

// GetEvaluationStats 获取评估统计
// @Summary 获取评估统计
// @Description 获取评估统计数据
// @Tags Evaluation
// @Produce json
// @Param time_range query string false "时间范围" Enums(day,week,month,all) default(all)
// @Success 200 {object} evaluation.EvaluationStats
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/evaluations/stats [get]
func (h *EvaluationHandler) GetEvaluationStats(c *gin.Context) {
	timeRange := c.DefaultQuery("time_range", "all")

	stats, err := h.evaluationService.GetEvaluationStats(c.Request.Context(), timeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get evaluation stats",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetJobEvaluation 获取任务评估
// @Summary 获取任务评估
// @Description 获取特定任务的评估信息
// @Tags Evaluation
// @Produce json
// @Param job_id path string true "任务ID"
// @Success 200 {object} evaluation.Evaluation
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/jobs/{job_id}/evaluation [get]
func (h *EvaluationHandler) GetJobEvaluation(c *gin.Context) {
	jobID := c.Param("job_id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing job ID",
			Message: "job_id is required",
		})
		return
	}

	eval, err := h.evaluationService.GetJobEvaluation(c.Request.Context(), jobID)
	if err != nil {
		if err.Error() == "evaluation not found for job "+jobID {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error:   "Evaluation not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get job evaluation",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, eval)
}

// GetUserEvaluations 获取用户评估列表
// @Summary 获取用户评估列表
// @Description 获取当前用户的所有评估记录
// @Tags Evaluation
// @Produce json
// @Param limit query int false "限制数量" default(10)
// @Param offset query int false "偏移量" default(0)
// @Success 200 {object} []evaluation.Evaluation
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/evaluations [get]
func (h *EvaluationHandler) GetUserEvaluations(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		userID = "anonymous"
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

	evaluations, err := h.evaluationService.GetUserEvaluations(c.Request.Context(), userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get user evaluations",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, evaluations)
}

// CreateABTest 创建A/B测试
// @Summary 创建A/B测试
// @Description 创建新的A/B测试配置
// @Tags Evaluation
// @Accept json
// @Produce json
// @Param request body evaluation.ABTestConfig true "A/B测试配置"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/ab-tests [post]
func (h *EvaluationHandler) CreateABTest(c *gin.Context) {
	var config evaluation.ABTestConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// 验证配置
	if config.TestName == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing required field",
			Message: "test_name is required",
		})
		return
	}

	if config.VariantA == "" || config.VariantB == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing required field",
			Message: "variant_a and variant_b are required",
		})
		return
	}

	err := h.evaluationService.CreateABTest(c.Request.Context(), config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to create AB test",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "AB test created successfully",
	})
}

// GetABTestResult 获取A/B测试结果
// @Summary 获取A/B测试结果
// @Description 获取A/B测试的统计结果
// @Tags Evaluation
// @Produce json
// @Param test_name path string true "测试名称"
// @Success 200 {object} evaluation.ABTestResult
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/ab-tests/{test_name}/result [get]
func (h *EvaluationHandler) GetABTestResult(c *gin.Context) {
	testName := c.Param("test_name")
	if testName == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Missing test name",
			Message: "test_name is required",
		})
		return
	}

	result, err := h.evaluationService.GetABTestResult(c.Request.Context(), testName)
	if err != nil {
		if err.Error() == "failed to get AB test" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Error:   "AB test not found",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get AB test result",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// SuccessResponse 成功响应结构
type SuccessResponse struct {
	Message string `json:"message"`
}
