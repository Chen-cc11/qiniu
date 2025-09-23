package models

import "time"

// TextToModelRequest
//
// @Description: 文本转3D模型请求
type TextToModelRequest struct {
	Prompt         string `json:"prompt" binging:"required"`                      // 文本描述，指引3D模型生成，最大1024字符
	ModelVersion   string `json:"modelVersion,omitempty" form:"modelVersion"`     // 模型版本，可选：v2.5-20250123, v2.0-20240919, v1.4-20240625
	NegativePrompt string `json:"negativePrompt,omitempty" form:"negativePrompt"` // 反向描述，辅助生成与prompt相反的内容，最大255字符
	FaceLimit      int    `json:"faceLimit,omitempty" form:"faceLimit"`           // 输出模型面数上限，未设置时自适应
	Texture        bool   `json:"texture,omitempty" form:"texture"`               // 是否生成PBR贴图，默认为True
	PBR            bool   `json:"pbr,omitempty" form:"pbr"`                       // 是否生成PBR贴图，默认为True
	ModelSeed      int    `json:"modelSeed,omitempty" form:"modelSeed"`           // 模型生成随机种子
	TextureSeed    int    `json:"textureSeed,omitempty" form:"textureSeed"`       // 贴图生成随机种子
	TextureQuality string `json:"textureQuality,omitempty" form:"textureQuality"` // 贴图质量，可选：standard, detailed
	Style          string `json:"style,omitempty" form:"style"`                   // 风格化类型
	AutoSize       bool   `json:"autoSize,omitempty" form:"autoSize"`             // 是否自动缩放到真实世界尺寸（米）
	Quad           bool   `json:"quad,omitempty" form:"quad"`                     // 是否输出四边面网格
}

// ImageToModelRequest
//
// @Description: 图片转3D模型请求
type ImageToModelRequest struct {
	FilePath         string                 `json:"filePath,omitempty" form:"filePath" binging:"required"` // 本地图片文件路径
	FileType         string                 `json:"fileType,omitempty" form:"fileType"`                    // 图片文件类型
	URL              string                 `json:"url,omitempty" form:"url"`                              // 图片直链URL
	FileToken        string                 `json:"fileToken,omitempty" form:"fileToken"`                  // 图片上传后返回的token
	Object           map[string]interface{} `json:"object,omitempty" form:"object"`                        // STS上传返回的对象信息
	ModelVersion     string                 `json:"modelVersion,omitempty" form:"modelVersion"`            // 模型版本
	FaceLimit        int                    `json:"faceLimit,omitempty" form:"faceLimit"`                  // 输出模型面数上限
	Texture          bool                   `json:"texture,omitempty" form:"texture"`                      // 是否生成贴图
	PBR              bool                   `json:"pbr,omitempty" form:"pbr"`                              // 是否生成PBR贴图
	ModelSeed        int                    `json:"modelSeed,omitempty" form:"modelSeed"`                  // 模型生成随机种子
	TextureSeed      int                    `json:"textureSeed,omitempty" form:"textureSeed"`              // 贴图生成随机种子
	TextureQuality   string                 `json:"textureQuality,omitempty" form:"textureQuality"`        // 贴图质量
	TextureAlignment string                 `json:"textureAlignment,omitempty" form:"textureAlignment"`    // 贴图对齐方式
	Style            string                 `json:"style,omitempty" form:"style"`                          // 风格化类型
	AutoSize         bool                   `json:"autoSize,omitempty" form:"autoSize"`                    // 是否自动缩放到真实世界尺寸
	Orientation      string                 `json:"orientation,omitempty" form:"orientation"`              // 模型朝向
	Quad             bool                   `json:"quad,omitempty" form:"quad"`                            // 是否输出四边面网格
}

// TaskIdRequest
//
// @Description: 任务ID请求
type TaskIdRequest struct {
	TaskID string `json:"taskID" form:"taskID" binding:"required"` // 任务ID
}

// UploadImageRequest
//
// @Description: 上传图片请求
type UploadImageRequest struct {
	FilePath string `json:"file_path" binding:"required"` // 本地图片文件路径
}

