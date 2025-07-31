@echo off
echo 🚀 启动玛德蕾娜应援网站本地服务器...

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ 使用 Python 启动服务器
    echo 🌐 服务器将在 http://localhost:8000 启动
    echo 按 Ctrl+C 停止服务器
    python -m http.server 8000
) else (
    echo ❌ 未找到 Python，请安装 Python 后重试
    echo 或者使用其他方式启动静态服务器：
    echo   - npx serve .
    pause
)