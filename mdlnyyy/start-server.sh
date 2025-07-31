#!/bin/bash

# 玛德蕾娜应援网站本地部署脚本

echo "🚀 启动玛德蕾娜应援网站本地服务器..."

# 检查Python是否安装
if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python3 启动服务器"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ 使用 Python 启动服务器"
    python -m http.server 8000
else
    echo "❌ 未找到 Python，请安装 Python 后重试"
    echo "或者使用其他方式启动静态服务器："
    echo "  - npx serve ."
    echo "  - php -S localhost:8000"
    exit 1
fi