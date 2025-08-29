#!/bin/bash

# SoniCity 开发环境启动脚本
# 同时启动前端 (Vite) 和后端 (Express) 服务器

set -e

echo "🚀 SoniCity 开发环境启动脚本"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 端口 $port 可用${NC}"
        return 0
    fi
}

# 清理端口
cleanup_ports() {
    echo -e "\n${BLUE}清理端口...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
}

# 启动后端服务器
start_backend() {
    echo -e "\n${BLUE}启动后端服务器 (Express)...${NC}"
    if check_port 3001; then
        npm run server &
        BACKEND_PID=$!
        echo -e "${GREEN}✅ 后端服务器已启动 (PID: $BACKEND_PID)${NC}"
        echo -e "${BLUE}   访问: http://localhost:3001${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务器启动失败${NC}"
        return 1
    fi
}

# 启动前端服务器
start_frontend() {
    echo -e "\n${BLUE}启动前端服务器 (Vite)...${NC}"
    if check_port 5173; then
        npm run dev &
        FRONTEND_PID=$!
        echo -e "${GREEN}✅ 前端服务器已启动 (PID: $FRONTEND_PID)${NC}"
        echo -e "${BLUE}   访问: http://localhost:5173${NC}"
    else
        echo -e "${YELLOW}⚠️  前端服务器启动失败${NC}"
        return 1
    fi
}

# 等待服务器启动
wait_for_servers() {
    echo -e "\n${BLUE}等待服务器启动...${NC}"
    sleep 3
    
    # 检查后端
    if curl -s http://localhost:3001/api/health >/dev/null; then
        echo -e "${GREEN}✅ 后端服务器运行正常${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务器检查失败${NC}"
    fi
    
    # 检查前端
    if curl -s http://localhost:5173 >/dev/null; then
        echo -e "${GREEN}✅ 前端服务器运行正常${NC}"
    else
        echo -e "${YELLOW}⚠️  前端服务器检查失败${NC}"
    fi
}

# 显示访问信息
show_info() {
    echo -e "\n${GREEN}🎉 开发环境启动完成！${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "${GREEN}前端服务器:${NC} http://localhost:5173"
    echo -e "${GREEN}后端服务器:${NC} http://localhost:3001"
    echo -e "${BLUE}================================${NC}"
    echo -e "${GREEN}路由测试:${NC}"
    echo -e "  • 主页: http://localhost:5173/"
    echo -e "  • 苏州: http://localhost:5173/compose"
    echo -e "  • 录音: http://localhost:5173/record"
    echo -e "${BLUE}================================${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务器${NC}"
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在停止服务器...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ 后端服务器已停止${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ 前端服务器已停止${NC}"
    fi
    cleanup_ports
    echo -e "${GREEN}🎉 所有服务器已停止${NC}"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主流程
main() {
    cleanup_ports
    start_backend
    start_frontend
    wait_for_servers
    show_info
    
    # 保持脚本运行
    wait
}

# 运行主流程
main
