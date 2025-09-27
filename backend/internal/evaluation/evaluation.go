package evaluation

import (
	"context"
	"fmt"
	"math"
	"time"

	"3d-model-generator-backend/internal/models"

	"gorm.io/gorm"
)

type EvaluationService struct {
	db *gorm.DB
}

type EvaluationMetrics struct {
	QualityScore  int     `json:"quality_score"`
	AccuracyScore int     `json:"accuracy_score"`
	SpeedScore    int     `json:"speed_score"`
	OverallScore  float64 `json:"overall_score"`
}

type EvaluationStats struct {
	TotalEvaluations  int            `json:"total_evaluations"`
	AverageScore      float64        `json:"average_score"`
	QualityAvg        float64        `json:"quality_avg"`
	AccuracyAvg       float64        `json:"accuracy_avg"`
	SpeedAvg          float64        `json:"speed_avg"`
	ScoreDistribution map[string]int `json:"score_distribution"`
}

type ABTestConfig struct {
	TestName     string  `json:"test_name"`
	VariantA     string  `json:"variant_a"`
	VariantB     string  `json:"variant_b"`
	TrafficSplit float64 `json:"traffic_split"` // 0.0-1.0
	IsActive     bool    `json:"is_active"`
}

type ABTestResult struct {
	TestName      string  `json:"test_name"`
	Variant       string  `json:"variant"`
	SampleSize    int     `json:"sample_size"`
	AverageScore  float64 `json:"average_score"`
	Confidence    float64 `json:"confidence"`
	IsSignificant bool    `json:"is_significant"`
}

func NewEvaluationService(db *gorm.DB) *EvaluationService {
	return &EvaluationService{db: db}
}

// SubmitEvaluation 提交评估
func (e *EvaluationService) SubmitEvaluation(ctx context.Context, jobID, userID string, metrics EvaluationMetrics, feedback string) (string, error) {
	// 验证评分范围
	if !e.validateScores(metrics) {
		return "", fmt.Errorf("invalid score range: scores must be between 1-5")
	}

	// 计算综合评分
	overallScore := e.calculateOverallScore(metrics)

	// 创建评估记录
	evaluation := &models.Evaluation{
		JobID:         jobID,
		UserID:        userID,
		QualityScore:  metrics.QualityScore,
		AccuracyScore: metrics.AccuracyScore,
		SpeedScore:    metrics.SpeedScore,
		OverallScore:  overallScore,
		Feedback:      feedback,
		CreatedAt:     time.Now(),
	}

	// 保存到数据库
	if err := e.db.Create(evaluation).Error; err != nil {
		return "", fmt.Errorf("failed to create evaluation: %w", err)
	}

	// 更新任务统计
	if err := e.updateJobStatistics(jobID, overallScore); err != nil {
		return "", fmt.Errorf("failed to update job statistics: %w", err)
	}

	return evaluation.ID, nil
}

// GetEvaluationStats 获取评估统计
func (e *EvaluationService) GetEvaluationStats(ctx context.Context, timeRange string) (*EvaluationStats, error) {
	var stats EvaluationStats
	var evaluations []models.Evaluation

	// 根据时间范围查询
	query := e.db.Model(&models.Evaluation{})
	switch timeRange {
	case "day":
		query = query.Where("created_at >= ?", time.Now().AddDate(0, 0, -1))
	case "week":
		query = query.Where("created_at >= ?", time.Now().AddDate(0, 0, -7))
	case "month":
		query = query.Where("created_at >= ?", time.Now().AddDate(0, -1, 0))
	case "all":
		// 查询所有
	default:
		return nil, fmt.Errorf("invalid time range: %s", timeRange)
	}

	// 获取评估数据
	if err := query.Find(&evaluations).Error; err != nil {
		return nil, fmt.Errorf("failed to get evaluations: %w", err)
	}

	// 计算统计信息
	stats.TotalEvaluations = len(evaluations)
	if len(evaluations) > 0 {
		stats.AverageScore = e.calculateAverageScore(evaluations)
		stats.QualityAvg = e.calculateAverageQuality(evaluations)
		stats.AccuracyAvg = e.calculateAverageAccuracy(evaluations)
		stats.SpeedAvg = e.calculateAverageSpeed(evaluations)
		stats.ScoreDistribution = e.calculateScoreDistribution(evaluations)
	}

	return &stats, nil
}

