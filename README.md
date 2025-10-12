# TaoMeasure

TaoMeasure 是一套面向测绘与道路工程场景的工具集，涵盖 GPS 高程异常换算、平面坐标正反算、多参数转换、道路曲线设计与 DXF 导出等模块。当前项目已重构为前后端完全分离的形式，便于部署与二次扩展。

## 目录结构

```
TaoMeasure/
├─ backend/              # Flask 后端（taomeasure 包 + 启动脚本）
│  ├─ taomeasure/
│  │  ├─ api/           # REST API 蓝图分层（gps、coordinates、curves 等）
│  │  ├─ cli/           # 命令行工具（DXF 导出等）
│  │  ├─ domain/        # 领域算法与数据处理模块
│  │  ├─ utils/         # 工具模块（预留）
│  │  └─ __init__.py    # create_app 应用工厂
│  ├─ app.py            # 开发模式启动入口
│  └─ requirements.txt  # 后端依赖列表
├─ frontend/
│  └─ public/           # 静态前端资源根目录
│     ├─ assets/        # 背景图等静态资源
│     ├─ scripts/       # 模块化整理后的 JS 文件
│     └─ styles/        # 统一主题与页面样式
├─ testdata/            # 示例/测试数据
└─ venv/                # 建议创建的唯一 Python 虚拟环境（本地生成）
```

## 环境准备

### 1. Python 虚拟环境（Windows PowerShell 示例）

```powershell
cd D:\Desktop\TaoMeasure
python -m venv venv
venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r backend/requirements.txt
```

> 如需调整日志级别或跨域策略，可通过环境变量 `TAOMEASURE_LOG_LEVEL`、`TAOMEASURE_CORS` 等进行覆盖。

### 2. 启动后端服务

```powershell
cd backend
python app.py
```

默认监听 `http://127.0.0.1:5000/`，健康检查地址为 `/api/health`。

### 3. 启动前端页面

前端资源集中在 `frontend/public`，无需构建步骤即可直接托管：

```powershell
cd frontend/public
python -m http.server 5173
```
http://localhost:5173
随后访问 `http://127.0.0.1:5173`。若后端部署在其他主机，可在页面加载前设置 `window.__TAOMEASURE_API__ = 'http://your-host:port';` 覆盖默认 API 地址。

## 命令行工具

`taomeasure/cli` 提供若干实用脚本：

- `export_curve_dxf.py`：从曲线测量数据生成 DXF 文件。
- `run_export.py`：使用示例数据快速体验 DXF 导出流水线。

运行方式示例：

```powershell
python -m taomeasure.cli.export_curve_dxf --help
```

## 前端样式优化提示

- `public/styles/theme.css` 统一色彩、圆角与投影等全局变量。
- 表格容器使用横向滚动与粘性表头，避免窄屏溢出，同时保持界面风格一致。
- 所有脚本通过 `defer` 加载，确保 DOM 完成后再初始化模块逻辑。

## 其他说明

- `testdata/` 保留原有示例文件，可用于快速验证算法正确性。
- 如需扩展 API，可在 `taomeasure/api` 内新增蓝图模块，并由 `register_api_routes` 自动注册。
- 默认 JSON 编码已关闭 ASCII 转义，返回结果可以直接包含中文。

如在使用中发现问题，欢迎继续反馈以便迭代优化。
