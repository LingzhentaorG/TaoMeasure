/**
 * 曲线测设 - 对称基本型曲线测设功能
 * 实现曲线综合要素计算、主点坐标计算、中桩坐标计算、边桩坐标计算等功能
 */

class CurveDesign {
    constructor() {
        this.currentParams = {
            // 曲线设计参数
            intersectionStation: '',  // 交点桩号
            deflectionAngle: '',      // 转角α(d.mmss)
            transitionLength: 100,    // 缓和曲线长L_s(m)
            radius: 1000,            // 圆半径R(m)
            intersectionX: '',       // 交点坐标X_JD
            intersectionY: '',       // 交点坐标Y_JD
            startAzimuth: '',        // 起点方位
            orientationX: '',        // 定向点坐标X_DX
            orientationY: '',        // 定向点坐标Y_DX
            deflectionDirection: 1,   // 偏向cc (1右偏, -1左偏)
            
            // 放样参数
            layoutMethod: '极坐标法',  // 放样方式
            stationX: '',            // 设站坐标X_s
            stationY: '',            // 设站坐标Y_s
            stationSelection: '',    // 设站选择
            backsightX: '',          // 后视点坐标X_h
            backsightY: '',          // 后视点坐标Y_h
            backsightSelection: '',  // 后视点选择
            includeAngle: 0,         // 夹角(d.mmss)
            leftDistance: 1,         // 左边距d_l(m)
            rightDistance: 1,        // 右边距d_r(m)
            searchStation: '',       // 里程查找点
            
            // 桩号生成参数
            stationInterval: 25,     // 桩号间隔
            incrementMethod: 'whole' // 递增方式: 'whole'整桩号, 'start'起点递增
        };
        
        this.calculatedElements = null;  // 曲线综合要素
        this.mainPoints = null;          // 主点坐标
        this.stationData = [];           // 桩号数据
        
        this.init();
    }
    
    init() {
        this.createInterface();
        this.bindEvents();
        this.loadDefaultData();
    }
    