// GetJobEvaluation 获取特定任务的评估
func (e *EvaluationService) GetJobEvaluation(ctx context.Context, jobID string) (*models.Evaluation, error) {
	var evaluation models.Evaluation
	err := e.db.Where("job_id = ?", jobID).First(&evaluation).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("evaluation not found for job %s", jobID)
		}
		return nil, fmt.Errorf("failed to get evaluation: %w", err)
	}
	return &evaluation, nil
}

// GetUserEvaluations 获取用户的所有评估
func (e *EvaluationService) GetUserEvaluations(ctx context.Context, userID string, limit, offset int) ([]models.Evaluation, error) {
	var evaluations []models.Evaluation
	query := e.db.Where("user_id = ?", userID).Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&evaluations).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user evaluations: %w", err)
	}

	return evaluations, nil
}

// CreateABTest 创建A/B测试
func (e *EvaluationService) CreateABTest(ctx context.Context, config ABTestConfig) error {
	// 验证配置
	if config.TrafficSplit < 0 || config.TrafficSplit > 1 {
		return fmt.Errorf("traffic split must be between 0 and 1")
	}

	// 保存A/B测试配置
	abTest := &ABTest{
		TestName:     config.TestName,
		VariantA:     config.VariantA,
		VariantB:     config.VariantB,
		TrafficSplit: config.TrafficSplit,
		IsActive:     config.IsActive,
		CreatedAt:    time.Now(),
	}

	if err := e.db.Create(abTest).Error; err != nil {
		return fmt.Errorf("failed to create AB test: %w", err)
	}

	return nil
}

// GetABTestResult 获取A/B测试结果
func (e *EvaluationService) GetABTestResult(ctx context.Context, testName string) (*ABTestResult, error) {
	// 获取A/B测试配置
	var abTest ABTest
	err := e.db.Where("test_name = ?", testName).First(&abTest).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get AB test: %w", err)
	}

	// 获取变体A的结果
	var variantAScores []float64
	e.db.Model(&models.Evaluation{}).
		Joins("JOIN ab_test_assignments ON evaluations.job_id = ab_test_assignments.job_id").
		Where("ab_test_assignments.test_name = ? AND ab_test_assignments.variant = ?", testName, abTest.VariantA).
		Pluck("overall_score", &variantAScores)

	// 获取变体B的结果
	var variantBScores []float64
	e.db.Model(&models.Evaluation{}).
		Joins("JOIN ab_test_assignments ON evaluations.job_id = ab_test_assignments.job_id").
		Where("ab_test_assignments.test_name = ? AND ab_test_assignments.variant = ?", testName, abTest.VariantB).
		Pluck("overall_score", &variantBScores)

	// 计算统计结果
	result := &ABTestResult{
		TestName: testName,
	}

	// 变体A结果
	if len(variantAScores) > 0 {
		result.Variant = abTest.VariantA
		result.SampleSize = len(variantAScores)
		result.AverageScore = e.calculateMean(variantAScores)
		result.Confidence = e.calculateConfidence(variantAScores)
		result.IsSignificant = e.isStatisticallySignificant(variantAScores, variantBScores)
	} else if len(variantBScores) > 0 {
		result.Variant = abTest.VariantB
		result.SampleSize = len(variantBScores)
		result.AverageScore = e.calculateMean(variantBScores)
		result.Confidence = e.calculateConfidence(variantBScores)
		result.IsSignificant = e.isStatisticallySignificant(variantBScores, variantAScores)
	}

	return result, nil
}

// 辅助方法

func (e *EvaluationService) validateScores(metrics EvaluationMetrics) bool {
	return metrics.QualityScore >= 1 && metrics.QualityScore <= 5 &&
		metrics.AccuracyScore >= 1 && metrics.AccuracyScore <= 5 &&
		metrics.SpeedScore >= 1 && metrics.SpeedScore <= 5
}

func (e *EvaluationService) calculateOverallScore(metrics EvaluationMetrics) float64 {
	// 加权平均：质量40%，准确性40%，速度20%
	return float64(metrics.QualityScore)*0.4 +
		float64(metrics.AccuracyScore)*0.4 +
		float64(metrics.SpeedScore)*0.2
}

