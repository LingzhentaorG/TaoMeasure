/**
 * DXF导出服务
 * 根据DXF数据结构设计文档，生成符合AutoCAD标准的DXF文件
 */

class DxfExportService {
    constructor() {
        this.dxfContent = '';
        this.entityHandle = 100; // 实体句柄起始值
        this.layerColors = {
            'CURVE_CENTER': 1,    // 红色 - 中桩
            'CURVE_LEFT': 3,      // 绿色 - 左边桩
            'CURVE_RIGHT': 5,     // 蓝色 - 右边桩
            'CURVE_MAIN': 2,      // 黄色 - 主点
            'CURVE_TEXT': 7,      // 白色 - 文字
            'CURVE_DIMENSION': 6, // 紫色 - 标注
            'DEFAULT': 7,
        };
    }

    /**
     * 导出对称基本型曲线DXF文件
     * @param {Object} curveData - 曲线数据
     * @param {Object} options - 导出选项
     * @returns {Object} - 包含DXF文件内容和文件名的对象
     */
    exportSymmetricBasicCurveDxf(curveData, options = {}) {
        try {
            const {
                projectName = '对称基本型曲线',
                textHeight = 2.5,
                pointSize = 1.0
            } = options;

            // 初始化DXF内容
            this.dxfContent = '';
            this.entityHandle = 100;

            // 写入DXF头部
            this.writeDxfHeader(projectName);

            // 写入表格段
            this.writeDxfTables();

            // 写入实体段
            this.writeSymmetricBasicCurveEntities(curveData, {
                textHeight,
                pointSize
            });

            // 写入DXF尾部
            this.writeDxfFooter();

            return {
                success: true,
                content: this.dxfContent,
                filename: `${projectName}_${this.getCurrentDateString()}.dxf`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 写入对称基本型曲线实体
     * @param {Object} curveData - 曲线数据
     * @param {Object} options - 选项
     */
    writeSymmetricBasicCurveEntities(curveData, options) {
        this.dxfContent += '  0\nSECTION\n  2\nENTITIES\n';

        // 绘制曲线
        this.drawCurve(curveData.curvePoints, 'CURVE_CENTER');

        // 绘制主点
        this.drawMainPoints(curveData.mainPoints, options.pointSize, 'CURVE_MAIN');

        // 绘制桩号和坐标文本
        this.drawStakeAndCoordText(curveData.mainPoints, options.textHeight, 'CURVE_TEXT');

        this.dxfContent += '  0\nENDSEC\n';
    }

    /**
     * 绘制曲线
     * @param {Array} points - 组成曲线的点
     * @param {string} layer - 图层名称
     */
    drawCurve(points, layer) {
        if (Array.isArray(points) && points.length > 1) {
            const validPoints = points.filter(p => p && typeof p.x !== 'undefined' && typeof p.y !== 'undefined');
            for (let i = 0; i < validPoints.length - 1; i++) {
                this.writeLine(validPoints[i], validPoints[i + 1], layer);
            }
        }
    }

    /**
     * 绘制主点
     * @param {Array} points - 主点
     * @param {number} pointSize - 点的大小
     * @param {string} layer - 图层名称
     */
    drawMainPoints(points, pointSize, layer) {
        if (Array.isArray(points)) {
            const validPoints = points.filter(p => p && typeof p.x !== 'undefined' && typeof p.y !== 'undefined');
            validPoints.forEach(point => {
                this.writePoint(point, pointSize, layer);
            });
        }
    }

    /**
     * 绘制桩号和坐标文本
     * @param {Array} points - 主点
     * @param {number} textHeight - 文本高度
     * @param {string} layer - 图层名称
     */
    drawStakeAndCoordText(points, textHeight, layer) {
        if (Array.isArray(points)) {
            const validPoints = points.filter(p => p && typeof p.x !== 'undefined' && typeof p.y !== 'undefined' && typeof p.stake !== 'undefined');
            validPoints.forEach(point => {
                const stakeText = `K${point.stake}`;
                const coordText = `(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`;
                this.writeText({ x: point.x, y: point.y + textHeight * 1.5 }, stakeText, textHeight, layer);
                this.writeText({ x: point.x, y: point.y - textHeight * 1.5 }, coordText, textHeight, layer);
            });
        }
    }

    /**
     * 写入DXF头部
     */
    writeDxfHeader(projectName) {
        this.dxfContent += `  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1032\n  9\n$DWGCODEPAGE\n  3\nANSI_936\n  9\n$INSBASE\n 10\n0.0\n 20\n0.0\n 30\n0.0\n  9\n$EXTMIN\n 10\n0.0\n 20\n0.0\n 30\n0.0\n  9\n$EXTMAX\n 10\n1000.0\n 20\n1000.0\n 30\n0.0\n  0\nENDSEC\n`;
    }

    /**
     * 写入DXF表格段
     */
    writeDxfTables() {
        this.dxfContent += '  0\nSECTION\n  2\nTABLES\n';
        this.writeLinetypeTable();
        this.writeLayerTable();
        this.writeStyleTable();
        this.writeAppIdTable();
        this.dxfContent += '  0\nENDSEC\n';
    }

    /**
     * 写入图层表
     */
    writeLayerTable() {
        this.dxfContent += '  0\nTABLE\n  2\nLAYER\n 70\n     8\n';
        for (const layerName in this.layerColors) {
            this.writeLayer(layerName, this.layerColors[layerName]);
        }
        this.dxfContent += '  0\nENDTAB\n';
    }

    /**
     * 写入LTYPE表
     */
    writeLinetypeTable() {
        this.dxfContent += '  0\nTABLE\n  2\nLTYPE\n 70\n     1\n';
        this.dxfContent += '  0\nLTYPE\n  2\nBYBLOCK\n 70\n0\n  3\n\n 72\n65\n 73\n0\n 40\n0.0\n';
        this.dxfContent += '  0\nLTYPE\n  2\nBYLAYER\n 70\n0\n  3\n\n 72\n65\n 73\n0\n 40\n0.0\n';
        this.dxfContent += '  0\nLTYPE\n  2\nCONTINUOUS\n 70\n0\n  3\nSolid line\n 72\n65\n 73\n0\n 40\n0.0\n';
        this.dxfContent += '  0\nENDTAB\n';
    }

    /**
     * 写入STYLE表
     */
    writeStyleTable() {
        this.dxfContent += '  0\nTABLE\n  2\nSTYLE\n 70\n1\n';
        this.dxfContent += '  0\nSTYLE\n  2\nSTANDARD\n 70\n0\n 40\n0.0\n 41\n0.7\n 50\n0.0\n 71\n0\n 42\n2.5\n  3\nSimSun.ttf\n  4\n\n';
        this.dxfContent += '  0\nENDTAB\n';
    }

    /**
     * 写入APPID表
     */
    writeAppIdTable() {
        this.dxfContent += '  0\nTABLE\n  2\nAPPID\n 70\n1\n';
        this.dxfContent += '  0\nAPPID\n  2\nACAD\n 70\n0\n';
        this.dxfContent += '  0\nENDTAB\n';
    }

    /**
     * 写入图层
     * @param {string} name - 图层名称
     * @param {number} color - 颜色代码
     */
    writeLayer(name, color) {
        this.dxfContent += `  0\nLAYER\n  2\n${name}\n 70\n     0\n 62\n   ${color}\n  6\nCONTINUOUS\n`;
    }

    /**
     * 写入直线
     * @param {Object} startPoint - 起点
     * @param {Object} endPoint - 终点
     * @param {string} layer - 图层
     */
    writeLine(startPoint, endPoint, layer) {
        this.dxfContent += `  0\nLINE\n  5\n${this.entityHandle++}\n  8\n${layer}\n 10\n${startPoint.x}\n 20\n${startPoint.y}\n 30\n0.0\n 11\n${endPoint.x}\n 21\n${endPoint.y}\n 31\n0.0\n`;
    }

    /**
     * 写入点
     * @param {Object} point - 点
     * @param {number} pointSize - 点大小
     * @param {string} layer - 图层
     */
    writePoint(point, pointSize, layer) {
        this.dxfContent += `  0\nPOINT\n  5\n${this.entityHandle++}\n  8\n${layer}\n 10\n${point.x}\n 20\n${point.y}\n 30\n0.0\n`;
    }

    /**
     * 写入文本
     * @param {Object} position - 文本位置
     * @param {string} text - 文本内容
     * @param {number} height - 文本高度
     * @param {string} layer - 图层
     */
    writeText(position, text, height, layer) {
        this.dxfContent += `  0\nTEXT\n  5\n${this.entityHandle++}\n  8\n${layer}\n 10\n${position.x}\n 20\n${position.y}\n 30\n0.0\n 40\n${height}\n  1\n${text}\n`;
    }


    /**
     * 写入DXF尾部
     */
    writeDxfFooter() {
        this.dxfContent += '  0\nEOF\n';
    }

    /**
     * 获取当前日期字符串
     * @returns {string} - YYYYMMDD格式的日期
     */
    getCurrentDateString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }
}

// 兼容浏览器和Node.js环境
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = DxfExportService;
} else {
    window.DxfExportService = DxfExportService;
}