    createInterface() {
        const container = document.getElementById('transitionCurve-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="curve-design-container">
                <!-- 功能标题区域 -->
                <div class="function-header">
                    <div class="function-title">
                        <i class="fas fa-bezier-curve"></i>
                        <span>曲线测设 - 对称基本型曲线测设</span>
                    </div>
                    <div class="function-description">
                        核心功能，支持"综合要素计算→主点坐标→中桩坐标→边桩坐标→DXF导出"全流程
                    </div>
                </div>

                <!-- 工具栏 -->
                <div class="curve-toolbar">
                    <button class="tool-btn" id="curveImportBtn"><i class="fas fa-file-import"></i> 导入参数</button>
                    <button class="tool-btn" id="curveSettingsBtn"><i class="fas fa-cog"></i> 计算方案</button>
                    <button class="tool-btn primary" id="curveCalculateBtn"><i class="fas fa-calculator"></i> 开始计算</button>
                    <button class="tool-btn" id="curveExportBtn"><i class="fas fa-file-export"></i> 导出结果</button>
                    <button class="tool-btn" id="curveDxfBtn"><i class="fas fa-drafting-compass"></i> 导出DXF</button>
                    <button class="tool-btn" id="testCurveBtn" style="background: #ff9800; color: white;"><i class="fas fa-bug"></i> 测试修复</button>
                </div>

                <!-- 选项卡 -->
                <div class="curve-tabs">
                    <div class="curve-tab active" data-tab="input">参数输入</div>
                    <div class="curve-tab" data-tab="elements">综合要素</div>
                    <div class="curve-tab" data-tab="coordinates">坐标成果与放样表</div>
                </div>

                <!-- 参数输入面板 -->
                <div class="curve-panel active" id="curve-input-panel">
                    ${this.createInputPanel()}
                </div>

                <!-- 综合要素面板 -->
                <div class="curve-panel" id="curve-elements-panel">
                    ${this.createElementsPanel()}
                </div>

                <!-- 坐标成果与放样表面板 -->
                <div class="curve-panel" id="curve-coordinates-panel">
                    ${this.createCoordinatesPanel()}
                </div>
            </div>
        `;
    }
    
    createInputPanel() {
        return `
            <div class="input-panel">
                <div class="input-sections">
                    <!-- 曲线设计参数 -->
                    <div class="input-section">
                        <h4><i class="fas fa-drafting-compass"></i> 曲线设计参数</h4>
                        <div class="input-grid">
                            <div class="input-group">
                                <label>交点桩号:</label>
                                <input type="text" id="intersectionStation" placeholder="1462.918或K1+462.918" value="K1+462.918">
                                <span class="input-help">用户输入交点的里程或者桩号</span>
                            </div>
                            <div class="input-group">
                                <label>转角α(d.mmss):</label>
                                <input type="text" id="deflectionAngle" placeholder="21.03266" value="21.03266">
                                <span class="input-help">角度格式为（度.分秒），如21度03分26.6秒</span>
                            </div>
                            <div class="input-group">
                                <label>缓和曲线长L_s(m):</label>
                                <input type="number" id="transitionLength" value="100" step="0.001">
                                <span class="input-help">用户输入缓和曲线长</span>
                            </div>
                            <div class="input-group">
                                <label>圆半径R(m):</label>
                                <input type="number" id="radius" value="1000" step="0.001">
                                <span class="input-help">用户输入圆曲线半径</span>
                            </div>
                            <div class="input-group">
                                <label>交点坐标X_JD:</label>
                                <input type="number" id="intersectionX" value="84753.510" step="0.001">
                                <span class="input-help">用户输入交点X坐标</span>
                            </div>
                            <div class="input-group">
                                <label>交点坐标Y_JD:</label>
                                <input type="number" id="intersectionY" value="11978.927" step="0.001">
                                <span class="input-help">用户输入交点Y坐标</span>
                            </div>
                            <div class="input-group">
                                <label>起点方位:</label>
                                <input type="text" id="startAzimuth" placeholder="287.0633" value="287.0633">
                                <span class="input-help">输入格式同上，即度.分秒</span>
                            </div>
                            <div class="input-group">
                                <label>定向点坐标X_DX:</label>
                                <input type="number" id="orientationX" value="84678.761" step="0.001">
                                <span class="input-help">用于自动计算起点方位</span>
                            </div>
                            <div class="input-group">
                                <label>定向点坐标Y_DX:</label>
                                <input type="number" id="orientationY" value="12221.766" step="0.001">
                                <span class="input-help">用于自动计算起点方位</span>
                            </div>
                            <div class="input-group">
                                <label>偏向cc:</label>
                                <select id="deflectionDirection">
                                    <option value="1">右偏(1)</option>
                                    <option value="-1">左偏(-1)</option>
                                </select>
                                <span class="input-help">右偏1，左偏-1</span>
                            </div>
                        </div>
                    </div>

                    <!-- 放样参数 -->
                    <div class="input-section">
                        <h4><i class="fas fa-crosshairs"></i> 放样参数</h4>
                        <div class="input-grid">
                            <div class="input-group">
                                <label>放样方式:</label>
                                <select id="layoutMethod">
                                    <option value="极坐标法">极坐标法</option>
                                    <option value="切线支距法" disabled>切线支距法</option>
                                    <option value="弦线支距法" disabled>弦线支距法</option>
                                    <option value="任意直线支距法" disabled>任意直线支距法</option>
                                    <option value="偏角法" disabled>偏角法</option>
                                </select>
                                <span class="input-help">默认极坐标法，其他方法不实现</span>
                            </div>
                            <div class="input-group">
                                <label>设站坐标X_s:</label>
                                <input type="number" id="stationX" value="84753.510" step="0.001">
                                <span class="input-help">用户输入设站X坐标</span>
                            </div>
                            <div class="input-group">
                                <label>设站坐标Y_s:</label>
                                <input type="number" id="stationY" value="11978.927" step="0.001">
                                <span class="input-help">用户输入设站Y坐标</span>
                            </div>
                            <div class="input-group">
                                <label>设站选择:</label>
                                <select id="stationSelection">
                                    <option value="">手动输入坐标</option>
                                    <option value="ZH">ZH</option>
                                    <option value="HY">HY</option>
                                    <option value="QZ">QZ</option>
                                    <option value="YH">YH</option>
                                    <option value="HZ">HZ</option>
                                </select>
                                <span class="input-help">选择主点作为设站点</span>
                            </div>
                            <div class="input-group">
                                <label>后视点坐标X_h:</label>
                                <input type="number" id="backsightX" value="84678.761" step="0.001">
                                <span class="input-help">用户输入后视点X坐标</span>
                            </div>
                            <div class="input-group">
                                <label>后视点坐标Y_h:</label>
                                <input type="number" id="backsightY" value="12221.766" step="0.001">
                                <span class="input-help">用户输入后视点Y坐标</span>
                            </div>
                            <div class="input-group">
                                <label>后视点选择:</label>
                                <select id="backsightSelection">
                                    <option value="">手动输入坐标</option>
                                    <option value="ZH">ZH</option>
                                    <option value="HY">HY</option>
                                    <option value="QZ">QZ</option>
                                    <option value="YH">YH</option>
                                    <option value="HZ">HZ</option>
                                </select>
                                <span class="input-help">选择主点作为后视点</span>
                            </div>
                            <div class="input-group">
                                <label>夹角(d.mmss):</label>
                                <input type="text" id="includeAngle" value="0.0000">
                                <span class="input-help">实际照准点与后视点之间的夹角</span>
                            </div>
                            <div class="input-group">
                                <label>左边距d_l(m):</label>
                                <input type="number" id="leftDistance" value="1" step="0.001">
                                <span class="input-help">用户输入左边桩距离</span>
                            </div>
                            <div class="input-group">
                                <label>右边距d_r(m):</label>
                                <input type="number" id="rightDistance" value="1" step="0.001">
                                <span class="input-help">用户输入右边桩距离</span>
                            </div>
                            <div class="input-group">
                                <label>里程查找点:</label>
                                <input type="text" id="searchStation" placeholder="1462.918或K1+462.918">
                                <span class="input-help">在结果表格中高亮显示该点</span>
                            </div>
                        </div>
                    </div>

                    <!-- 桩号生成参数 -->
                    <div class="input-section">
                        <h4><i class="fas fa-list-ol"></i> 桩号生成参数</h4>
                        <div class="input-grid">
                            <div class="input-group">
                                <label>桩号间隔:</label>
                                <input type="number" id="stationInterval" value="25" min="1" step="0.001">
                                <span class="input-help">相邻桩号的里程差，决定放样点密度</span>
                            </div>
                            <div class="input-group">
                                <label>递增方式:</label>
                                <select id="incrementMethod">
                                    <option value="whole">整桩号</option>
                                    <option value="start">起点递增</option>
                                </select>
                                <span class="input-help">整桩号：间隔的整数倍；起点递增：从ZH开始递增</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="input-actions">
                    <button class="tool-btn" id="autoCalculateAzimuthBtn">
                        <i class="fas fa-compass"></i> 自动计算起点方位
                    </button>
                    <button class="tool-btn" id="validateParamsBtn">
                        <i class="fas fa-check-circle"></i> 验证参数
                    </button>
                    <button class="tool-btn primary" id="calculateElementsBtn">
                        <i class="fas fa-calculator"></i> 计算综合要素
                    </button>
                </div>
            </div>
        `;
    }
    
    createElementsPanel() {
        return `
            <div class="elements-panel">
                <div class="elements-header">
                    <h4><i class="fas fa-calculator"></i> 曲线综合要素</h4>
                    <div class="elements-actions">
                        <button class="tool-btn" id="recalculateElementsBtn">
                            <i class="fas fa-redo"></i> 重新计算
                        </button>
                        <button class="tool-btn" id="exportElementsBtn">
                            <i class="fas fa-file-export"></i> 导出要素
                        </button>
                    </div>
                </div>
                
                <div class="elements-content">
                    <div class="elements-grid">
                        <div class="element-item">
                            <label>切线长 T (m):</label>
                            <span id="tangentLength">-</span>
                        </div>
                        <div class="element-item">
                            <label>总曲线长 L (m):</label>
                            <span id="totalCurveLength">-</span>
                        </div>
                        <div class="element-item">
                            <label>外矢距 E (m):</label>
                            <span id="externalDistance">-</span>
                        </div>
                        <div class="element-item">
                            <label>切曲差 D (m):</label>
                            <span id="tangentCurveDiff">-</span>
                        </div>
                        <div class="element-item">
                            <label>缓和曲线总偏角 β₀ (°′″):</label>
                            <span id="transitionDeflection">-</span>
                        </div>
                        <div class="element-item">
                            <label>圆曲线长 Ly (m):</label>
                            <span id="circularLength">-</span>
                        </div>
                    </div>
                    
                    <div class="main-points-section">
                        <h5><i class="fas fa-map-marker-alt"></i> 主点桩号</h5>
                        <div class="main-points-grid">
                            <div class="point-item">
                                <label>ZH (直缓点):</label>
                                <span id="zhStation">-</span>
                            </div>
                            <div class="point-item">
                                <label>HY (缓圆点):</label>
                                <span id="hyStation">-</span>
                            </div>
                            <div class="point-item">
                                <label>QZ (曲中点):</label>
                                <span id="qzStation">-</span>
                            </div>
                            <div class="point-item">
                                <label>YH (圆缓点):</label>
                                <span id="yhStation">-</span>
                            </div>
                            <div class="point-item">
                                <label>HZ (缓直点):</label>
                                <span id="hzStation">-</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="main-coordinates-section">
                        <h5><i class="fas fa-crosshairs"></i> 主点坐标</h5>
                        <table class="main-points-table">
                            <thead>
                                <tr>
                                    <th>点名</th>
                                    <th>桩号</th>
                                    <th>X坐标(m)</th>
                                    <th>Y坐标(m)</th>
                                    <th>切线方位(°′″)</th>
                                </tr>
                            </thead>
                            <tbody id="mainPointsTableBody">
                                <tr><td colspan="5" class="no-data">请先计算综合要素</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    createCoordinatesPanel() {
        return `
            <div class="coordinates-panel">
                <div class="coordinates-header">
                    <h4><i class="fas fa-table"></i> 坐标成果与放样表</h4>
                    <div class="coordinates-actions">
                        <button class="tool-btn" id="generateCoordinatesBtn">
                            <i class="fas fa-calculator"></i> 生成坐标与放样表
                        </button>
                        <button class="tool-btn" id="exportCoordinatesBtn">
                            <i class="fas fa-file-export"></i> 导出表格
                        </button>
                        <button class="tool-btn" id="previewLayoutBtn">
                            <i class="fas fa-eye"></i> 预览打印
                        </button>
                    </div>
                </div>
                
                <div class="coordinates-content">
                    <div class="coordinates-info">
                        <span>工程名称：<input type="text" id="projectName" value="未命名工程" class="project-input"></span>
                        <span>桩号间隔：<span id="currentInterval">25</span>m</span>
                        <span>递增方式：<span id="currentMethod">整桩号</span></span>
                        <span>总点数：<span id="totalPoints">0</span></span>
                    </div>
                    
                    <div class="layout-params-info">
                        <span>设站点：<span id="currentStation">-</span></span>
                        <span>后视点：<span id="currentBacksight">-</span></span>
                        <span>左边距：<span id="currentLeftDist">1</span>m</span>
                        <span>右边距：<span id="currentRightDist">1</span>m</span>
                    </div>
                    
                    <div class="coordinates-table-container" id="coordinatesTableContainer">
                        <div class="no-data-message">
                            <i class="fas fa-info-circle"></i>
                            <p>请先完成参数输入和综合要素计算，然后点击"生成坐标与放样表"</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 放样面板已合并到坐标面板中
    
    bindEvents() {
        // 选项卡切换
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('curve-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
        
        // 自动计算起点方位
        const autoAzimuthBtn = document.getElementById('autoCalculateAzimuthBtn');
        if (autoAzimuthBtn) {
            autoAzimuthBtn.addEventListener('click', () => this.autoCalculateAzimuth());
        }
        
        // 验证参数
        const validateBtn = document.getElementById('validateParamsBtn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => this.validateParameters());
        }
        
        // 计算综合要素
        const calculateBtn = document.getElementById('calculateElementsBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateElements());
        }
        
        // 工具栏中的开始计算按钮
        const curveCalculateBtn = document.getElementById('curveCalculateBtn');
        if (curveCalculateBtn) {
            curveCalculateBtn.addEventListener('click', () => this.calculateElements());
        }
        
        // 测试修复按钮
        const testCurveBtn = document.getElementById('testCurveBtn');
        if (testCurveBtn) {
            testCurveBtn.addEventListener('click', () => this.testCurveFix());
        }
        
        // 导入参数按钮
        const curveImportBtn = document.getElementById('curveImportBtn');
        if (curveImportBtn) {
            curveImportBtn.addEventListener('click', () => this.importParameters());
        }
        
        // 计算方案按钮
        const curveSettingsBtn = document.getElementById('curveSettingsBtn');
        if (curveSettingsBtn) {
            curveSettingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        // 重新计算按钮
        const recalculateBtn = document.getElementById('recalculateElementsBtn');
        if (recalculateBtn) {
            recalculateBtn.addEventListener('click', () => this.calculateElements());
        }
        
        // 生成坐标
        const generateCoordBtn = document.getElementById('generateCoordinatesBtn');
        if (generateCoordBtn) {
            generateCoordBtn.addEventListener('click', () => this.generateCoordinates());
        }
        
        // 生成坐标与放样表按钮事件已合并
        
        // 设站选择变化
        const stationSelect = document.getElementById('stationSelection');
        if (stationSelect) {
            stationSelect.addEventListener('change', (e) => this.updateStationCoordinates(e.target.value));
        }
        
        // 后视点选择变化
        const backsightSelect = document.getElementById('backsightSelection');
        if (backsightSelect) {
            backsightSelect.addEventListener('change', (e) => this.updateBacksightCoordinates(e.target.value));
        }
        
        // 参数变化时更新显示
        const inputs = ['stationInterval', 'incrementMethod', 'leftDistance', 'rightDistance'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateDisplayInfo());
            }
        });

        // 导出结果按钮
        const curveExportBtn = document.getElementById('curveExportBtn');
        if (curveExportBtn) {
            curveExportBtn.addEventListener('click', () => this.showExportDialog());
        }
        
        // DXF导出按钮
        const curveDxfBtn = document.getElementById('curveDxfBtn');
        if (curveDxfBtn) {
            curveDxfBtn.addEventListener('click', () => this.showDxfExportDialog());
        }
    }
    
    switchTab(tabName) {
        // 切换选项卡样式
        document.querySelectorAll('.curve-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 切换面板显示
        document.querySelectorAll('.curve-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`curve-${tabName}-panel`).classList.add('active');
    }
    
    loadDefaultData() {
        // 加载默认的示例数据
        const defaultData = {
            intersectionStation: 'K1+462.918',
            deflectionAngle: '23.03377',
            transitionLength: 100,
            radius: 1000,
            intersectionX: 84753.510,
            intersectionY: 11978.927,
            startAzimuth: '287.0633',
            orientationX: 84678.761,
            orientationY: 12221.766,
            deflectionDirection: 1,
            stationX: 84618.761,
            stationY: 12271.765,
            backsightX: 84707.070,
            backsightY: 11902.864,
            leftDistance: 20,
            rightDistance: 20,
            stationInterval: 25,
            incrementMethod: 'whole'
        };
        
        // 填充表单
        Object.keys(defaultData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = defaultData[key];
            }
        });
        
        this.updateDisplayInfo();
    }
    
    updateDisplayInfo() {
        // 更新显示信息
        const interval = document.getElementById('stationInterval')?.value || 25;
        const method = document.getElementById('incrementMethod')?.value || 'whole';
        const leftDist = document.getElementById('leftDistance')?.value || 1;
        const rightDist = document.getElementById('rightDistance')?.value || 1;
        
        const currentIntervalEl = document.getElementById('currentInterval');
        const currentMethodEl = document.getElementById('currentMethod');
        const currentLeftDistEl = document.getElementById('currentLeftDist');
        const currentRightDistEl = document.getElementById('currentRightDist');
        
        if (currentIntervalEl) currentIntervalEl.textContent = interval;
        if (currentMethodEl) currentMethodEl.textContent = method === 'whole' ? '整桩号' : '起点递增';
        if (currentLeftDistEl) currentLeftDistEl.textContent = leftDist;
        if (currentRightDistEl) currentRightDistEl.textContent = rightDist;
    }
    
    // 角度格式转换：dd.mmsss → 十进制度
    dmsToDecimal(dmsStr) {
        // 使用统一的角度处理工具
        if (typeof window !== 'undefined' && window.AngleUtils) {
            return window.AngleUtils.dmsToDecimal(dmsStr);
        }
        
        // 备用实现 - 正确处理dd.mmsss格式
        if (typeof dmsStr === 'number') return dmsStr;
        if (typeof dmsStr !== 'string') return 0;
        
        const parts = dmsStr.split('.');
        if (parts.length !== 2) return parseFloat(dmsStr) || 0;
        
        const degrees = parseInt(parts[0]) || 0;
        const fractionalPart = parts[1].padEnd(5, '0'); // 确保至少5位：mmsss
        
        // 正确解析dd.mmsss格式：mm为分钟，sss为秒数（含小数）
        const minutes = parseInt(fractionalPart.substr(0, 2)) || 0;
        const secondsStr = fractionalPart.substr(2, 3); // 取3位秒数
        const seconds = parseFloat(secondsStr) / 10; // 除以10得到实际秒数
        
        const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
        return degrees < 0 ? -decimal : decimal;
    }
    
    // 十进制度 → dd.mmsss格式
    decimalToDms(decimal) {
        // 使用统一的角度处理工具
        if (typeof window !== 'undefined' && window.AngleUtils) {
            return window.AngleUtils.decimalToDms(decimal);
        }
        
        // 备用实现 - 正确输出dd.mmsss格式
        if (typeof decimal !== 'number' || isNaN(decimal)) return '0.00000';

        const sign = decimal < 0 ? '-' : '';
        const abs = Math.abs(decimal);
        
        const degrees = Math.floor(abs);
        const minutesFloat = (abs - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const secondsFloat = (minutesFloat - minutes) * 60;
        
        // 四舍五入到0.1秒精度
        const seconds = Math.round(secondsFloat * 10) / 10;
        
        // 格式化为dd.mmsss
        const secondsInt = Math.floor(seconds);
        const secondsFrac = Math.round((seconds - secondsInt) * 10);
        const secondsFormatted = secondsInt.toString().padStart(2, '0') + secondsFrac.toString();

        return `${sign}${degrees}.${minutes.toString().padStart(2, '0')}${secondsFormatted}`;
    }
    
    // 自动计算起点方位
    autoCalculateAzimuth() {
        const jdX = parseFloat(document.getElementById('intersectionX').value);
        const jdY = parseFloat(document.getElementById('intersectionY').value);
        const dxX = parseFloat(document.getElementById('orientationX').value);
        const dxY = parseFloat(document.getElementById('orientationY').value);
        
        if (isNaN(jdX) || isNaN(jdY) || isNaN(dxX) || isNaN(dxY)) {
            this.showNotification('请先输入完整的交点坐标和定向点坐标', 'warning');
            return;
        }
        
        // 检查点位重合
        if (Math.abs(jdX - dxX) < 0.001 && Math.abs(jdY - dxY) < 0.001) {
            this.showNotification('交点与定向点重合，无法计算方位角', 'warning');
            document.getElementById('startAzimuth').value = '0.00000';
            return;
        }
        
        // 使用统一的角度处理工具计算方位角
        let azimuth;
        if (typeof window !== 'undefined' && window.AngleUtils) {
            azimuth = window.AngleUtils.calculateAzimuth(dxX, dxY, jdX, jdY);
        } else {
            // 备用实现 - 坐标方位角计算（测量学标准）
            const deltaX = jdX - dxX;
            const deltaY = jdY - dxY;
            azimuth = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
            
            // 确保方位角为0-360度的正数
            azimuth = ((azimuth % 360) + 360) % 360;
        }
        
        // 转换为dd.mmsss格式并填入
        const azimuthDms = this.decimalToDms(azimuth);
        document.getElementById('startAzimuth').value = azimuthDms;
        
        this.showNotification(`起点方位已自动计算: ${azimuthDms}`, 'success');
    }
    
    // 验证参数
    validateParameters() {
        const errors = [];
        
        // 检查必填参数
        const requiredFields = [
            { id: 'intersectionStation', name: '交点桩号' },
            { id: 'deflectionAngle', name: '转角' },
            { id: 'transitionLength', name: '缓和曲线长' },
            { id: 'radius', name: '圆半径' },
            { id: 'intersectionX', name: '交点X坐标' },
            { id: 'intersectionY', name: '交点Y坐标' },
            { id: 'startAzimuth', name: '起点方位' }
        ];
        
        requiredFields.forEach(field => {
            const value = document.getElementById(field.id).value;
            if (!value || value.trim() === '') {
                errors.push(`${field.name}不能为空`);
            }
        });
        
        // 检查数值范围
        const radius = parseFloat(document.getElementById('radius').value);
        if (radius <= 0) {
            errors.push('圆半径必须大于0');
        }
        
        const transitionLength = parseFloat(document.getElementById('transitionLength').value);
        if (transitionLength <= 0) {
            errors.push('缓和曲线长必须大于0');
        }
        
        const deflectionAngle = this.dmsToDecimal(document.getElementById('deflectionAngle').value);
        if (Math.abs(deflectionAngle) > 180) {
            errors.push('转角绝对值不能超过180度');
        }
        
        if (errors.length > 0) {
            this.showNotification('参数验证失败:\n' + errors.join('\n'), 'error');
            return false;
        }
        
        this.showNotification('参数验证通过', 'success');
        return true;
    }
    
    // 计算综合要素
    async calculateElements() {
        if (!this.validateParameters()) return;
        
        try {
            // 获取并验证参数
            const deflectionAngle = this.dmsToDecimal(document.getElementById('deflectionAngle').value);
            const radius = parseFloat(document.getElementById('radius').value);
            const transitionLength = parseFloat(document.getElementById('transitionLength').value);
            const intersectionX = parseFloat(document.getElementById('intersectionX').value);
            const intersectionY = parseFloat(document.getElementById('intersectionY').value);
            const startAzimuth = this.dmsToDecimal(document.getElementById('startAzimuth').value);
            const deflectionDirection = parseInt(document.getElementById('deflectionDirection').value);
            const intersectionStation = document.getElementById('intersectionStation').value;

            // 验证所有参数的有效性
            if (!this.isValidNumber(deflectionAngle) || deflectionAngle <= 0) {
                throw new Error('转角必须为正数');
            }
            if (!this.isValidNumber(radius) || radius <= 0) {
                throw new Error('半径必须为正数');
            }
            if (!this.isValidNumber(transitionLength) || transitionLength < 0) {
                throw new Error('缓和曲线长度不能为负数');
            }
            if (!this.isValidNumber(intersectionX)) {
                throw new Error('交点X坐标无效');
            }
            if (!this.isValidNumber(intersectionY)) {
                throw new Error('交点Y坐标无效');
            }
            if (!this.isValidNumber(startAzimuth)) {
                throw new Error('起点方位角无效');
            }
            if (!intersectionStation || intersectionStation.trim() === '') {
                throw new Error('交点桩号不能为空');
            }

            const params = {
                deflectionAngle: deflectionAngle * Math.PI / 180,
                radius: radius,
                transitionLength: transitionLength,
                intersectionX: intersectionX,
                intersectionY: intersectionY,
                startAzimuth: startAzimuth * Math.PI / 180,
                deflectionDirection: deflectionDirection,
                intersectionStation: intersectionStation
            };
            
            // 使用后端服务计算综合要素
            console.log('计算曲线要素参数:', params);
            const curveService = new CurveDesignService();
            const elementsResult = curveService.calculateCurveElements(params);
            
            if (!elementsResult.success) {
                console.error('曲线要素计算失败:', elementsResult.error);
                throw new Error(elementsResult.error);
            }
            
            console.log('曲线要素计算结果:', elementsResult);
            
            this.calculatedElements = elementsResult;
            
            // 计算主点坐标
            const mainPointsResult = curveService.calculateMainPointCoordinates(elementsResult, params);
            
            if (!mainPointsResult.success) {
                throw new Error(mainPointsResult.error);
            }
            
            this.mainPoints = mainPointsResult.mainPoints;
            
            // 更新显示
            this.updateElementsDisplay();
            
            this.showNotification('综合要素计算完成', 'success');
            
        } catch (error) {
            console.error('计算综合要素时出错:', error);
            this.showNotification('计算综合要素时出错: ' + error.message, 'error');
        }
    }
    
    // 解析桩号字符串为数值
    parseStation(stationStr) {
        if (typeof stationStr !== 'string') return parseFloat(stationStr) || 0;
        
        // 处理 K1+462.918 格式
        const match = stationStr.match(/K?(\d+)\+?(\d+\.?\d*)/);
        if (match) {
            const km = parseInt(match[1]) || 0;
            const m = parseFloat(match[2]) || 0;
            return km * 1000 + m;
        }
        
        return parseFloat(stationStr) || 0;
    }
    
    // 格式化桩号显示
    formatStation(station) {
        const km = Math.floor(station / 1000);
        const m = station % 1000;
        return `K${km}+${m.toFixed(3)}`;
    }
    
    // 这个方法现在由后端服务处理，前端不再需要
    
    // 更新综合要素显示
    updateElementsDisplay() {
        if (!this.calculatedElements || !this.calculatedElements.elements) return;
        
        const { T, L, E, D, beta0, Ly } = this.calculatedElements.elements;
        
        // 检查所有必需的元素是否存在且为有效数字
        if (!this.isValidNumber(T) || !this.isValidNumber(L) || !this.isValidNumber(E) || 
            !this.isValidNumber(D) || !this.isValidNumber(beta0) || !this.isValidNumber(Ly)) {
            console.error('计算结果包含无效数值:', { T, L, E, D, beta0, Ly });
            this.showNotification('计算结果包含无效数值，请检查输入参数', 'error');
            return;
        }
        
        // 更新要素显示
        document.getElementById('tangentLength').textContent = T.toFixed(4);
        document.getElementById('totalCurveLength').textContent = L.toFixed(4);
        document.getElementById('externalDistance').textContent = E.toFixed(4);
        document.getElementById('tangentCurveDiff').textContent = D.toFixed(4);
        document.getElementById('transitionDeflection').textContent = this.decimalToDms(beta0 * 180 / Math.PI);
        document.getElementById('circularLength').textContent = Ly.toFixed(4);
        
        // 更新主点桩号
        if (this.mainPoints) {
            document.getElementById('zhStation').textContent = this.formatStation(this.mainPoints.ZH.station);
            document.getElementById('hyStation').textContent = this.formatStation(this.mainPoints.HY.station);
            document.getElementById('qzStation').textContent = this.formatStation(this.mainPoints.QZ.station);
            document.getElementById('yhStation').textContent = this.formatStation(this.mainPoints.YH.station);
            document.getElementById('hzStation').textContent = this.formatStation(this.mainPoints.HZ.station);
            
            // 更新主点坐标表格
            this.updateMainPointsTable();
        }
    }
    
    // 更新主点坐标表格
    updateMainPointsTable() {
        const tbody = document.getElementById('mainPointsTableBody');
        if (!tbody || !this.mainPoints) return;
        
        let html = '';
        Object.values(this.mainPoints).forEach(point => {
            if (point && point.coordinates && point.name && this.isValidNumber(point.station) && 
                this.isValidNumber(point.coordinates.x) && this.isValidNumber(point.coordinates.y) && 
                this.isValidNumber(point.coordinates.azimuth)) {
                const azimuthDms = this.decimalToDms(point.coordinates.azimuth * 180 / Math.PI);
                html += `
                    <tr>
                        <td>${point.name}</td>
                        <td>${this.formatStation(point.station)}</td>
                        <td>${point.coordinates.x.toFixed(3)}</td>
                        <td>${point.coordinates.y.toFixed(3)}</td>
                        <td>${azimuthDms}</td>
                    </tr>
                `;
            } else {
                console.warn('主点数据不完整或无效:', point);
            }
        });
        
        tbody.innerHTML = html || '<tr><td colspan="5" class="no-data">暂无数据</td></tr>';
    }
    
    // 生成坐标数据和放样表（合并功能）
    async generateCoordinates() {
        if (!this.calculatedElements || !this.mainPoints) {
            this.showNotification('请先计算综合要素', 'warning');
            return;
        }
        
        try {
            const interval = parseFloat(document.getElementById('stationInterval').value);
            const method = document.getElementById('incrementMethod').value;
            
            const curveService = new CurveDesignService();
            
            // 生成桩号序列
            const stations = curveService.generateStationSequence(this.mainPoints, interval, method);
            
            // 获取计算参数
            const params = {
                startAzimuth: this.dmsToDecimal(document.getElementById('startAzimuth').value) * Math.PI / 180,
                deflectionDirection: parseInt(document.getElementById('deflectionDirection').value)
            };
            
            // 计算每个桩号的坐标
            this.stationData = [];
            for (let i = 0; i < stations.length; i++) {
                const station = stations[i];
                const coordResult = curveService.calculateStationCoordinates(
                    station, 
                    this.calculatedElements, 
                    this.mainPoints, 
                    params
                );
                
                if (coordResult.success) {
                    this.stationData.push({
                        index: i + 1,
                        pointName: this.getPointName(station),
                        station: station,
                        x: coordResult.coordinates.x,
                        y: coordResult.coordinates.y,
                        azimuth: coordResult.coordinates.azimuth,
                        segment: coordResult.segment,
                        remark: this.getStationRemark(station)
                    });
                }
            }
            
            // 同时生成放样表
            await this.generateCombinedTable();
            this.showNotification(`成功生成${this.stationData.length}个桩号的坐标与放样数据`, 'success');
            
        } catch (error) {
            console.error('生成坐标时出错:', error);
            this.showNotification('生成坐标时出错: ' + error.message, 'error');
        }
    }
    
    // 这个方法现在由后端服务处理
    
    // 获取点名
    getPointName(station) {
        // 检查是否为主点
        for (const [name, point] of Object.entries(this.mainPoints)) {
            if (Math.abs(station - point.station) < 0.001) {
                return name;
            }
        }
        
        // 普通点用序号
        const index = this.stationData ? this.stationData.length + 1 : 1;
        return index.toString();
    }
    
    // 这个方法现在由后端服务处理
    
    // 获取曲线段类型
    getCurveSegment(station) {
        const zhStation = this.mainPoints.ZH.station;
        const hyStation = this.mainPoints.HY.station;
        const yhStation = this.mainPoints.YH.station;
        const hzStation = this.mainPoints.HZ.station;
        
        if (station <= hyStation) return '第一缓和曲线';
        if (station <= yhStation) return '圆曲线';
        if (station <= hzStation) return '第二缓和曲线';
        return '直线';
    }
    
    // 获取桩号备注
    getStationRemark(station) {
        const searchStation = document.getElementById('searchStation').value;
        if (searchStation && Math.abs(station - this.parseStation(searchStation)) < 0.001) {
            return '查找点';
        }
        return '';
    }
    
    // 更新坐标表格（现在由合并表格处理）
    updateCoordinatesTable() {
        const totalPointsEl = document.getElementById('totalPoints');
        if (totalPointsEl && this.stationData) {
            totalPointsEl.textContent = this.stationData.length;
        }
    }
    
    // 生成放样表格
    async generateLayoutTable() {
        if (!this.stationData || this.stationData.length === 0) {
            this.showNotification('请先生成坐标数据', 'warning');
            return;
        }
        
        try {
            // 获取放样参数
            const stationX = parseFloat(document.getElementById('stationX').value);
            const stationY = parseFloat(document.getElementById('stationY').value);
            const backsightX = parseFloat(document.getElementById('backsightX').value);
            const backsightY = parseFloat(document.getElementById('backsightY').value);
            const leftDist = parseFloat(document.getElementById('leftDistance').value);
            const rightDist = parseFloat(document.getElementById('rightDistance').value);
            
            const curveService = new CurveDesignService();
            
            // 计算后视方位角
            const backsightAzimuth = curveService.calculateAzimuth(stationX, stationY, backsightX, backsightY);
            
            // 生成放样表格HTML
            const layoutHtml = this.generateLayoutTableHtml(stationX, stationY, backsightAzimuth, leftDist, rightDist, curveService);
            
            // 更新显示
            const container = document.getElementById('layoutTableContainer');
            if (container) {
                container.innerHTML = layoutHtml;
            }
            
            // 更新当前设站信息
            this.updateCurrentLayoutInfo(stationX, stationY, backsightX, backsightY);
            
            this.showNotification('放样表生成完成', 'success');
            
        } catch (error) {
            console.error('生成放样表时出错:', error);
            this.showNotification('生成放样表时出错: ' + error.message, 'error');
        }
    }
    
    // 生成放样表格HTML
    generateLayoutTableHtml(stationX, stationY, backsightAzimuth, leftDist, rightDist, curveService) {
        const { T, L, E, alpha, R, Ls } = this.calculatedElements.elements;
        const alphaDms = this.decimalToDms(Math.abs(alpha) * 180 / Math.PI);
        
        let html = `
            <div class="layout-table-wrapper">
                <h1>对称基本型曲线极坐标法放样</h1>
                
                <table class="layout-table">
                    <thead>
                        <tr>
                            <th rowspan="2">点名</th>
                            <th rowspan="2">桩号</th>
                            <th colspan="2" class="coordinate-header">设计坐标</th>
                            <th rowspan="2">切线方位<br>(d.mmss)</th>
                            <th colspan="3" class="layout-data-header">放样数据</th>
                        </tr>
                        <tr>
                            <th>X(m)</th>
                            <th>Y(m)</th>
                            <th>方位角(d.mmss)</th>
                            <th>角度(d.mmss)</th>
                            <th>距离(m)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // 为每个桩号生成放样数据（包括中桩和边桩）
        this.stationData.forEach(data => {
            // 计算极坐标放样元素
            const layoutData = curveService.calculatePolarLayoutElements(
                { x: data.x, y: data.y }, 
                { x: stationX, y: stationY }, 
                backsightAzimuth
            );
            
            // 计算边桩坐标和放样数据
            const leftCoords = curveService.calculateSideStakeCoordinates(
                { x: data.x, y: data.y, azimuth: data.azimuth }, 
                leftDist, 
                true
            );
            const rightCoords = curveService.calculateSideStakeCoordinates(
                { x: data.x, y: data.y, azimuth: data.azimuth }, 
                rightDist, 
                false
            );
            
            const leftLayoutData = curveService.calculatePolarLayoutElements(
                leftCoords, 
                { x: stationX, y: stationY }, 
                backsightAzimuth
            );
            const rightLayoutData = curveService.calculatePolarLayoutElements(
                rightCoords, 
                { x: stationX, y: stationY }, 
                backsightAzimuth
            );
            
            const azimuthDms = this.decimalToDms(data.azimuth * 180 / Math.PI);
            const rowClass = data.remark === '查找点' ? 'highlight-row' : '';
            
            html += `
                <!-- ${data.pointName}点 -->
                <tr class="${rowClass}">
                    <td rowspan="3" class="point-name">${data.pointName}</td>
                    <td class="station">${this.formatStation(data.station)}</td>
                    <td class="coordinate">${data.x.toFixed(3)}</td>
                    <td class="coordinate">${data.y.toFixed(3)}</td>
                    <td rowspan="3">${azimuthDms}</td>
                    <td>${curveService.radiansToDms(layoutData.azimuth)}</td>
                    <td>${curveService.radiansToDms(layoutData.horizontalAngle)}</td>
                    <td class="distance">${layoutData.distance.toFixed(3)}</td>
                </tr>
                <tr class="${rowClass}">
                    <td class="station">左${leftDist.toFixed(3)}m</td>
                    <td colspan="2"></td>
                    <td>${curveService.radiansToDms(leftLayoutData.azimuth)}</td>
                    <td>${curveService.radiansToDms(leftLayoutData.horizontalAngle)}</td>
                    <td class="distance">${leftLayoutData.distance.toFixed(3)}</td>
                </tr>
                <tr class="${rowClass}">
                    <td class="station">右${rightDist.toFixed(3)}m</td>
                    <td colspan="2"></td>
                    <td>${curveService.radiansToDms(rightLayoutData.azimuth)}</td>
                    <td>${curveService.radiansToDms(rightLayoutData.horizontalAngle)}</td>
                    <td class="distance">${rightLayoutData.distance.toFixed(3)}</td>
                </tr>
            `;
        });
        
        // 添加备注行
        html += `
                <!-- 备注行 -->
                <tr class="remarks">
                    <td colspan="8">
                        <strong>备注:</strong><br>
                        α = ${alphaDms} &nbsp;&nbsp;&nbsp; Ls = ${Ls.toFixed(4)} &nbsp;&nbsp;&nbsp; R = ${R.toFixed(4)} &nbsp;&nbsp;&nbsp; T = ${T.toFixed(4)} &nbsp;&nbsp;&nbsp;L = ${L.toFixed(4)} &nbsp;&nbsp;&nbsp; E = ${E.toFixed(4)}
                    </td>
                </tr>
            </tbody>
        </table>
        </div>
        `;
        
        return html;
    }
    
    // 这些方法现在由后端服务处理
    
    // 更新当前放样信息
    updateCurrentLayoutInfo(stationX, stationY, backsightX, backsightY) {
        const currentStationEl = document.getElementById('currentStation');
        const currentBacksightEl = document.getElementById('currentBacksight');
        
        if (currentStationEl) {
            currentStationEl.textContent = `(${stationX.toFixed(3)}, ${stationY.toFixed(3)})`;
        }
        
        if (currentBacksightEl) {
            currentBacksightEl.textContent = `(${backsightX.toFixed(3)}, ${backsightY.toFixed(3)})`;
        }
    }
    
    // 更新设站坐标
    updateStationCoordinates(pointName) {
        if (!pointName || !this.mainPoints || !this.mainPoints[pointName]) return;
        
        const coords = this.mainPoints[pointName].coordinates;
        if (coords) {
            document.getElementById('stationX').value = coords.x.toFixed(3);
            document.getElementById('stationY').value = coords.y.toFixed(3);
        }
    }
    
    // 更新后视点坐标
    updateBacksightCoordinates(pointName) {
        if (!pointName || !this.mainPoints || !this.mainPoints[pointName]) return;
        
        const coords = this.mainPoints[pointName].coordinates;
        if (coords) {
            document.getElementById('backsightX').value = coords.x.toFixed(3);
            document.getElementById('backsightY').value = coords.y.toFixed(3);
        }
    }
    
    /**
     * 导入参数
     */
    importParameters() {
        this.showNotification('导入参数功能开发中...', 'info');
    }
    
    /**
     * 显示设置
     */
    showSettings() {
        this.showNotification('计算方案设置功能开发中...', 'info');
    }
    
    /**
     * 检查数值是否有效
     */
    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
    
    /**
     * 测试曲线计算修复效果
     */
    testCurveFix() {
        console.log('🧪 开始测试曲线计算修复效果...');
        this.showNotification('开始测试曲线计算修复效果...', 'info');
        
        try {
            // 使用当前输入的参数
            const params = this.getCurrentParameters();
            console.log('📋 当前参数:', params);
            
            // 验证参数
            const validationResult = this.validateParameters();
            if (!validationResult.success) {
                console.error('❌ 参数验证失败:', validationResult.error);
                this.showNotification(`参数验证失败: ${validationResult.error}`, 'error');
                return;
            }
            
            // 测试曲线要素计算
            const curveService = new CurveDesignService();
            console.log('🔢 开始计算曲线要素...');
            const elementsResult = curveService.calculateCurveElements(params);
            console.log('📊 曲线要素计算结果:', elementsResult);
            
            if (!elementsResult.success) {
                console.error('❌ 曲线要素计算失败:', elementsResult.error);
                this.showNotification(`曲线要素计算失败: ${elementsResult.error}`, 'error');
                return;
            }
            
            // 测试主点坐标计算
            console.log('📍 开始计算主点坐标...');
            const mainPointsResult = curveService.calculateMainPointCoordinates(elementsResult, params);
            console.log('📍 主点坐标计算结果:', mainPointsResult);
            
            if (!mainPointsResult.success) {
                console.error('❌ 主点坐标计算失败:', mainPointsResult.error);
                this.showNotification(`主点坐标计算失败: ${mainPointsResult.error}`, 'error');
                return;
            }
            
            // 测试结果显示
            console.log('✅ 测试通过！所有计算正常完成');
            this.showNotification('🎉 测试通过！曲线计算修复成功', 'success');
            
            // 自动更新显示
            this.updateElementsDisplay(elementsResult);
            this.updateMainPointsTable(mainPointsResult);
            
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
            this.showNotification(`测试过程中发生错误: ${error.message}`, 'error');
        }
    }
    
    /**
     * 获取当前参数
     */
    getCurrentParameters() {
        return {
            deflectionAngle: this.dmsToDecimal(document.getElementById('deflectionAngle').value) * Math.PI / 180,
            radius: parseFloat(document.getElementById('radius').value),
            transitionLength: parseFloat(document.getElementById('transitionLength').value),
            intersectionX: parseFloat(document.getElementById('intersectionX').value),
            intersectionY: parseFloat(document.getElementById('intersectionY').value),
            startAzimuth: this.dmsToDecimal(document.getElementById('startAzimuth').value) * Math.PI / 180,
            deflectionDirection: parseInt(document.getElementById('deflectionDirection').value),
            intersectionStation: document.getElementById('intersectionStation').value
        };
    }
    
    // 显示通知
    showNotification(message, type = 'info') {
        // 使用现有的通知系统
        if (window.notificationSystem) {
            window.notificationSystem.show(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * 显示导出对话框
     */
    showExportDialog() {
        // 检查是否有计算结果
        if (!this.calculatedElements || !this.mainPoints) {
            this.showNotification('请先计算综合要素', 'warning');
            return;
        }

        // 创建导出模态框（如果不存在）
        this.createExportModal();

        // 设置默认文件名
        const projectName = document.getElementById('projectName')?.value || '曲线测设';
        const date = new Date().toLocaleDateString().replace(/\//g, '-');
        document.getElementById('curveExportFileName').value = `${projectName}_${date}`;

        // 显示模态框
        document.getElementById('curveExportModal').style.display = 'block';
    }

    /**
     * 创建导出模态框
     */
    createExportModal() {
        // 检查是否已存在导出模态框
        if (document.getElementById('curveExportModal')) {
            return;
        }

        const modalHTML = `
            <div class="modal" id="curveExportModal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>曲线测设成果导出</h3>
                        <span class="close" onclick="closeModal('curveExportModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="export-section">
                            <h4><i class="fas fa-file-alt"></i> 导出格式</h4>
                            <div class="format-grid">
                                <label class="format-option">
                                    <input type="radio" name="curveExportFormat" value="txt" checked>
                                    <span class="format-label">
                                        <i class="fas fa-file-text"></i>
                                        <strong>TXT报告</strong>
                                        <small>精美文本报告</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="curveExportFormat" value="dat">
                                    <span class="format-label">
                                        <i class="fas fa-database"></i>
                                        <strong>DAT数据</strong>
                                        <small>测量数据格式</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="curveExportFormat" value="csv">
                                    <span class="format-label">
                                        <i class="fas fa-table"></i>
                                        <strong>CSV表格</strong>
                                        <small>逗号分隔值</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="curveExportFormat" value="excel">
                                    <span class="format-label">
                                        <i class="fas fa-file-excel"></i>
                                        <strong>Excel表格</strong>
                                        <small>Microsoft Excel</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="curveExportFormat" value="word">
                                    <span class="format-label">
                                        <i class="fas fa-file-word"></i>
                                        <strong>Word文档</strong>
                                        <small>Microsoft Word</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="curveExportFormat" value="dxf">
                                    <span class="format-label">
                                        <i class="fas fa-drafting-compass"></i>
                                        <strong>DXF图形</strong>
                                        <small>AutoCAD交换格式</small>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4><i class="fas fa-list"></i> 导出内容</h4>
                            <div class="content-options">
                                <label><input type="checkbox" id="includeBasicParams" checked> 基本参数</label>
                                <label><input type="checkbox" id="includeCurveElements" checked> 曲线要素</label>
                                <label><input type="checkbox" id="includeMainPoints" checked> 主点坐标</label>
                                <label><input type="checkbox" id="includeStationData" checked> 中桩坐标</label>
                                <label><input type="checkbox" id="includeLayoutData" checked> 放样数据</label>
                                <label><input type="checkbox" id="includeCalculationProcess"> 计算过程</label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4><i class="fas fa-cog"></i> 文件设置</h4>
                            <div class="file-settings">
                                <div class="param-row">
                                    <label>文件名:</label>
                                    <input type="text" id="curveExportFileName" placeholder="曲线测设成果" style="width: 300px;">
                                </div>
                                <div class="param-row">
                                    <label><input type="checkbox" id="curveIncludeTimestamp" checked> 包含时间戳</label>
                                </div>
                                <div class="param-row">
                                    <label>小数位数:</label>
                                    <select id="curveDecimalPlaces">
                                        <option value="2">2位</option>
                                        <option value="3" selected>3位</option>
                                        <option value="4">4位</option>
                                        <option value="5">5位</option>
                                    </select>
                                </div>
                                <div class="param-row">
                                    <label>坐标系统:</label>
                                    <input type="text" id="curveCoordinateSystem" placeholder="如：2000国家大地坐标系" style="width: 200px;">
                                </div>
                                <div class="param-row">
                                    <label>投影带:</label>
                                    <input type="text" id="curveProjectionZone" placeholder="如：中央子午线114°" style="width: 150px;">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="tool-btn" onclick="closeModal('curveExportModal')">取消</button>
                        <button class="tool-btn primary" onclick="window.curveDesign.performExport()">导出</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * 执行导出
     */
    performExport() {
        try {
            // 获取导出设置
            const format = document.querySelector('input[name="curveExportFormat"]:checked').value;
            const fileName = document.getElementById('curveExportFileName').value || '曲线测设成果';
            const includeTimestamp = document.getElementById('curveIncludeTimestamp').checked;
            const decimalPlaces = parseInt(document.getElementById('curveDecimalPlaces').value);
            const coordinateSystem = document.getElementById('curveCoordinateSystem').value || '';
            const projectionZone = document.getElementById('curveProjectionZone').value || '';

            // 获取导出内容选项
            const contentOptions = {
                basicParams: document.getElementById('includeBasicParams').checked,
                curveElements: document.getElementById('includeCurveElements').checked,
                mainPoints: document.getElementById('includeMainPoints').checked,
                stationData: document.getElementById('includeStationData').checked,
                layoutData: document.getElementById('includeLayoutData').checked,
                calculationProcess: document.getElementById('includeCalculationProcess').checked
            };

            // 生成最终文件名
            let finalFileName = fileName;
            if (includeTimestamp) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                finalFileName += `_${timestamp}`;
            }

            // 准备导出数据
            const exportData = this.prepareExportData(contentOptions, {
                decimalPlaces,
                coordinateSystem,
                projectionZone
            });

            // 根据格式执行导出
            let content, fileExtension, mimeType;
            switch (format) {
                case 'txt':
                    content = this.generateCurveTXT(exportData);
                    fileExtension = 'txt';
                    mimeType = 'text/plain;charset=utf-8';
                    break;
                case 'dat':
                    content = this.generateCurveDAT(exportData);
                    fileExtension = 'dat';
                    mimeType = 'text/plain;charset=utf-8';
                    break;
                case 'csv':
                    content = this.generateCurveCSV(exportData);
                    fileExtension = 'csv';
                    mimeType = 'text/csv;charset=utf-8';
                    break;
                case 'excel':
                    content = this.generateCurveExcel(exportData);
                    fileExtension = 'csv'; // 暂时使用CSV格式
                    mimeType = 'text/csv;charset=utf-8';
                    break;
                case 'word':
                    content = this.generateCurveWord(exportData);
                    fileExtension = 'html';
                    mimeType = 'text/html;charset=utf-8';
                    break;
                case 'dxf':
                    const dxfService = new DxfExportService();
                    const newExportData = {
                        curvePoints: exportData.stationData.map(p => p.center),
                        mainPoints: exportData.mainPoints
                    };
                    const options = {
                        projectName: exportData.projectInfo.projectName,
                        textHeight: 2.5,
                        pointSize: 1.0
                    };
                    const dxfResult = dxfService.exportSymmetricBasicCurveDxf(newExportData, options);
                    
                    if (!dxfResult.success) {
                        throw new Error(dxfResult.error);
                    }
                    
                    content = dxfResult.content;
                    fileExtension = 'dxf';
                    mimeType = 'text/plain;charset=utf-8';
                    break;
                default:
                    throw new Error('不支持的导出格式');
            }

            // 下载文件
            this.downloadFile(content, `${finalFileName}.${fileExtension}`, mimeType);

            // 关闭模态框
            closeModal('curveExportModal');
            this.showNotification(`成功导出为 ${format.toUpperCase()} 格式`, 'success');

        } catch (error) {
            console.error('导出失败:', error);
            this.showNotification('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 准备导出数据
     */
    prepareExportData(contentOptions, settings) {
        const data = {
            projectInfo: {},
            basicParams: {},
            curveElements: {},
            mainPoints: [],
            stationData: [],
            layoutData: [],
            calculationProcess: '',
            settings: settings,
            timestamp: new Date().toLocaleString()
        };

        // 项目信息
        const projectNameEl = document.getElementById('projectName');
        data.projectInfo = {
            projectName: projectNameEl?.value || '曲线测设工程',
            functionName: '对称基本型曲线测设',
            exportTime: data.timestamp,
            coordinateSystem: settings.coordinateSystem || '未指定',
            projectionZone: settings.projectZone || '未指定'
        };

        // 基本参数
        if (contentOptions.basicParams) {
            data.basicParams = {
                intersectionStation: document.getElementById('intersectionStation').value,
                deflectionAngle: document.getElementById('deflectionAngle').value,
                deflectionDirection: document.getElementById('deflectionDirection').value,
                radius: parseFloat(document.getElementById('radius').value),
                transitionLength: parseFloat(document.getElementById('transitionLength').value),
                intersectionX: parseFloat(document.getElementById('intersectionX').value),
                intersectionY: parseFloat(document.getElementById('intersectionY').value),
                startAzimuth: document.getElementById('startAzimuth').value,
                orientationX: parseFloat(document.getElementById('orientationX').value),
                orientationY: parseFloat(document.getElementById('orientationY').value),
                stationInterval: parseFloat(document.getElementById('stationInterval').value),
                leftDistance: parseFloat(document.getElementById('leftDistance').value),
                rightDistance: parseFloat(document.getElementById('rightDistance').value)
            };
        }

        // 曲线要素
        if (contentOptions.curveElements && this.calculatedElements) {
            data.curveElements = {
                elements: this.calculatedElements.elements,
                T: this.calculatedElements.elements.T,
                L: this.calculatedElements.elements.L,
                Ly: this.calculatedElements.elements.Ly,
                E: this.calculatedElements.elements.E,
                D: this.calculatedElements.elements.D,
                beta0: this.calculatedElements.elements.beta0 * 180 / Math.PI,
                p: this.calculatedElements.elements.p,
                q: this.calculatedElements.elements.q
            };
        }

        // 主点坐标
        if (contentOptions.mainPoints && this.mainPoints) {
            data.mainPoints = Object.values(this.mainPoints).map(point => ({
                name: point.name,
                station: point.station,
                x: point.coordinates?.x,
                y: point.coordinates?.y,
                azimuth: point.coordinates?.azimuth * 180 / Math.PI
            }));
        }

        // 中桩坐标数据
        if (contentOptions.stationData && this.stationData) {
            data.stationData = this.stationData.map(data => ({
                index: data.index,
                pointName: data.pointName,
                station: data.station,
                x: data.x,
                y: data.y,
                azimuth: data.azimuth * 180 / Math.PI,
                segment: data.segment,
                remark: data.remark
            }));
        }

        // 放样数据
        if (contentOptions.layoutData && this.layoutData) {
            data.layoutData = this.layoutData;
        }

        return data;
    }

    /**
     * 生成TXT格式报告
     */
    generateCurveTXT(data) {
        const dp = data.settings.decimalPlaces;
        const curveService = new CurveDesignService();
        let content = '';

        // 标题
        content += '曲线测设成果报告\n';
        content += '='.repeat(60) + '\n\n';

        // 项目信息
        content += '【项目信息】\n';
        content += `项目名称: ${data.projectInfo.projectName}\n`;
        content += `计算功能: ${data.projectInfo.functionName}\n`;
        content += `坐标系统: ${data.projectInfo.coordinateSystem}\n`;
        content += `投影带: ${data.projectInfo.projectionZone}\n`;
        content += `导出时间: ${data.projectInfo.exportTime}\n\n`;

        // 基本参数
        if (data.basicParams && Object.keys(data.basicParams).length > 0) {
            content += '【基本参数】\n';
            content += `交点桩号: ${data.basicParams.intersectionStation}\n`;
            content += `偏角: ${curveService.radiansToDms(data.basicParams.deflectionAngle)} d.mmss\n`;
            content += `偏转方向: ${data.basicParams.deflectionDirection == 1 ? '右转' : '左转'}\n`;
            content += `圆曲线半径: ${data.basicParams.radius.toFixed(dp)} m\n`;
            content += `缓和曲线长: ${data.basicParams.transitionLength.toFixed(dp)} m\n`;
            content += `交点坐标: X=${data.basicParams.intersectionX.toFixed(dp)}, Y=${data.basicParams.intersectionY.toFixed(dp)}\n`;
            content += `起点方位角: ${curveService.radiansToDms(data.basicParams.startAzimuth)} d.mmss\n\n`;
        }

        // 曲线要素
        if (data.curveElements && Object.keys(data.curveElements).length > 0) {
            content += '【曲线要素】\n';
            content += `切线长 T: ${data.curveElements.T.toFixed(dp)} m\n`;
            content += `总曲线长 L: ${data.curveElements.L.toFixed(dp)} m\n`;
            content += `圆曲线长 Ly: ${data.curveElements.Ly.toFixed(dp)} m\n`;
            content += `外矢距 E: ${data.curveElements.E.toFixed(dp)} m\n`;
            content += `切曲差 D: ${data.curveElements.D.toFixed(dp)} m\n`;
            content += `缓和曲线总偏角 β₀: ${curveService.radiansToDms(data.curveElements.beta0)} d.mmss\n`;
            content += `内移值 p: ${data.curveElements.p.toFixed(dp)} m\n`;
            content += `切线增量 q: ${data.curveElements.q.toFixed(dp)} m\n\n`;
        }

        // 主点坐标
        if (data.mainPoints && data.mainPoints.length > 0) {
            content += '【主点坐标】\n';
            content += `点名\t\t桩号\t\t\tX坐标(m)\t\tY坐标(m)\t\t切线方位(d.mmss)\n`;
            content += '-'.repeat(80) + '\n';
            
            data.mainPoints.forEach(point => {
                content += `${point.name}\t\t${this.formatStation(point.station)}\t\t${point.x.toFixed(dp)}\t\t${point.y.toFixed(dp)}\t\t${curveService.radiansToDms(point.azimuth)}\n`;
            });
            content += '\n';
        }

        // 中桩坐标
        if (data.stationData && data.stationData.length > 0) {
            content += '【中桩坐标成果】\n';
            content += `序号\t点名\t\t桩号\t\t\tX坐标(m)\t\tY坐标(m)\t\t切线方位(d.mmss)\t曲线段\t备注\n`;
            content += '-'.repeat(100) + '\n';
            
            data.stationData.forEach(station => {
                content += `${station.index}\t${station.pointName}\t\t${this.formatStation(station.station)}\t\t${station.x.toFixed(dp)}\t\t${station.y.toFixed(dp)}\t\t${curveService.radiansToDms(station.azimuth)}\t\t${station.segment}\t${station.remark}\n`;
            });
            content += '\n';
        }

        // 放样数据
        if (data.layoutData && data.layoutData.length > 0) {
            content += '【对称基本型曲线坐标成果与放样表】\n';
            content += `序号\t点名\t\t桩号\t\t\tX坐标(m)\t\tY坐标(m)\t\t切线方位(d.mmss)\t中桩方位角(d.mmss)\t中桩角度(d.mmss)\t中桩距离(m)\t左距(m)\t左桩方位角(d.mmss)\t左桩角度(d.mmss)\t左桩距离(m)\t右距(m)\t右桩方位角(d.mmss)\t右桩角度(d.mmss)\t右桩距离(m)\t备注\n`;
            content += '-'.repeat(180) + '\n';
            
            data.layoutData.forEach(layout => {
                content += `${layout.index}\t${layout.pointName}\t\t${this.formatStation(layout.station)}\t\t${layout.x.toFixed(dp)}\t\t${layout.y.toFixed(dp)}\t\t${layout.azimuthFormatted}\t`;
                content += `${layout.centerLayoutFormatted.azimuth}\t${layout.centerLayoutFormatted.angle}\t${layout.centerLayoutFormatted.distance}\t`;
                content += `${layout.leftDistance?.toFixed(dp) || ''}\t${layout.leftLayoutFormatted.azimuth}\t${layout.leftLayoutFormatted.angle}\t${layout.leftLayoutFormatted.distance}\t`;
                content += `${layout.rightDistance?.toFixed(dp) || ''}\t${layout.rightLayoutFormatted.azimuth}\t${layout.rightLayoutFormatted.angle}\t${layout.rightLayoutFormatted.distance}\t`;
                content += `${layout.remark || ''}\n`;
            });
        }

        return content;
    }

    /**
     * 生成DAT格式数据
     */
    generateCurveDAT(data) {
        const dp = data.settings.decimalPlaces;
        const curveService = new CurveDesignService();
        let content = '';

        // 标题注释
        content += '// 曲线测设成果数据\n';
        content += '// 导出时间: ' + data.projectInfo.exportTime + '\n';
        content += '// 项目名称: ' + data.projectInfo.projectName + '\n';
        content += '// 坐标系统: ' + data.projectInfo.coordinateSystem + '\n';
        content += '// 投影带: ' + data.projectInfo.projectionZone + '\n\n';

        // 基本参数注释
        if (data.basicParams && Object.keys(data.basicParams).length > 0) {
            content += '// 基本参数\n';
            content += '// 交点桩号: ' + data.basicParams.intersectionStation + '\n';
            content += '// 偏角: ' + curveService.radiansToDms(data.basicParams.deflectionAngle) + ' d.mmss\n';
            content += '// 圆曲线半径: ' + data.basicParams.radius.toFixed(dp) + ' m\n';
            content += '// 缓和曲线长: ' + data.basicParams.transitionLength.toFixed(dp) + ' m\n\n';
        }

        // 曲线要素注释
        if (data.curveElements && Object.keys(data.curveElements).length > 0) {
            content += '// 曲线要素\n';
            content += '// 切线长 T: ' + data.curveElements.T.toFixed(dp) + ' m\n';
            content += '// 总曲线长 L: ' + data.curveElements.L.toFixed(dp) + ' m\n';
            content += '// 外矢距 E: ' + data.curveElements.E.toFixed(dp) + ' m\n\n';
        }

        // 数据头
        content += '// 点名, 桩号, X坐标, Y坐标, 切线方位角, 曲线段, 备注\n';

        // 主点坐标数据
        if (data.mainPoints && data.mainPoints.length > 0) {
            data.mainPoints.forEach(point => {
                content += `${point.name}, ${this.formatStation(point.station)}, ${point.x.toFixed(dp)}, ${point.y.toFixed(dp)}, ${curveService.radiansToDms(point.azimuth)}, ${point.segment || '主点'}, ${point.remark || ''}\n`;
            });
        }

        // 中桩坐标数据
        if (data.stationData && data.stationData.length > 0) {
            data.stationData.forEach(station => {
                content += `${station.pointName}, ${this.formatStation(station.station)}, ${station.x.toFixed(dp)}, ${station.y.toFixed(dp)}, ${curveService.radiansToDms(station.azimuth)}, ${station.segment}, ${station.remark}\n`;
            });
            content += '\n';
        }

        // 放样数据
        if (data.layoutData && data.layoutData.length > 0) {
            content += '// 对称基本型曲线坐标成果与放样表\n';
            content += '// 序号, 点名, 桩号, X坐标(m), Y坐标(m), 切线方位(d.mmss), 中桩方位角(d.mmss), 中桩角度(d.mmss), 中桩距离(m), 左距(m), 左桩方位角(d.mmss), 左桩角度(d.mmss), 左桩距离(m), 右距(m), 右桩方位角(d.mmss), 右桩角度(d.mmss), 右桩距离(m), 备注\n';
            
            data.layoutData.forEach(layout => {
                content += `${layout.index}, ${layout.pointName}, ${this.formatStation(layout.station)}, ${layout.x.toFixed(dp)}, ${layout.y.toFixed(dp)}, ${layout.azimuthFormatted}, `;
                content += `${layout.centerLayoutFormatted.azimuth}, ${layout.centerLayoutFormatted.angle}, ${layout.centerLayoutFormatted.distance}, `;
                content += `${layout.leftDistance?.toFixed(dp) || ''}, ${layout.leftLayoutFormatted.azimuth}, ${layout.leftLayoutFormatted.angle}, ${layout.leftLayoutFormatted.distance}, `;
                content += `${layout.rightDistance?.toFixed(dp) || ''}, ${layout.rightLayoutFormatted.azimuth}, ${layout.rightLayoutFormatted.angle}, ${layout.rightLayoutFormatted.distance}, `;
                content += `${layout.remark || ''}\n`;
            });
        }

        return content;
    }

    /**
     * 生成CSV格式表格
     */
    generateCurveCSV(data) {
        const dp = data.settings.decimalPlaces;
        const curveService = new CurveDesignService();
        let content = '';

        // 项目信息
        content += '项目信息\n';
        content += `项目名称,${data.projectInfo.projectName}\n`;
        content += `计算功能,${data.projectInfo.functionName}\n`;
        content += `坐标系统,${data.projectInfo.coordinateSystem}\n`;
        content += `投影带,${data.projectInfo.projectionZone}\n`;
        content += `导出时间,${data.projectInfo.exportTime}\n\n`;

        // 基本参数
        if (data.basicParams && Object.keys(data.basicParams).length > 0) {
            content += '基本参数\n';
            content += '参数名称,参数值,单位\n';
            content += `交点桩号,${data.basicParams.intersectionStation},\n`;
            content += `偏角,${curveService.radiansToDms(data.basicParams.deflectionAngle)},d.mmss\n`;
            content += `偏转方向,${data.basicParams.deflectionDirection == 1 ? '右转' : '左转'},\n`;
            content += `圆曲线半径,${data.basicParams.radius.toFixed(dp)},m\n`;
            content += `缓和曲线长,${data.basicParams.transitionLength.toFixed(dp)},m\n`;
            content += `交点X坐标,${data.basicParams.intersectionX.toFixed(dp)},m\n`;
            content += `交点Y坐标,${data.basicParams.intersectionY.toFixed(dp)},m\n`;
            content += `起点方位角,${curveService.radiansToDms(data.basicParams.startAzimuth)},d.mmss\n\n`;
        }

        // 曲线要素
        if (data.curveElements && Object.keys(data.curveElements).length > 0) {
            content += '曲线要素\n';
            content += '参数名称,参数值,单位\n';
            content += `切线长 T,${data.curveElements.T.toFixed(dp)},m\n`;
            content += `总曲线长 L,${data.curveElements.L.toFixed(dp)},m\n`;
            content += `圆曲线长 Ly,${data.curveElements.Ly.toFixed(dp)},m\n`;
            content += `外矢距 E,${data.curveElements.E.toFixed(dp)},m\n`;
            content += `切曲差 D,${data.curveElements.D.toFixed(dp)},m\n`;
            content += `缓和曲线总偏角 β₀,${curveService.radiansToDms(data.curveElements.beta0)},d.mmss\n`;
            content += `内移值 p,${data.curveElements.p.toFixed(dp)},m\n`;
            content += `切线增量 q,${data.curveElements.q.toFixed(dp)},m\n\n`;
        }

        // 主点坐标
        if (data.mainPoints && data.mainPoints.length > 0) {
            content += '主点坐标\n';
            content += '点名,桩号,X坐标(m),Y坐标(m),切线方位(d.mmss),曲线段,备注\n';
            data.mainPoints.forEach(point => {
                content += `${point.name},${this.formatStation(point.station)},${point.x.toFixed(dp)},${point.y.toFixed(dp)},${curveService.radiansToDms(point.azimuth)},${point.segment || '主点'},${point.remark || ''}\n`;
            });
            content += '\n';
        }

        // 中桩坐标
        if (data.stationData && data.stationData.length > 0) {
            content += '中桩坐标成果\n';
            content += '序号,点名,桩号,X坐标(m),Y坐标(m),切线方位(d.mmss),曲线段,备注\n';
            data.stationData.forEach(station => {
                content += `${station.index},${station.pointName},${this.formatStation(station.station)},${station.x.toFixed(dp)},${station.y.toFixed(dp)},${curveService.radiansToDms(station.azimuth)},${station.segment},${station.remark}\n`;
            });
            content += '\n';
        }

        // 放样数据
        if (data.layoutData && data.layoutData.length > 0) {
            content += '对称基本型曲线坐标成果与放样表\n';
            content += '序号,点名,桩号,X坐标(m),Y坐标(m),切线方位(d.mmss),中桩方位角(d.mmss),中桩角度(d.mmss),中桩距离(m),左距(m),左桩方位角(d.mmss),左桩角度(d.mmss),左桩距离(m),右距(m),右桩方位角(d.mmss),右桩角度(d.mmss),右桩距离(m),备注\n';
            
            data.layoutData.forEach(layout => {
                content += `${layout.index},${layout.pointName},${this.formatStation(layout.station)},${layout.x.toFixed(dp)},${layout.y.toFixed(dp)},${layout.azimuthFormatted},`;
                content += `${layout.centerLayoutFormatted.azimuth},${layout.centerLayoutFormatted.angle},${layout.centerLayoutFormatted.distance},`;
                content += `${layout.leftDistance?.toFixed(dp) || ''},${layout.leftLayoutFormatted.azimuth},${layout.leftLayoutFormatted.angle},${layout.leftLayoutFormatted.distance},`;
                content += `${layout.rightDistance?.toFixed(dp) || ''},${layout.rightLayoutFormatted.azimuth},${layout.rightLayoutFormatted.angle},${layout.rightLayoutFormatted.distance},`;
                content += `${layout.remark || ''}\n`;
            });
        }

        return content;
    }

    /**
     * 生成Excel格式（简化版本）
     */
    generateCurveExcel(data) {
        // 这里返回CSV格式，实际使用时可以引入xlsx.js库来生成真正的Excel文件
        console.log('注意：当前生成的是CSV格式，如需真正的Excel格式，请引入xlsx.js库');
        return this.generateCurveCSV(data);
    }

    /**
     * 生成Word格式（HTML格式）
     */
    generateCurveWord(data) {
        const dp = data.settings.decimalPlaces;
        const curveService = new CurveDesignService();
        let content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${data.projectInfo.projectName} - 曲线测设成果报告</title>
    <style>
        body { font-family: "Microsoft YaHei", "SimSun", serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .header .info { font-size: 14px; color: #666; }
        .section { margin-bottom: 25px; }
        .section h2 { font-size: 18px; color: #333; border-bottom: 2px solid #007acc; padding-bottom: 5px; margin-bottom: 15px; }
        .section h3 { font-size: 16px; color: #555; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .param-row { display: flex; margin: 5px 0; }
        .param-label { width: 120px; font-weight: bold; }
        .param-value { flex: 1; }
        .footer { margin-top: 40px; text-align: right; font-size: 12px; color: #666; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.projectInfo.projectName}</h1>
        <div class="info">${data.projectInfo.functionName}成果报告</div>
        <div class="info">导出时间：${data.projectInfo.exportTime}</div>
    </div>
        `;

        // 基本参数
        if (data.basicParams && Object.keys(data.basicParams).length > 0) {
            content += `
    <div class="section">
        <h2>一、基本参数</h2>
        <div class="param-row">
            <div class="param-label">交点桩号：</div>
            <div class="param-value">${data.basicParams.intersectionStation}</div>
        </div>
        <div class="param-row">
            <div class="param-label">偏角：</div>
            <div class="param-value">${curveService.radiansToDms(data.basicParams.deflectionAngle)} d.mmss</div>
        </div>
        <div class="param-row">
            <div class="param-label">偏转方向：</div>
            <div class="param-value">${data.basicParams.deflectionDirection == 1 ? '右转' : '左转'}</div>
        </div>
        <div class="param-row">
            <div class="param-label">圆曲线半径：</div>
            <div class="param-value">${data.basicParams.radius.toFixed(dp)} m</div>
        </div>
        <div class="param-row">
            <div class="param-label">缓和曲线长：</div>
            <div class="param-value">${data.basicParams.transitionLength.toFixed(dp)} m</div>
        </div>
        <div class="param-row">
            <div class="param-label">交点坐标：</div>
            <div class="param-value">X = ${data.basicParams.intersectionX.toFixed(dp)} m，Y = ${data.basicParams.intersectionY.toFixed(dp)} m</div>
        </div>
        <div class="param-row">
            <div class="param-label">起点方位角：</div>
            <div class="param-value">${curveService.radiansToDms(data.basicParams.startAzimuth)} d.mmss</div>
        </div>
    </div>
            `;
        }

        // 曲线要素
        if (data.curveElements && Object.keys(data.curveElements).length > 0) {
            content += `
    <div class="section">
        <h2>二、曲线要素</h2>
        <table>
            <tr><th>参数名称</th><th>数值</th><th>单位</th></tr>
            <tr><td>切线长 T</td><td>${data.curveElements.T.toFixed(dp)}</td><td>m</td></tr>
            <tr><td>总曲线长 L</td><td>${data.curveElements.L.toFixed(dp)}</td><td>m</td></tr>
            <tr><td>圆曲线长 Ly</td><td>${data.curveElements.Ly.toFixed(dp)}</td><td>m</td></tr>
            <tr><td>外矢距 E</td><td>${data.curveElements.E.toFixed(dp)}</td><td>m</td></tr>
            <tr><td>切曲差 D</td><td>${data.curveElements.D.toFixed(dp)}</td><td>m</td></tr>
            <tr><td>缓和曲线总偏角 β₀</td><td>${curveService.radiansToDms(data.curveElements.beta0)}</td><td>d.mmss</td></tr>
            <tr><td>内移值 p</td><td>${data.curveElements.p.toFixed(dp)}</td><td>m</td></tr>
            <tr><td>切线增量 q</td><td>${data.curveElements.q.toFixed(dp)}</td><td>m</td></tr>
        </table>
    </div>
            `;
        }

        // 主点坐标
        if (data.mainPoints && data.mainPoints.length > 0) {
            content += `
    <div class="section">
        <h2>三、主点坐标</h2>
        <table>
            <tr><th>点名</th><th>桩号</th><th>X坐标(m)</th><th>Y坐标(m)</th><th>切线方位(d.mmss)</th></tr>
            `;
            data.mainPoints.forEach(point => {
                content += `<tr><td>${point.name}</td><td>${this.formatStation(point.station)}</td><td>${point.x.toFixed(dp)}</td><td>${point.y.toFixed(dp)}</td><td>${curveService.radiansToDms(point.azimuth)}</td></tr>`;
            });
            content += `
        </table>
    </div>
            `;
        }

        // 中桩坐标
        if (data.stationData && data.stationData.length > 0) {
            content += `
    <div class="section">
        <h2>四、中桩坐标成果</h2>
        <table>
            <tr><th>序号</th><th>点名</th><th>桩号</th><th>X坐标(m)</th><th>Y坐标(m)</th><th>切线方位(d.mmss)</th><th>曲线段</th><th>备注</th></tr>
            `;
            data.stationData.forEach(station => {
                content += `<tr><td>${station.index}</td><td>${station.pointName}</td><td>${this.formatStation(station.station)}</td><td>${station.x.toFixed(dp)}</td><td>${station.y.toFixed(dp)}</td><td>${curveService.radiansToDms(station.azimuth)}</td><td>${station.segment}</td><td>${station.remark}</td></tr>`;
            });
            content += `
        </table>
    </div>
            `;
        }

        // 放样数据
        if (data.layoutData && data.layoutData.length > 0) {
            content += `
    <div class="section">
        <h2>五、对称基本型曲线坐标成果与放样表</h2>
        <table>
            <tr>
                <th>序号</th>
                <th>点名</th>
                <th>桩号</th>
                <th>X坐标(m)</th>
                <th>Y坐标(m)</th>
                <th>切线方位(d.mmss)</th>
                <th>中桩方位角(d.mmss)</th>
                <th>中桩角度(d.mmss)</th>
                <th>中桩距离(m)</th>
                <th>左距(m)</th>
                <th>左桩方位角(d.mmss)</th>
                <th>左桩角度(d.mmss)</th>
                <th>左桩距离(m)</th>
                <th>右距(m)</th>
                <th>右桩方位角(d.mmss)</th>
                <th>右桩角度(d.mmss)</th>
                <th>右桩距离(m)</th>
                <th>备注</th>
            </tr>
            `;
            data.layoutData.forEach(layout => {
                content += `<tr>
                    <td>${layout.index}</td>
                    <td>${layout.pointName}</td>
                    <td>${this.formatStation(layout.station)}</td>
                    <td>${layout.x.toFixed(dp)}</td>
                    <td>${layout.y.toFixed(dp)}</td>
                    <td>${layout.azimuthFormatted}</td>
                    <td>${layout.centerLayoutFormatted.azimuth}</td>
                    <td>${layout.centerLayoutFormatted.angle}</td>
                    <td>${layout.centerLayoutFormatted.distance}</td>
                    <td>${layout.leftDistance?.toFixed(dp) || ''}</td>
                    <td>${layout.leftLayoutFormatted.azimuth}</td>
                    <td>${layout.leftLayoutFormatted.angle}</td>
                    <td>${layout.leftLayoutFormatted.distance}</td>
                    <td>${layout.rightDistance?.toFixed(dp) || ''}</td>
                    <td>${layout.rightLayoutFormatted.azimuth}</td>
                    <td>${layout.rightLayoutFormatted.angle}</td>
                    <td>${layout.rightLayoutFormatted.distance}</td>
                    <td>${layout.remark || ''}</td>
                </tr>`;
            });
            content += `
        </table>
    </div>
            `;
        }

        content += `
    <div class="footer">
        <p>坐标系统：${data.projectInfo.coordinateSystem}</p>
        <p>投影带：${data.projectInfo.projectionZone}</p>
        <p>导出时间：${data.projectInfo.exportTime}</p>
    </div>
</body>
</html>
        `;

        return content;
    }

    /**
     * 生成DXF格式（简化版本）
     */
    generateCurveDXF(data) {
        let content = '';

        // DXF文件头
        content += '0\nSECTION\n2\nHEADER\n';
        content += '9\n$ACADVER\n1\nAC1015\n';
        content += '9\n$INSUNITS\n70\n1\n'; // 毫米单位
        content += '0\nENDSEC\n';

        // 图层定义
        content += '0\nSECTION\n2\nTABLES\n';
        content += '0\nTABLE\n2\nLAYER\n70\n1\n';
        content += '0\nLAYER\n2\n主点\n70\n0\n62\n1\n6\nCONTINUOUS\n'; // 红色
        content += '0\nLAYER\n2\n中桩\n70\n0\n62\n3\n6\nCONTINUOUS\n'; // 绿色
        content += '0\nLAYER\n2\n左桩\n70\n0\n62\n5\n6\nCONTINUOUS\n'; // 蓝色
        content += '0\nLAYER\n2\n右桩\n70\n0\n62\n6\n6\nCONTINUOUS\n'; // 洋红色
        content += '0\nENDTAB\n0\nENDSEC\n';

        // 实体段
        content += '0\nSECTION\n2\nENTITIES\n';

        // 主点点位
        if (data.mainPoints && data.mainPoints.length > 0) {
            data.mainPoints.forEach(point => {
                content += '0\nPOINT\n8\n主点\n';
                content += `10\n${(point.x * 1000).toFixed(3)}\n`; // 转换为毫米
                content += `20\n${(point.y * 1000).toFixed(3)}\n`;
                content += '30\n0.0\n';
                content += `1\n${point.name}\n`;
            });
        }

        // 中桩点位
        if (data.stationData && data.stationData.length > 0) {
            data.stationData.forEach(station => {
                content += '0\nPOINT\n8\n中桩\n';
                content += `10\n${(station.x * 1000).toFixed(3)}\n`;
                content += `20\n${(station.y * 1000).toFixed(3)}\n`;
                content += '30\n0.0\n';
                content += `1\n${station.pointName}\n`;
            });
        }

        // 放样点位（左桩和右桩）
        if (data.layoutData && data.layoutData.length > 0) {
            data.layoutData.forEach(layout => {
                // 左桩点位
                if (layout.leftLayout && layout.leftLayout.x !== undefined && layout.leftLayout.y !== undefined) {
                    content += '0\nPOINT\n8\n左桩\n';
                    content += `10\n${(layout.leftLayout.x * 1000).toFixed(3)}\n`;
                    content += `20\n${(layout.leftLayout.y * 1000).toFixed(3)}\n`;
                    content += '30\n0.0\n';
                    content += `1\n${layout.pointName}_L\n`;
                }
                
                // 右桩点位
                if (layout.rightLayout && layout.rightLayout.x !== undefined && layout.rightLayout.y !== undefined) {
                    content += '0\nPOINT\n8\n右桩\n';
                    content += `10\n${(layout.rightLayout.x * 1000).toFixed(3)}\n`;
                    content += `20\n${(layout.rightLayout.y * 1000).toFixed(3)}\n`;
                    content += '30\n0.0\n';
                    content += `1\n${layout.pointName}_R\n`;
                }
            });
        }

        content += '0\nENDSEC\n0\nEOF\n';

        return content;
    }

    /**
     * 显示DXF导出对话框
     */
    showDxfExportDialog() {
        // 检查是否有数据可导出
        if (!this.stationData || this.stationData.length === 0) {
            this.showNotification('请先生成坐标与放样表数据', 'warning');
            return;
        }

        // 创建DXF导出对话框
        const dialogHtml = `
            <div class="modal" id="dxfExportModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-drafting-compass"></i> DXF文件导出</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="param-group">
                            <h4><i class="fas fa-cog"></i> 导出选项</h4>
                            <div class="param-row">
                                <label class="param-label">工程名称:</label>
                                <input type="text" class="param-input" id="dxfProjectName" value="${document.getElementById('projectName')?.value || '曲线测设工程'}">
                            </div>
                            <div class="param-row">
                                <label class="param-label">包含内容:</label>
                                <div class="checkbox-group">
                                    <label><input type="checkbox" id="includeMainPoints" checked> 主点坐标</label>
                                    <label><input type="checkbox" id="includeCenterStakes" checked> 中桩坐标</label>
                                    <label><input type="checkbox" id="includeLeftStakes" checked> 左边桩</label>
                                    <label><input type="checkbox" id="includeRightStakes" checked> 右边桩</label>
                                    <label><input type="checkbox" id="includeText" checked> 点名标注</label>
                                    <label><input type="checkbox" id="includeCurveLines"> 曲线连线</label>
                                </div>
                            </div>
                            <div class="param-row">
                                <label class="param-label">文字高度(mm):</label>
                                <input type="number" class="param-input" id="dxfTextHeight" value="2.5" min="0.5" max="10" step="0.1">
                            </div>
                            <div class="param-row">
                                <label class="param-label">点符号大小:</label>
                                <input type="number" class="param-input" id="dxfPointSize" value="1.0" min="0.1" max="5" step="0.1">
                            </div>
                        </div>
                        
                        <div class="param-group">
                            <h4><i class="fas fa-info-circle"></i> 导出说明</h4>
                            <div class="export-info">
                                <p>• 主点包括：ZH、HY、QZ、YH、HZ等关键点</p>
                                <p>• 中桩为曲线中心线上的桩号点</p>
                                <p>• 左右边桩为距离中心线指定距离的放样点</p>
                                <p>• 生成的DXF文件可在AutoCAD中打开查看</p>
                                <p>• 不同类型的点位将分配到不同的图层</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="tool-btn" onclick="this.closest('.modal').remove()">取消</button>
                        <button class="tool-btn primary" onclick="window.curveDesign.exportDxfFile()">导出DXF</button>
                    </div>
                </div>
            </div>
        `;

        // 添加对话框到页面
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
    }

    /**
     * 导出DXF文件
     */
    async exportDxfFile() {
        try {
            if (!this.calculatedElements || !this.mainPoints || this.stationData.length === 0) {
                this.showNotification('请先完成曲线计算，再导出DXF', 'warning');
                return;
            }

            const options = {
                projectName: document.getElementById('dxfProjectName').value || '曲线测设工程',
                textHeight: parseFloat(document.getElementById('dxfTextHeight').value) || 2.5,
                pointSize: parseFloat(document.getElementById('dxfPointSize').value) || 1.0
            };

            const exportData = {
                curvePoints: this.stationData.map(p => p.center),
                mainPoints: this.mainPoints
            };

            // 使用DXF导出服务
            const dxfService = new DxfExportService();
            const result = dxfService.exportSymmetricBasicCurveDxf(exportData, options);

            if (result.success) {
                // 下载DXF文件
                this.downloadFile(result.content, result.filename, 'application/dxf');
                this.showNotification('DXF文件导出成功', 'success');
            } else {
                this.showNotification('DXF导出失败: ' + result.error, 'error');
            }

            // 关闭对话框
            document.getElementById('dxfExportModal')?.remove();
        } catch (error) {
            console.error('导出DXF时出错:', error);
            this.showNotification('导出DXF时出错: ' + error.message, 'error');
        }
    }

    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info') {
        // 如果存在通知系统，使用它
        if (window.notificationSystem) {
            window.notificationSystem.show(message, type);
        } else {
            // 否则使用简单的alert
            alert(message);
        }
    }

    /**
     * 下载文件
     */
    downloadFile(content, fileName, mimeType = 'text/plain;charset=utf-8') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// 初始化曲线设计模块
document.addEventListener('DOMContentLoaded', function() {
    // 等待页面完全加载后再初始化
    setTimeout(() => {
        if (document.getElementById('transitionCurve-content')) {
            window.curveDesign = new CurveDesign();
            console.log('✅ 曲线测设模块初始化完成');
            
            // 添加测试功能
            window.testCurveCalculation = function() {
                console.log('🧪 开始测试曲线计算...');
                try {
                    const curveService = new CurveDesignService();
                    const testParams = {
                        deflectionAngle: 21.03266 * Math.PI / 180, // 21°03'26.6"
                        radius: 1000,
                        transitionLength: 100,
                        intersectionX: 84753.510,
                        intersectionY: 11978.927,
                        startAzimuth: 287.0633 * Math.PI / 180, // 287°06'33"
                        deflectionDirection: 1,
                        intersectionStation: 'K1+462.918'
                    };
                    
                    console.log('测试参数:', testParams);
                    const elementsResult = curveService.calculateCurveElements(testParams);
                    console.log('曲线要素计算结果:', elementsResult);
                    
                    if (elementsResult.success) {
                        const mainPointsResult = curveService.calculateMainPointCoordinates(elementsResult, testParams);
                        console.log('主点坐标计算结果:', mainPointsResult);
                        
                        if (mainPointsResult.success) {
                            console.log('✅ 测试通过！所有计算正常完成');
                            return true;
                        } else {
                            console.error('❌ 主点坐标计算失败:', mainPointsResult.error);
                            return false;
                        }
                    } else {
                        console.error('❌ 曲线要素计算失败:', elementsResult.error);
                        return false;
                    }
                } catch (error) {
                    console.error('❌ 测试过程中发生错误:', error);
                    return false;
                }
            };
            
            console.log('📝 测试功能已添加: testCurveCalculation()');
        }
    }, 100);
});