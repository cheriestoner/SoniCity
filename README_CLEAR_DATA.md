# 🗑️ 清空所有用户数据 API

## 概述
这个API端点用于在部署到生产服务器之前清空所有测试数据，包括用户录音文件和CSV索引文件。

## 🔒 安全特性
- **确认机制**：必须提供特定的确认字符串
- **环境检查**：只能在生产或测试环境中使用
- **详细日志**：记录所有操作和删除的文件
- **错误处理**：完善的错误处理和回滚机制

## 📡 API 端点
```
POST /api/clear-all-data
```

## 📋 请求参数
```json
{
  "confirm": "CLEAR_ALL_DATA_CONFIRM",
  "environment": "production"  // 或 "staging"
}
```

### 参数说明
- `confirm` (必需): 确认字符串，必须是 `"CLEAR_ALL_DATA_CONFIRM"`
- `environment` (可选): 环境标识，必须是 `"production"` 或 `"staging"`

## ✅ 成功响应
```json
{
  "success": true,
  "message": "All user data cleared successfully",
  "timestamp": "2024-08-30T12:51:00.000Z",
  "environment": "production",
  "details": {
    "filesDeleted": 45,
    "directoriesDeleted": 6,
    "usersCleared": 6,
    "csvReset": true
  }
}
```

## ❌ 错误响应

### 缺少确认
```json
{
  "error": "Confirmation required",
  "message": "Please provide confirm: \"CLEAR_ALL_DATA_CONFIRM\" to proceed"
}
```

### 环境检查失败
```json
{
  "error": "Environment check failed",
  "message": "This operation is only allowed in production or staging environments"
}
```

## 🚀 使用方法

### 1. 使用 curl 命令
```bash
curl -X POST http://localhost:3001/api/clear-all-data \
  -H "Content-Type: application/json" \
  -d '{
    "confirm": "CLEAR_ALL_DATA_CONFIRM",
    "environment": "production"
  }'
```

### 2. 使用 JavaScript fetch
```javascript
const response = await fetch('/api/clear-all-data', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        confirm: 'CLEAR_ALL_DATA_CONFIRM',
        environment: 'production'
    })
});

const result = await response.json();
console.log(result);
```

### 3. 使用 Python requests
```python
import requests

response = requests.post('http://localhost:3001/api/clear-all-data', json={
    'confirm': 'CLEAR_ALL_DATA_CONFIRM',
    'environment': 'production'
})

print(response.json())
```

## 🗂️ 清空的内容

### 用户数据
- 删除 `public/users/` 目录下的所有用户文件夹
- 删除所有录音文件 (`.webm`, `.mp3`, `.wav`)
- 删除所有照片文件 (`.jpg`, `.png`)
- 删除所有元数据文件 (`.json`)

### CSV 索引
- 重置 `public/imagedata-suzhou.csv` 文件
- 只保留标题行：`src,bgc,audio,describ,title`

## ⚠️ 注意事项

1. **不可逆操作**：此操作会永久删除所有用户数据
2. **生产环境**：只能在生产或测试环境中使用
3. **备份建议**：执行前建议备份重要数据
4. **权限控制**：确保只有授权人员可以访问此API

## 🔍 日志输出

执行过程中会在服务器控制台输出详细日志：
```
🚨 ATTENTION: Starting to clear all user data...
Environment: production
Timestamp: 2024-08-30T12:51:00.000Z
Found 6 user directories to clear
Clearing 8 files from user directory: user001
Deleted file: /path/to/user001/user001-1.webm
...
All user directories cleared successfully. Total: 45 files, 6 directories
CSV file reset to initial state
✅ Data clearing operation completed successfully
```

## 🚨 紧急情况

如果意外清空了数据，可以：
1. 检查服务器日志了解删除的文件
2. 从最近的备份恢复
3. 联系系统管理员

## 📞 技术支持

如有问题，请联系开发团队或查看服务器日志获取详细信息。