func (e *EvaluationService) calculateAverageScore(evaluations []models.Evaluation) float64 {
	if len(evaluations) == 0 {
		return 0
	}

	sum := 0.0
	for _, eval := range evaluations {
		sum += eval.OverallScore
	}
	return sum / float64(len(evaluations))
}

func (e *EvaluationService) calculateAverageQuality(evaluations []models.Evaluation) float64 {
	if len(evaluations) == 0 {
		return 0
	}

	sum := 0
	for _, eval := range evaluations {
		sum += eval.QualityScore
	}
	return float64(sum) / float64(len(evaluations))
}

func (e *EvaluationService) calculateAverageAccuracy(evaluations []models.Evaluation) float64 {
	if len(evaluations) == 0 {
		return 0
	}

	sum := 0
	for _, eval := range evaluations {
		sum += eval.AccuracyScore
	}
	return float64(sum) / float64(len(evaluations))
}

func (e *EvaluationService) calculateAverageSpeed(evaluations []models.Evaluation) float64 {
	if len(evaluations) == 0 {
		return 0
	}

	sum := 0
	for _, eval := range evaluations {
		sum += eval.SpeedScore
	}
	return float64(sum) / float64(len(evaluations))
}

func (e *EvaluationService) calculateScoreDistribution(evaluations []models.Evaluation) map[string]int {
	distribution := make(map[string]int)

	for _, eval := range evaluations {
		scoreRange := e.getScoreRange(eval.OverallScore)
		distribution[scoreRange]++
	}

	return distribution
}

func (e *EvaluationService) getScoreRange(score float64) string {
	switch {
	case score >= 4.5:
		return "excellent"
	case score >= 3.5:
		return "good"
	case score >= 2.5:
		return "fair"
	case score >= 1.5:
		return "poor"
	default:
		return "very_poor"
	}
}

func (e *EvaluationService) calculateMean(scores []float64) float64 {
	if len(scores) == 0 {
		return 0
	}

	sum := 0.0
	for _, score := range scores {
		sum += score
	}
	return sum / float64(len(scores))
}

func (e *EvaluationService) calculateConfidence(scores []float64) float64 {
	if len(scores) < 2 {
		return 0
	}

	mean := e.calculateMean(scores)
	variance := 0.0

	for _, score := range scores {
		variance += math.Pow(score-mean, 2)
	}
	variance /= float64(len(scores) - 1)

	stdDev := math.Sqrt(variance)
	standardError := stdDev / math.Sqrt(float64(len(scores)))

	// 95%置信区间
	return 1.96 * standardError
}

func (e *EvaluationService) isStatisticallySignificant(scoresA, scoresB []float64) bool {
	if len(scoresA) < 2 || len(scoresB) < 2 {
		return false
	}

	meanA := e.calculateMean(scoresA)
	meanB := e.calculateMean(scoresB)

	// 简单的t检验
	diff := math.Abs(meanA - meanB)
	pooledStd := math.Sqrt((e.calculateVariance(scoresA) + e.calculateVariance(scoresB)) / 2)
	se := pooledStd * math.Sqrt(1.0/float64(len(scoresA))+1.0/float64(len(scoresB)))

	tStat := diff / se
	return tStat > 1.96 // 95%置信水平
}

func (e *EvaluationService) calculateVariance(scores []float64) float64 {
	if len(scores) < 2 {
		return 0
	}

	mean := e.calculateMean(scores)
	variance := 0.0

	for _, score := range scores {
		variance += math.Pow(score-mean, 2)
	}

	return variance / float64(len(scores)-1)
}

func (e *EvaluationService) updateJobStatistics(jobID string, score float64) error {
	// 这里可以更新任务相关的统计信息
	// 例如：更新任务的平均评分、评分次数等
	return nil
}

// 数据库模型 - 使用 models 包中的定义

type ABTest struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	TestName     string    `json:"test_name" gorm:"uniqueIndex"`
	VariantA     string    `json:"variant_a"`
	VariantB     string    `json:"variant_b"`
	TrafficSplit float64   `json:"traffic_split"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

type ABTestAssignment struct {
	ID       string `json:"id" gorm:"primaryKey"`
	JobID    string `json:"job_id" gorm:"uniqueIndex"`
	TestName string `json:"test_name"`
	Variant  string `json:"variant"`
}