// TripoTaskResponse
//
// @Description: Tripo3D任务响应
type TripoTaskResponse struct {
	Code int `json:"code" form:"code"`
	Data struct {
		TaskID string `json:"taskID" form:"taskID"`
	} `json:"data" form:"data"`
	Msg string `json:"msg,omitempty" form:"msg"`
}

// TripoTaskStatusResponse
//
// @Description: Tripo3D任务状态响应
type TripoTaskStatusResponse struct {
	Code int `json:"code" form:"code"`
	Data struct {
		TaskID   string `json:"taskID" form:"taskID"`
		Status   string `json:"status" form:"status"`
		Progress int    `json:"progress" form:"progress"`
		Result   struct {
			ModelURL     string `json:"modelURL" form:"modelURL"`
			ThumbnailURL string `json:"thumbnailURL" form:"thumbnailURL"`
		} `json:"result" form:"result"`
		Error string `json:"error,omitempty" form:"error"`
	} `json:"data,omitempty" form:"data"`
	Msg string `json:"msg,omitempty" form:"msg"`
}

// TripoUploadResponse
//
// @Description: Tripo3D上传响应
type TripoUploadResponse struct {
	Code int `json:"code" form:"code"`
	Data struct {
		ImageToken string `json:"imageToken" form:"imageToken"`
	} `json:"data" form:"data"`
	Msg string `json:"msg,omitempty" form:"msg"`
}

// TripoBalanceResponse
//
// @Description: Tripo3D 余额响应
type TripoBalanceResponse struct {
	Code int `json:"code" form:"code"`
	Data struct {
		Balance string `json:"balance" form:"balance"`
		Frozen  string `json:"frozen" form:"frozen"`
	} `json:"data,omitempty" form:"data"`
	Msg string `json:"msg,omitempty" form:"msg"`
}

// User
//
// @Description:用户模型
type User struct {
	ID        string    `json:"id" gorm:"column:id;primaryKey;auto_increment"`
	Email     string    `json:"email" gorm:"column:email;uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"column:password;not null"`
	CreatedAt time.Time `json:"createdAt" gorm:"column:create_at;not null"`
	UpdateAt  time.Time `json:"updatedAt" gorm:"column:update_at;not null"`
}

// Task
//
// @Description: 任务模型
type Task struct {
	ID           string    `json:"id" form:"id" gorm:"column:id;primaryKey;type:uuid;default:uuid_generate_v4();not null"`
	UserID       string    `json:"userId" form:"userId" gorm:"column:user_id;not null"`
	InputType    string    `json:"inputType" form:"inputType" gorm:"column:input_type;not null"`          // text or image
	InputContent string    `json:"inputContent" form:"inputContent" gorm:"column:input_content;not null"` // 文本内容或图片URL
	InputHash    string    `json:"inputHash" form:"inputHash" gorm:"column:input_hash;not null"`          // 用于缓存去重
	Status       string    `json:"status" form:"status" gorm:"column:status;not null"`                    // pending processing completed failed
	TripoTaskID  string    `json:"tripoTaskID" form:"tripoTaskID" gorm:"column:tripo_task_id;not null"`   // Tripo3D返回任务ID
	ResultURL    string    `json:"resultURL" form:"resultURL" gorm:"column:result_url"`                   // 生成的3D模型URL
	ThumbnailURL string    `json:"thumbnailURL" form:"thumbnailURL" gorm:"column:thumbnail_url"`          // 缩略图URL
	ErrorMessage string    `json:"errorMessage,omitempty" form:"errorMessage"`
	CreateAt     time.Time `json:"createAt,omitempty" form:"createAt"`
	UpdateAt     time.Time `json:"updateAt,omitempty" form:"updateAt"`
	User         User      `json:"user,omitempty" form:"user" gorm:"foreignKey:user_id;references:id"`
}

// Feedback
//
// @Description: 用户反馈模型
type Feedback struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	TaskID    string    `json:"task_id" gorm:"not null"`
	UserID    string    `json:"user_id" gorm:"not null"`
	Rating    int       `json:"rating" gorm:"not null"` // 1-5分
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
	Task      Task      `json:"task" gorm:"foreignKey:TaskID"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
}
