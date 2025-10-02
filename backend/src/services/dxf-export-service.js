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
            'CURVE_DIMENSION': 6  // 紫色 - 标注
        };
    }

    /**
     * 导出曲线测设DXF文件
     * @param {Object} curveData - 曲线数据
     * @param {Object} options - 导出选项
     * @returns {string} DXF文件内容
     */
    exportCurveDxf(curveData, options = {}) {
        try {
            const {
                projectName = '曲线测设工程',
                includeMainPoints = true,
                includeCenterStakes = true,
                includeLeftStakes = true,
                includeRightStakes = true,
                includeText = true,
                includeDimensions = false,
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
            this.writeDxfEntities(curveData, {
                includeMainPoints,
                includeCenterStakes,
                includeLeftStakes,
                includeRightStakes,
                includeText,
                includeDimensions,
                textHeight,
                pointSize
            });

            // 写入DXF尾部
            this.writeDxfFooter();

            return {
                success: true,
                content: this.dxfContent,
                filename: `${projectName}_曲线测设_${this.getCurrentDateString()}.dxf`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 写入DXF头部
     */
    writeDxfHeader(projectName) {
        this.dxfContent += `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$DWGCODEPAGE
3
ANSI_936
9
$INSBASE
10
0.0
20
0.0
30
0.0
9
$EXTMIN
10
0.0
20
0.0
30
0.0
9
$EXTMAX
10
1000.0
20
1000.0
30
0.0
9
$LIMMIN
10
0.0
20
0.0
9
$LIMMAX
10
1000.0
20
1000.0
9
$ORTHOMODE
70
0
9
$REGENMODE
70
1
9
$FILLMODE
70
1
9
$QTEXTMODE
70
0
9
$MIRRTEXT
70
1
9
$LTSCALE
40
1.0
9
$ATTMODE
70
1
9
$TEXTSIZE
40
2.5
9
$TRACEWID
40
1.0
9
$TEXTSTYLE
7
STANDARD
9
$CLAYER
8
0
9
$CELTYPE
6
BYLAYER
9
$CECOLOR
62
256
9
$CELTSCALE
40
1.0
9
$DISPSILH
70
0
9
$DIMSCALE
40
1.0
9
$DIMASZ
40
2.5
9
$DIMEXO
40
0.625
9
$DIMDLI
40
3.75
9
$DIMRND
40
0.0
9
$DIMDLE
40
0.0
9
$DIMEXE
40
1.25
9
$DIMTP
40
0.0
9
$DIMTM
40
0.0
9
$DIMTXT
40
2.5
9
$DIMCEN
40
2.5
9
$DIMTSZ
40
0.0
9
$DIMAUNIT
70
0
9
$DIMADEC
70
0
9
$DIMALTZ
70
0
9
$DIMALTTZ
70
0
9
$DIMFIT
70
3
9
$DIMUPT
70
0
9
$DIMUNIT
70
2
9
$DIMDEC
70
4
9
$DIMTDEC
70
4
9
$DIMALTU
70
2
9
$DIMALTTD
70
2
9
$DIMTXSTY
7
STANDARD
9
$DIMAPOST
1

9
$DIMALTD
70
2
9
$DIMALT
70
0
9
$DIMALTF
40
25.4
9
$DIMLFAC
40
1.0
9
$DIMTOFL
70
0
9
$DIMTVP
40
0.0
9
$DIMTIX
70
0
9
$DIMSOXD
70
0
9
$DIMSAH
70
0
9
$DIMBLK1
1

9
$DIMBLK2
1

9
$DIMSTYLE
2
STANDARD
9
$DIMCLRD
70
0
9
$DIMCLRE
70
0
9
$DIMCLRT
70
0
9
$DIMTFAC
40
1.0
9
$DIMGAP
40
0.625
9
$DIMJUST
70
0
9
$DIMSD1
70
0
9
$DIMSD2
70
0
9
$DIMTOLJ
70
1
9
$DIMTZIN
70
0
9
$DIMALTZ
70
0
9
$DIMALTTZ
70
0
9
$DIMUPT
70
0
9
$DIMATFIT
70
3
9
$DIMFRAC
70
0
9
$DIMLUNIT
70
2
9
$DSEP
70
44
9
$DIMLWD
70
-2
9
$DIMLWE
70
-2
0
ENDSEC
`;
    }

    /**
     * 写入DXF表格段
     */
    writeDxfTables() {
        this.dxfContent += `0
SECTION
2
TABLES
0
TABLE
2
VPORT
5
8
330
0
100
AcDbSymbolTable
70
1
0
VPORT
5
29
330
8
100
AcDbSymbolTableRecord
100
AcDbViewportTableRecord
2
*ACTIVE
70
0
10
0.0
20
0.0
11
1.0
21
1.0
12
286.3055555555554861
22
148.5
13
0.0
23
0.0
14
10.0
24
10.0
15
10.0
25
10.0
16
0.0
26
0.0
36
1.0
17
0.0
27
0.0
37
0.0
40
297.0
41
1.92798353909465
42
50.0
43
0.0
44
0.0
50
0.0
51
0.0
71
0
72
100
73
1
74
3
75
0
76
0
77
0
78
0
281
0
65
1
110
0.0
120
0.0
130
0.0
111
1.0
121
0.0
131
0.0
112
0.0
122
1.0
132
0.0
79
0
146
0.0
0
ENDTAB
0
TABLE
2
LTYPE
5
5
330
0
100
AcDbSymbolTable
70
1
0
LTYPE
5
14
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
BYBLOCK
70
0
3

72
65
73
0
40
0.0
0
LTYPE
5
15
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
BYLAYER
70
0
3

72
65
73
0
40
0.0
0
LTYPE
5
16
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
ENDTAB
0
TABLE
2
LAYER
5
2
330
0
100
AcDbSymbolTable
70
6
0
LAYER
5
10
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
0
70
0
62
7
6
CONTINUOUS
370
-3
390
F
0
LAYER
5
11
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
CURVE_CENTER
70
0
62
${this.layerColors.CURVE_CENTER}
6
CONTINUOUS
370
-3
390
F
0
LAYER
5
12
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
CURVE_LEFT
70
0
62
${this.layerColors.CURVE_LEFT}
6
CONTINUOUS
370
-3
390
F
0
LAYER
5
13
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
CURVE_RIGHT
70
0
62
${this.layerColors.CURVE_RIGHT}
6
CONTINUOUS
370
-3
390
F
0
LAYER
5
17
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
CURVE_MAIN
70
0
62
${this.layerColors.CURVE_MAIN}
6
CONTINUOUS
370
-3
390
F
0
LAYER
5
18
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
CURVE_TEXT
70
0
62
${this.layerColors.CURVE_TEXT}
6
CONTINUOUS
370
-3
390
F
0
ENDTAB
0
TABLE
2
STYLE
5
3
330
0
100
AcDbSymbolTable
70
1
0
STYLE
5
11
330
3
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
2
STANDARD
70
0
40
0.0
41
1.0
50
0.0
71
0
42
2.5
3
txt
4

0
ENDTAB
0
TABLE
2
VIEW
5
6
330
0
100
AcDbSymbolTable
70
0
0
ENDTAB
0
TABLE
2
UCS
5
7
330
0
100
AcDbSymbolTable
70
0
0
ENDTAB
0
TABLE
2
APPID
5
9
330
0
100
AcDbSymbolTable
70
1
0
APPID
5
12
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
2
ACAD
70
0
0
ENDTAB
0
TABLE
2
DIMSTYLE
5
A
330
0
100
AcDbSymbolTable
70
1
0
DIMSTYLE
105
27
330
A
100
AcDbSymbolTableRecord
100
AcDbDimStyleTableRecord
2
STANDARD
70
0
0
ENDTAB
0
TABLE
2
BLOCK_RECORD
5
1
330
0
100
AcDbSymbolTable
70
1
0
BLOCK_RECORD
5
1F
330
1
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
2
*MODEL_SPACE
340
22
0
BLOCK_RECORD
5
1B
330
1
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
2
*PAPER_SPACE
340
1E
0
ENDTAB
0
ENDSEC
`;
    }

    /**
     * 写入DXF实体段
     */
    writeDxfEntities(curveData, options) {
        this.dxfContent += `0
SECTION
2
ENTITIES
`;

        const { mainPoints, stationData, curveElements } = curveData;

        // 绘制主点
        if (options.includeMainPoints && mainPoints) {
            this.drawMainPoints(mainPoints, options);
        }

        // 绘制中桩
        if (options.includeCenterStakes && stationData) {
            this.drawCenterStakes(stationData, options);
        }

        // 绘制左边桩
        if (options.includeLeftStakes && stationData) {
            this.drawSideStakes(stationData, 'left', options);
        }

        // 绘制右边桩
        if (options.includeRightStakes && stationData) {
            this.drawSideStakes(stationData, 'right', options);
        }

        // 绘制曲线
        this.drawCurveLine(stationData, options);

        this.dxfContent += `0
ENDSEC
`;
    }

    /**
     * 绘制主点
     */
    drawMainPoints(mainPoints, options) {
        Object.values(mainPoints).forEach(point => {
            const { x, y } = point.coordinates;
            
            // 绘制点
            this.addPoint(x, y, 'CURVE_MAIN', options.pointSize * 2);
            
            // 绘制文字
            if (options.includeText) {
                this.addText(x + 2, y + 2, point.name, options.textHeight, 'CURVE_TEXT');
                this.addText(x + 2, y - 2, this.formatStation(point.station), options.textHeight * 0.8, 'CURVE_TEXT');
            }
        });
    }

    /**
     * 绘制中桩
     */
    drawCenterStakes(stationData, options) {
        stationData.forEach(data => {
            const { x, y } = data;
            
            // 绘制点
            this.addPoint(x, y, 'CURVE_CENTER', options.pointSize);
            
            // 绘制文字
            if (options.includeText && data.pointName !== 'ZH' && data.pointName !== 'HY' && 
                data.pointName !== 'QZ' && data.pointName !== 'YH' && data.pointName !== 'HZ') {
                this.addText(x + 1, y + 1, this.formatStation(data.station), options.textHeight * 0.6, 'CURVE_TEXT');
            }
        });
    }

    /**
     * 绘制边桩
     */
    drawSideStakes(stationData, side, options) {
        const layerName = side === 'left' ? 'CURVE_LEFT' : 'CURVE_RIGHT';
        const distance = side === 'left' ? options.leftDistance || 1 : options.rightDistance || 1;
        
        stationData.forEach(data => {
            const { x, y, azimuth } = data;
            
            // 计算边桩坐标
            const perpAzimuth = azimuth + (side === 'left' ? Math.PI / 2 : -Math.PI / 2);
            const sideX = x + distance * Math.cos(perpAzimuth);
            const sideY = y + distance * Math.sin(perpAzimuth);
            
            // 绘制点
            this.addPoint(sideX, sideY, layerName, options.pointSize * 0.8);
            
            // 绘制连线
            this.addLine(x, y, sideX, sideY, layerName);
        });
    }

    /**
     * 绘制曲线
     */
    drawCurveLine(stationData, options) {
        if (!stationData || stationData.length < 2) return;
        
        for (let i = 0; i < stationData.length - 1; i++) {
            const point1 = stationData[i];
            const point2 = stationData[i + 1];
            
            this.addLine(point1.x, point1.y, point2.x, point2.y, 'CURVE_CENTER');
        }
    }

    /**
     * 添加点实体
     */
    addPoint(x, y, layer, size = 1.0) {
        this.dxfContent += `0
POINT
5
${this.getNextHandle()}
330
1F
100
AcDbEntity
8
${layer}
100
AcDbPoint
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0.0
39
${size.toFixed(1)}
`;
    }

    /**
     * 添加直线实体
     */
    addLine(x1, y1, x2, y2, layer) {
        this.dxfContent += `0
LINE
5
${this.getNextHandle()}
330
1F
100
AcDbEntity
8
${layer}
100
AcDbLine
10
${x1.toFixed(3)}
20
${y1.toFixed(3)}
30
0.0
11
${x2.toFixed(3)}
21
${y2.toFixed(3)}
31
0.0
`;
    }

    /**
     * 添加文字实体
     */
    addText(x, y, text, height, layer) {
        this.dxfContent += `0
TEXT
5
${this.getNextHandle()}
330
1F
100
AcDbEntity
8
${layer}
100
AcDbText
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0.0
40
${height.toFixed(1)}
1
${text}
50
0.0
41
1.0
51
0.0
7
STANDARD
71
0
72
0
11
${x.toFixed(3)}
21
${y.toFixed(3)}
31
0.0
100
AcDbText
`;
    }

    /**
     * 添加圆实体
     */
    addCircle(x, y, radius, layer) {
        this.dxfContent += `0
CIRCLE
5
${this.getNextHandle()}
330
1F
100
AcDbEntity
8
${layer}
100
AcDbCircle
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0.0
40
${radius.toFixed(3)}
`;
    }

    /**
     * 写入DXF尾部
     */
    writeDxfFooter() {
        this.dxfContent += `0
SECTION
2
BLOCKS
0
BLOCK
5
20
330
1F
100
AcDbEntity
8
0
100
AcDbBlockBegin
2
*MODEL_SPACE
70
0
10
0.0
20
0.0
30
0.0
3
*MODEL_SPACE
1

0
ENDBLK
5
21
330
1F
100
AcDbEntity
8
0
100
AcDbBlockEnd
0
BLOCK
5
1C
330
1B
100
AcDbEntity
8
0
100
AcDbBlockBegin
2
*PAPER_SPACE
70
0
10
0.0
20
0.0
30
0.0
3
*PAPER_SPACE
1

0
ENDBLK
5
1D
330
1B
100
AcDbEntity
8
0
100
AcDbBlockEnd
0
ENDSEC
0
SECTION
2
OBJECTS
0
DICTIONARY
5
C
330
0
100
AcDbDictionary
3
ACAD_GROUP
350
D
3
ACAD_MLINESTYLE
350
17
0
DICTIONARY
5
D
330
C
100
AcDbDictionary
0
DICTIONARY
5
1A
330
C
100
AcDbDictionary
0
DICTIONARY
5
17
330
C
100
AcDbDictionary
3
STANDARD
350
18
0
MLINESTYLE
5
18
330
17
100
AcDbMlineStyle
2
STANDARD
70
0
3

62
256
51
90.0
52
90.0
71
2
49
0.5
62
256
6
BYLAYER
49
-0.5
62
256
6
BYLAYER
0
ENDSEC
0
EOF
`;
    }

    /**
     * 获取下一个实体句柄
     */
    getNextHandle() {
        return (this.entityHandle++).toString(16).toUpperCase();
    }

    /**
     * 格式化桩号显示
     */
    formatStation(station) {
        const km = Math.floor(station / 1000);
        const m = station % 1000;
        return `K${km}+${m.toFixed(3)}`;
    }

    /**
     * 获取当前日期字符串
     */
    getCurrentDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        return `${year}${month}${day}_${hour}${minute}`;
    }
}

// 导出服务类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DxfExportService;
} else if (typeof window !== 'undefined') {
    window.DxfExportService = DxfExportService;
}