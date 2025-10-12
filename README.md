# TaoMeasure | 道路测绘工具集
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

# TaoMeasure | Road Surveying Toolkit
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

## 演示视频 | Demo Video

[![TaoMeasure Demo Video](https://img.shields.io/badge/YouTube-演示视频-red.svg)](https://youtu.be/KvvNaqw_Ysc)

## 项目简介 | Project Introduction

TaoMeasure 是一套面向测绘与道路工程场景的专业工具集，涵盖 GPS 高程异常换算、平面坐标正反算、多参数转换、道路曲线设计与 DXF 导出等核心功能模块。项目采用前后端分离架构，基于 Flask 后端与原生前端技术，提供直观易用的 Web 界面和 RESTful API，便于部署与二次开发。

TaoMeasure is a professional toolkit designed for surveying and road engineering scenarios, encompassing core functional modules including GPS altitude anomaly conversion, plane coordinate forward/inverse calculation, multi-parameter transformation, road curve design, and DXF export. The project adopts a front-end/back-end separated architecture based on Flask backend and native frontend technologies, providing an intuitive and easy-to-use web interface and RESTful API for convenient deployment and secondary development.

## 核心功能 | Core Features

- **GPS 高程转换 | GPS Altitude Conversion**
  - 垂直平移模型：适用于小范围、高程异常变化平缓区域
  - 线性基函数拟合：适用于中等范围、高程异常线性变化区域
  - 面基函数拟合：适用于大范围、高程异常复杂变化区域

- **坐标转换 | Coordinate Transformation**
  - 全能坐标转换：支持七参数、四参数模型自动计算与手动输入
  - 多种椭球体支持：WGS84、北京54、西安80、CGCS2000等
  - 批量处理：支持批量坐标转换与结果导出

- **道路曲线设计 | Road Curve Design**
  - 对称基本型曲线测设：支持缓和曲线+圆曲线组合设计
  - 曲线要素计算：自动计算曲线要素、主点里程、坐标等
  - DXF 导出：生成标准 DXF 格式图纸，支持自定义图层

- **数据导入导出 | Data Import/Export**
  - 多格式支持：TXT、CSV、Excel 等格式数据导入
  - 结果导出：支持文本、CSV、DXF 等格式结果导出
  - 批量处理：支持批量数据处理与结果导出

## 环境依赖 | Environment Requirements

- Python 3.8+
- Flask 3.0+
- numpy 1.24+
- scipy 1.10+
- ezdxf 1.0+
- openpyxl 3.1+
- xlrd 1.2.0
- Flask-Cors 4.0+

## 安装指南 | Installation Guide

### 1. 克隆项目 | Clone the Repository

```bash
git clone https://github.com/your-username/TaoMeasure.git
cd TaoMeasure
```

### 2. 创建虚拟环境 | Create Virtual Environment

**Windows PowerShell | Windows PowerShell:**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**Linux/macOS | Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. 安装依赖 | Install Dependencies

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 4. 环境变量配置 | Environment Variables (Optional)

```bash
# 日志级别 | Log Level
export TAOMEASURE_LOG_LEVEL=INFO

# 跨域策略 | CORS Policy
export TAOMEASURE_CORS=*

# 服务器配置 | Server Configuration
export TAOMEASURE_HOST=127.0.0.1
export TAOMEASURE_PORT=5000
export TAOMEASURE_DEBUG=0
```

## 快速开始 | Quick Start

### 1. 启动后端服务 | Start Backend Service

```bash
cd backend
python app.py
```

后端服务默认运行在 `http://127.0.0.1:5000/`，健康检查地址为 `/api/health`。

The backend service runs by default on `http://127.0.0.1:5000/`, with health check endpoint at `/api/health`.

### 2. 启动前端服务 | Start Frontend Service

```bash
cd frontend/public
python -m http.server 5173
```

然后访问 `http://127.0.0.1:5173`。

Then visit `http://127.0.0.1:5173`.

### 3. 使用命令行工具 | Using Command Line Tools

```bash
# DXF 导出工具 | DXF Export Tool
python -m taomeasure.cli.export_curve_dxf --help

# 运行示例 | Run Example
python -m taomeasure.cli.run_export
```

## 使用示例 | Usage Examples

### GPS 高程转换 | GPS Altitude Conversion

```python
import requests

# 准备数据 | Prepare data
data = {
    "known_points": [
        {"name": "P1", "lat": 30.2800169, "lon": -97.73787174, "height": 132.878, "anomaly": -27.28329},
        {"name": "P2", "lat": 30.28001056, "lon": -97.73004154, "height": 151.074, "anomaly": -27.29771}
    ],
    "unknown_points": [
        {"name": "U1", "lat": 30.2705624, "lon": -97.71511606, "height": 123.754}
    ],
    "model": "vertical_translation"
}

# 发送请求 | Send request
response = requests.post("http://127.0.0.1:5000/api/gps-altitude", json=data)
result = response.json()

# 处理结果 | Process results
if result["success"]:
    for point in result["data"]:
        print(f"点 {point['name']}: 计算高程异常 = {point['calculated_anomaly']:.5f}m, 正常高 = {point['normal_height']:.5f}m")
```

### 坐标转换 | Coordinate Transformation

```python
import requests

# 准备数据 | Prepare data
data = {
    "source_system": {
        "type": "geodetic",
        "ellipsoid": "WGS84"
    },
    "target_system": {
        "type": "gauss_kruger",
        "ellipsoid": "CGCS2000",
        "zone": 20,
        "central_meridian": 117.0
    },
    "common_points": [
        {
            "name": "P1",
            "source": {"lat": 30.5, "lon": 114.3},
            "target": {"x": 345567.89, "y": 3375456.78}
        }
    ],
    "points": [
        {"name": "U1", "lat": 30.6, "lon": 114.4}
    ],
    "options": {
        "auto_parameters": true,
        "auto_fill": true
    }
}

# 发送请求 | Send request
response = requests.post("http://127.0.0.1:5000/api/coordinate/universal/process", json=data)
result = response.json()

# 处理结果 | Process results
if result["success"]:
    for point in result["data"]["results"]:
        print(f"点 {point['name']}: X = {point['x']:.5f}, Y = {point['y']:.5f}")
```

### 道路曲线设计 | Road Curve Design

```python
import requests

# 准备数据 | Prepare data
data = {
    "curve_type": "transition",
    "parameters": {
        "intersection_angle": 30.5,  # 交角(度) | Intersection angle (degrees)
        "radius": 300.0,             # 圆曲线半径(m) | Circular curve radius (m)
        "ls": 60.0,                  # 缓和曲线长度(m) | Transition curve length (m)
        "pi_station": 1000.0,        # 交点桩号(m) | PI station (m)
        "pi_x": 5000.0,              # 交点X坐标(m) | PI X coordinate (m)
        "pi_y": 3000.0               # 交点Y坐标(m) | PI Y coordinate (m)
    }
}

# 发送请求 | Send request
response = requests.post("http://127.0.0.1:5000/api/curve-design", json=data)
result = response.json()

# 处理结果 | Process results
if result["success"]:
    curve_data = result["data"]
    print(f"曲线要素: T = {curve_data['tangent']:.5f}, L = {curve_data['curve_length']:.5f}, E = {curve_data['external']:.5f}")
```

### DXF 导出 | DXF Export

```python
import requests

# 使用曲线设计结果导出DXF | Export DXF using curve design results
dxf_data = {
    "project_name": "示例道路工程",
    "curve_data": curve_data,  # 来自曲线设计API的结果 | Results from curve design API
    "export_options": {
        "include_frame": True,
        "include_table": True,
        "include_stations": True
    }
}

# 发送请求 | Send request
response = requests.post("http://127.0.0.1:5000/api/export/dxf", json=dxf_data)

# 保存文件 | Save file
if response.status_code == 200:
    with open("road_curve.dxf", "wb") as f:
        f.write(response.content)
    print("DXF文件已保存")
```

## API 文档 | API Documentation

### GPS 高程转换 | GPS Altitude Conversion

- `POST /api/gps-altitude` - 执行 GPS 高程异常转换计算

### 坐标转换 | Coordinate Transformation

- `GET /api/coordinate/universal/metadata` - 获取参考数据（椭球体等）
- `POST /api/coordinate/universal/process` - 执行综合坐标转换
- `POST /api/coordinate/batch/geodetic-to-cartesian` - 批量大地坐标转空间直角坐标
- `POST /api/coordinate/batch/cartesian-to-geodetic` - 批量空间直角坐标转大地坐标

### 道路曲线设计 | Road Curve Design

- `POST /api/curve-design` - 执行道路曲线设计计算

### 数据导出 | Data Export

- `POST /api/export/results` - 导出计算结果（文本/CSV）
- `POST /api/export/dxf` - 导出DXF文件

### 系统接口 | System Interface

- `GET /api/health` - 健康检查

## 常见问题 | FAQ

### Q: 如何修改API默认地址？| How to change the default API address?

A: 在前端页面加载前设置 `window.__TAOMEASURE_API__ = 'http://your-host:port';` 可覆盖默认API地址。

A: Set `window.__TAOMEASURE_API__ = 'http://your-host:port';` before loading the frontend page to override the default API address.

### Q: 支持哪些椭球体参数？| What ellipsoid parameters are supported?

A: 系统内置支持WGS84、北京54、西安80、CGCS2000等常用椭球体参数，也可通过API自定义椭球体参数。

A: The system has built-in support for common ellipsoid parameters such as WGS84, Beijing54, Xi'an80, CGCS2000, and also allows custom ellipsoid parameters through the API.

### Q: 如何批量导入数据？| How to import data in batches?

A: 前端界面支持文件上传功能，支持TXT、CSV、Excel等格式数据导入。也可通过API的批量处理接口直接导入数据。

A: The frontend interface supports file upload functionality, supporting data import in formats such as TXT, CSV, and Excel. You can also directly import data through the batch processing API endpoints.

### Q: DXF导出支持哪些版本？| What DXF versions are supported for export?

A: 当前支持AutoCAD DXF R12/R2000/R2004/R2007/R2010/R2013/R2018版本。

A: Currently supports AutoCAD DXF R12/R2000/R2004/R2007/R2010/R2013/R2018 versions.

## 贡献指南 | Contributing

我们欢迎所有形式的贡献！如果您想为TaoMeasure项目做出贡献，请遵循以下步骤：

We welcome all forms of contributions! If you want to contribute to the TaoMeasure project, please follow these steps:

1. Fork 本仓库 | Fork this repository
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`) | Create a feature branch
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`) | Commit your changes
4. 推送到分支 (`git push origin feature/AmazingFeature`) | Push to the branch
5. 开启 Pull Request | Open a Pull Request

### 开发规范 | Development Guidelines

- 遵循 PEP 8 Python 代码风格 | Follow PEP 8 Python code style
- 为新功能添加单元测试 | Add unit tests for new features
- 更新相关文档 | Update relevant documentation
- 提交信息使用语义化格式 | Use semantic format for commit messages

## 许可证 | License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 联系方式 | Contact

- 项目维护者 | Project Maintainer: Lingzhentaor
- 项目主页 | Project Homepage: https://github.com/your-username/TaoMeasure

## 致谢 | Acknowledgments

- 感谢所有为TaoMeasure项目做出贡献的开发者
- 感谢开源社区提供的优秀库和工具
- 特别感谢Flask、numpy、scipy等项目的支持

Thanks to all developers who have contributed to the TaoMeasure project.
Thanks to the open-source community for providing excellent libraries and tools.
Special thanks to the support of projects such as Flask, numpy, scipy, etc.
