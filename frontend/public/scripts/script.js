/**
 * 工程测量软件主脚本 - GPS高程转换专业版
 * 实现完整的GPS高程转换功能
 */

// 全局变量
let currentModule = 'gps';
let currentFunction = 'verticalTranslation';
let calculationResults = {};
let calculationSettings = {};

// API基础URL
const DEFAULT_API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;
// 后端接口基址，可通过 window.__TAOMEASURE_API__ 动态覆盖。
const API_BASE = window.__TAOMEASURE_API__ || DEFAULT_API_BASE;

// 功能配置
const FUNCTION_CONFIG = {
    verticalTranslation: {
        title: 'GPS高程转换 - 垂直平移模型',
        description: '适用于小范围、高程异常变化平缓区域（如平原操场、厂房区）',
        icon: 'fas fa-arrows-alt-v',
        minPoints: 1
    },
    linearFitting: {
        title: 'GPS高程转换 - 线性基函数拟合',
        description: '含独立线路坐标系建立，支持直线/二次曲线模型，适配铁路、公路等线性工程',
        icon: 'fas fa-chart-line',
        minPoints: 2
    },
    surfaceFitting: {
        title: 'GPS高程转换 - 面基函数拟合',
        description: '支持平面/二次曲面模型，含参考点设置，适用于大面积、地形略有起伏的面状区域',
        icon: 'fas fa-cube',
        minPoints: 3
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('GPS高程转换软件初始化开始...');
    initializeApp();
});

function initializeApp() {
    try {
        // 初始化事件监听器
        initializeEventListeners();
        
        // 初始化默认设置
        initializeDefaultSettings();
        
        // // 添加测试数据
        // setTimeout(() => {
        //     console.log('准备添加测试数据...');
        //     if (typeof addTestData === 'function') {
        //         addTestData();
        //         updateDataCounts();
        //         console.log('测试数据添加完成');
        //     } else {
        //         console.error('addTestData 函数未定义');
        //     }
        // }, 500);
        
        // 初始化表格
        initializeTables();
        
        // 设置默认日期
        document.getElementById('calcDate').value = new Date().toISOString().split('T')[0];
        
        // 延迟初始化高斯投影功能和更新参数显示
        setTimeout(() => {
            if (typeof updateGaussParametersDisplay === 'function') {
                updateGaussParametersDisplay();
            }
        }, 500);
        
        console.log('应用初始化完成');
        showMessage('GPS高程转换软件已就绪', 'success');
    } catch (error) {
        console.error('应用初始化失败:', error);
        showMessage('应用初始化失败: ' + error.message, 'error');
    }
}

function initializeEventListeners() {
    console.log('初始化事件监听器...');
    
    // 侧边栏功能切换
    const functionButtons = document.querySelectorAll('.sub-module-btn');
    functionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const func = this.dataset.function;
            const module = this.dataset.module;

            if (module) {
                switchFunction(module, func, this);
            }
        });
    });
    
    // 选项卡切换
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabType = this.dataset.tab;
            switchTab(tabType);
        });
    });
    
    // 工具栏按钮
    setupToolbarButtons();
    
    // 表格操作按钮
    setupTableButtons();
   
    
    // 模态框
    setupModals();
    
    // 文件上传
    setupFileUpload();
    
    // 设置表单联动
    setupFormDependencies();
    
    console.log('事件监听器初始化完成');
}

function setupToolbarButtons() {
    // 计算方案按钮
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCalculationSettings();
        });
    }
    
    // 导入已知点按钮
    const importKnownBtn = document.getElementById('importKnownBtn');
    if (importKnownBtn) {
        importKnownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openImportDialog('known');
        });
    }
    
    // 导入未知点按钮
    const importUnknownBtn = document.getElementById('importUnknownBtn');
    if (importUnknownBtn) {
        console.log('导入未知点按钮找到，绑定事件监听器');
        importUnknownBtn.addEventListener('click', function(e) {
            console.log('导入未知点按钮被点击');
            e.preventDefault();
            openImportDialog('unknown');
        });
    } else {
        console.error('找不到导入未知点按钮元素');
    }
    
    // 开始计算按钮
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            startCalculation();
        });
    }
    
    
    // 结果导出按钮
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportResults();
        });
    }
}

function setupTableButtons() {
    // 已知点表格按钮
    const addKnownRowBtn = document.getElementById('addKnownRowBtn');
    if (addKnownRowBtn) {
        addKnownRowBtn.addEventListener('click', () => addTableRow('known'));
    }
    
    const deleteKnownRowBtn = document.getElementById('deleteKnownRowBtn');
    if (deleteKnownRowBtn) {
        deleteKnownRowBtn.addEventListener('click', () => deleteSelectedRows('known'));
    }
    
    const clearKnownBtn = document.getElementById('clearKnownBtn');
    if (clearKnownBtn) {
        clearKnownBtn.addEventListener('click', () => clearTableData('known'));
    }
    
    // 未知点表格按钮
    const addUnknownRowBtn = document.getElementById('addUnknownRowBtn');
    if (addUnknownRowBtn) {
        addUnknownRowBtn.addEventListener('click', () => addTableRow('unknown'));
    }
    
    const deleteUnknownRowBtn = document.getElementById('deleteUnknownRowBtn');
    if (deleteUnknownRowBtn) {
        deleteUnknownRowBtn.addEventListener('click', () => deleteSelectedRows('unknown'));
    }
    
    const clearUnknownBtn = document.getElementById('clearUnknownBtn');
    if (clearUnknownBtn) {
        clearUnknownBtn.addEventListener('click', () => clearTableData('unknown'));
    }
    
    // 全选复选框
    const selectAllKnown = document.getElementById('selectAllKnown');
    if (selectAllKnown) {
        selectAllKnown.addEventListener('change', function() {
            toggleSelectAll('known', this.checked);
        });
    }
    
    const selectAllUnknown = document.getElementById('selectAllUnknown');
    if (selectAllUnknown) {
        selectAllUnknown.addEventListener('change', function() {
            toggleSelectAll('unknown', this.checked);
        });
    }
}



function setupModals() {
    // 模态框关闭按钮
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // 点击模态框背景关闭
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // 设置保存按钮
    const saveButtons = {
        'saveVerticalSettingsBtn': () => saveCalculationSettings('verticalTranslation'),
        'saveLinearSettingsBtn': () => saveCalculationSettings('linearFitting'),
        'saveSurfaceSettingsBtn': () => saveCalculationSettings('surfaceFitting'),
        'saveTableSettingsBtn': () => saveTableSettings(),
        'addManualPointBtn': () => addManualPoint()
    };
    
    Object.entries(saveButtons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                handler();
            });
        }
    });
}

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handleFileSelect(e.target.files);
        });
    }
    
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            handleFileSelect(e.dataTransfer.files);
        });
    }
    
    // 导入选项卡切换
    const importTabs = document.querySelectorAll('.import-tab');
    importTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.dataset.tab;
            switchImportTab(tabType);
        });
    });
}

function setupFormDependencies() {
    // 坐标系选择联动
    const coordinateSystemSelects = document.querySelectorAll('select[name="coordinate_system"]');
    coordinateSystemSelects.forEach(select => {
        select.addEventListener('change', function() {
            const customRows = this.closest('.modal-body').querySelectorAll('.custom-ellipsoid');
            if (this.value === 'custom') {
                customRows.forEach(row => row.style.display = 'flex');
            } else {
                customRows.forEach(row => row.style.display = 'none');
            }
        });
    });
    
    // 线性拟合参数联动
    const centralMeridianSelect = document.querySelector('select[name="central_meridian_type"]');
    if (centralMeridianSelect) {
        centralMeridianSelect.addEventListener('change', function() {
            const manualRows = this.closest('.modal-body').querySelectorAll('.manual-meridian');
            if (this.value === 'manual') {
                manualRows.forEach(row => row.style.display = 'flex');
            } else {
                manualRows.forEach(row => row.style.display = 'none');
            }
        });
    }
    
    const compensationHeightSelect = document.querySelector('select[name="compensation_height_type"]');
    if (compensationHeightSelect) {
        compensationHeightSelect.addEventListener('change', function() {
            const manualRows = this.closest('.modal-body').querySelectorAll('.manual-height');
            if (this.value === 'manual') {
                manualRows.forEach(row => row.style.display = 'flex');
            } else {
                manualRows.forEach(row => row.style.display = 'none');
            }
        });
    }
    
    const centerlineOriginSelect = document.querySelector('select[name="centerline_origin_type"]');
    if (centerlineOriginSelect) {
        centerlineOriginSelect.addEventListener('change', function() {
            const manualRows = this.closest('.modal-body').querySelectorAll('.manual-origin');
            if (this.value === 'manual') {
                manualRows.forEach(row => row.style.display = 'flex');
            } else {
                manualRows.forEach(row => row.style.display = 'none');
            }
        });
    }
    
    // 面拟合参考点联动
    const referencePointSelect = document.querySelector('select[name="reference_point_type"]');
    if (referencePointSelect) {
        referencePointSelect.addEventListener('change', function() {
            const selectRows = this.closest('.modal-body').querySelectorAll('.select-reference');
            const manualRows = this.closest('.modal-body').querySelectorAll('.manual-reference');
            
            selectRows.forEach(row => row.style.display = 'none');
            manualRows.forEach(row => row.style.display = 'none');
            
            if (this.value === 'select') {
                selectRows.forEach(row => row.style.display = 'flex');
            } else if (this.value === 'manual') {
                manualRows.forEach(row => row.style.display = 'flex');
            }
        });
    }
}

// 模块和功能切换
function switchFunction(module, func, clickedButton) {
    console.log(`切换模块: ${module}, 功能: ${func}`);
    currentModule = module;
    currentFunction = func;

    // 隐藏所有工作区
    document.querySelectorAll('.work-area').forEach(area => {
        area.style.display = 'none';
    });

    // 显示当前模块的工作区
    const workAreaId = `${module}-work-area`;
    const targetWorkArea = document.getElementById(workAreaId);
    if (targetWorkArea) {
        targetWorkArea.style.display = 'block';
    } else {
        // 为了兼容旧的ID
        const fallbackId = `${module}-design-work-area`;
        const fallbackWorkArea = document.getElementById(fallbackId);
        if (fallbackWorkArea) {
            fallbackWorkArea.style.display = 'block';
        } else {
             console.error(`未找到工作区: ${workAreaId} 或 ${fallbackId}`);
        }
    }

    // 更新侧边栏激活状态
    document.querySelectorAll('.sub-module-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // 根据模块执行特定的更新
    if (module === 'gps') {
        updateFunctionHeader(func);
        initializeTables();
    } else if (module === 'coordinate') {
        const coordinateWorkArea = document.getElementById('coordinate-work-area');
        if (coordinateWorkArea) {
            // Hide all function-content divs within the coordinate work area
            coordinateWorkArea.querySelectorAll('.function-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show the content for the selected function
            const targetContent = document.getElementById(`${func}-content`);
            if (targetContent) {
                targetContent.style.display = 'block';
                
                // 初始化各个坐标转换功能
                setTimeout(() => {
                    switch(func) {
                        case 'gauss_forward':
                            if (typeof initializeGaussForwardTable === 'function') {
                                initializeGaussForwardTable();
                            }
                            if (typeof bindGaussForwardEvents === 'function') {
                                bindGaussForwardEvents();
                            }
                            if (typeof updateGaussParametersDisplay === 'function') {
                                updateGaussParametersDisplay();
                            }
                            break;
                            
                        case 'gauss_inverse':
                            if (typeof initializeGaussInverse === 'function') {
                                initializeGaussInverse();
                            }
                            break;
                            
                        case 'xyz_to_blh':
                            if (typeof initializeXYZToBLH === 'function') {
                                initializeXYZToBLH();
                            }
                            break;
                            
                        case 'blh_to_xyz':
                            if (typeof initializeBLHToXYZ === 'function') {
                                initializeBLHToXYZ();
                            }
                            break;
                            
                        case 'zone_transform_1':
                            if (typeof initializeZoneTransform1 === 'function') {
                                initializeZoneTransform1();
                            }
                            break;
                            
                        case 'zone_transform_2':
                            if (typeof initializeZoneTransform2 === 'function') {
                                initializeZoneTransform2();
                            }
                            break;
                            
                        case 'four_param_forward':
                            if (typeof initializeFourParamForward === 'function') {
                                initializeFourParamForward();
                            }
                            break;
                            
                        // 四参数转换反算已删除
                            
                        case 'seven_param':
                            if (typeof initializeSevenParam === 'function') {
                                initializeSevenParam();
                            }
                            break;
                    }
                }, 100);
            } else {
                // If no specific content, show the default message
                const defaultContent = document.getElementById('coordinate-default-content');
                if (defaultContent) {
                    defaultContent.style.display = 'block';
                }
            }
        }
    } else if (module === 'curve') {
        const curveWorkArea = document.getElementById('curve-work-area');
        if (curveWorkArea) {
            // Hide all function-content divs within the curve work area
            curveWorkArea.querySelectorAll('.function-content-wrapper').forEach(content => {
                content.style.display = 'none';
            });

            // Show the content for the selected function
            const targetContent = document.getElementById(`${func}-content`);
            if (targetContent) {
                targetContent.style.display = 'block';
            } else {
                // If no specific content, show the default message
                const defaultContent = document.getElementById('curve-default-content');
                if (defaultContent) {
                    defaultContent.style.display = 'block';
                }
                 // Fallback for disabled buttons to show a message or do nothing
                console.warn(`Content for curve function '${func}' not found.`);
            }
        }
    }
    
    // 分发自定义事件，通知其他模块更新
    const functionSwitchedEvent = new CustomEvent('functionSwitched', {
        detail: { module: module, func: func }
    });
    document.dispatchEvent(functionSwitchedEvent);
}

function updateFunctionHeader(func) {
    const config = FUNCTION_CONFIG[func];
    if (!config) return;
    
    const titleElement = document.getElementById('currentFunctionTitle');
    const descElement = document.getElementById('functionDescription');
    
    if (titleElement) {
        titleElement.innerHTML = `<i class="${config.icon}"></i> ${config.title}`;
    }
    
    if (descElement) {
        descElement.textContent = config.description;
    }
}

function updateDataCounts() {
    // 此函数保留用于其他可能需要数据计数的功能
}

// 选项卡切换
function switchTab(tabType) {
    // 更新选项卡激活状态
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabType}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 切换表格显示
    document.querySelectorAll('.table-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`${tabType}PointsTable`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// 表格初始化
function initializeTables() {
    initializeKnownPointsTable();
    initializeUnknownPointsTable();
    updateDataCounts();
}

function initializeKnownPointsTable() {
    const tbody = document.getElementById('knownPointsBody');
    if (!tbody) return;
    
    // 清空现有数据
    tbody.innerHTML = '';
    
    // 添加默认行
    for (let i = 0; i < 5; i++) {
        addKnownPointRow(tbody);
    }
}

function initializeUnknownPointsTable() {
    const tbody = document.getElementById('unknownPointsBody');
    if (!tbody) return;
    
    // 清空现有数据
    tbody.innerHTML = '';
    
    // 添加默认行
    for (let i = 0; i < 5; i++) {
        addUnknownPointRow(tbody);
    }
}

function addKnownPointRow(tbody) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td class="editable"><input type="text" placeholder="" maxlength="20"></td>
        <td class="editable"><input type="text" placeholder="" pattern="[0-9°′″.]+"></td>
        <td class="editable"><input type="text" placeholder="" pattern="[0-9°′″.]+"></td>
        <td class="editable"><input type="number" step="" placeholder=""></td>
        <td class="editable"><input type="number" step="" placeholder=""></td>
        <td class="calculated">-</td>
        <td class="editable"><input type="text" placeholder="" maxlength="50"></td>
    `;
    
    // 添加输入事件监听器
    const inputs = row.querySelectorAll('input');
    inputs.forEach((input, index) => {
        if (input.type !== 'checkbox') {
            input.addEventListener('input', function() {
                // 自动计算正常高
                if (index === 4 || index === 5) { // 大地高或高程异常变化时
                    calculateNormalHeight(row);
                }
                updateDataCounts();
            });
        }
    });
    
    tbody.appendChild(row);
}

function addUnknownPointRow(tbody) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td class="editable"><input type="text" placeholder="" maxlength="20"></td>
        <td class="editable"><input type="text" placeholder="" pattern="[0-9°′″.]+"></td>
        <td class="editable"><input type="text" placeholder="" pattern="[0-9°′″.]+"></td>
        <td class="editable"><input type="number" step="" placeholder=""></td>
        <td class="calculated">-</td>
        <td class="calculated">-</td>
    `;
    
    // 添加输入事件监听器
    const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            updateDataCounts();
        });
    });
    
    tbody.appendChild(row);
}

function calculateNormalHeight(row) {
    const inputs = row.querySelectorAll('input');
    const ellipsoidHeight = parseFloat(inputs[4].value); // 大地高
    const heightAnomaly = parseFloat(inputs[5].value);   // 高程异常
    
    if (!isNaN(ellipsoidHeight) && !isNaN(heightAnomaly)) {
        const normalHeight = ellipsoidHeight - heightAnomaly;
        const calculatedCell = row.querySelector('.calculated');
        if (calculatedCell) {
            calculatedCell.textContent = normalHeight.toFixed(5);
        }
    }
}

// 表格操作
function addTableRow(type) {
    const tbody = document.getElementById(`${type}PointsBody`);
    if (!tbody) return;
    
    if (type === 'known') {
        addKnownPointRow(tbody);
    } else {
        addUnknownPointRow(tbody);
    }
    
    updateDataCounts();
}

function deleteSelectedRows(type) {
    const tbody = document.getElementById(`${type}PointsBody`);
    if (!tbody) return;
    
    const selectedRows = tbody.querySelectorAll('input.row-select:checked');
    if (selectedRows.length === 0) {
        showMessage('请先选择要删除的行', 'error');
        return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedRows.length} 行数据吗？`)) {
        selectedRows.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row) {
                row.remove();
            }
        });
        
        updateDataCounts();
        showMessage(`已删除 ${selectedRows.length} 行数据`, 'success');
    }
}

function clearTableData(type) {
    if (confirm(`确定要清空所有${type === 'known' ? '已知点' : '未知点'}数据吗？`)) {
        const tbody = document.getElementById(`${type}PointsBody`);
        if (tbody) {
            tbody.innerHTML = '';
            
            // 重新添加默认行
            for (let i = 0; i < 5; i++) {
                if (type === 'known') {
                    addKnownPointRow(tbody);
                } else {
                    addUnknownPointRow(tbody);
                }
            }
            
            updateDataCounts();
            showMessage(`已清空${type === 'known' ? '已知点' : '未知点'}数据`, 'success');
        }
    }
}

function toggleSelectAll(type, checked) {
    const tbody = document.getElementById(`${type}PointsBody`);
    if (!tbody) return;
    
    const checkboxes = tbody.querySelectorAll('input.row-select');
    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
    });
}

// 计算方案设置
function openCalculationSettings() {
    const modalId = `${currentFunction}SettingsModal`;
    const modal = document.getElementById(modalId);
    
    if (modal) {
        // 加载已保存的设置
        loadCalculationSettings(currentFunction);
        modal.style.display = 'block';
        modal.classList.add('show');
        console.log('计算方案模态框已显示:', modalId);
        
        // 为线性和面拟合设置特殊的联动效果
        if (currentFunction === 'linearFitting') {
            setupLinearFittingDependencies();
        } else if (currentFunction === 'surfaceFitting') {
            setupSurfaceFittingDependencies();
        }
    } else {
        console.error('找不到设置模态框:', modalId);
        showMessage('该功能的设置界面尚未实现', 'error');
    }
}

function loadCalculationSettings(func) {
    const settings = calculationSettings[func] || {};
    const modal = document.getElementById(`${func}SettingsModal`);
    if (!modal) return;
    
    // 加载通用设置
    const inputs = modal.querySelectorAll('input, select');
    inputs.forEach(input => {
        const name = input.name;
        if (name && settings[name] !== undefined) {
            if (input.type === 'radio') {
                input.checked = input.value === settings[name];
            } else {
                input.value = settings[name];
            }
        }
    });
    
    // 触发联动更新
    const coordinateSystemSelect = modal.querySelector('select[name="coordinate_system"]');
    if (coordinateSystemSelect) {
        coordinateSystemSelect.dispatchEvent(new Event('change'));
    }
}

function saveCalculationSettings(func) {
    const modal = document.getElementById(`${func}SettingsModal`);
    if (!modal) return;
    
    let settings = {};
    
    // 根据功能类型使用专用的设置收集函数
    if (func === 'linearFitting' && window.collectLinearFittingSettings) {
        settings = window.collectLinearFittingSettings(modal);
    } else if (func === 'surfaceFitting' && window.collectSurfaceFittingSettings) {
        settings = window.collectSurfaceFittingSettings(modal);
    } else {
        // 通用设置收集
        const inputs = modal.querySelectorAll('input, select');
        inputs.forEach(input => {
            const name = input.name;
            if (name) {
                if (input.type === 'radio') {
                    if (input.checked) {
                        settings[name] = input.value;
                    }
                } else if (input.type === 'checkbox') {
                    settings[name] = input.checked;
                } else {
                    settings[name] = input.value;
                }
            }
        });
    }
    
    // 验证设置
    if (!validateSettings(func, settings)) {
        return;
    }
    
    // 保存设置
    calculationSettings[func] = settings;
    
    // 保存到本地存储
    localStorage.setItem('gpsCalculationSettings', JSON.stringify(calculationSettings));
    
    closeModal(`${func}SettingsModal`);
    showMessage('计算方案设置已保存', 'success');
    
    console.log('保存的设置:', settings);
}

function validateSettings(func, settings) {
    // 基本验证
    if (settings.coordinate_system === 'custom') {
        if (!settings.semi_major_axis || !settings.flattening_denominator) {
            showMessage('自定义坐标系需要输入椭球参数', 'error');
            return false;
        }
    }
    
    // 获取已知点数量用于验证
    const knownPointsCount = collectTableData('known').length;
    
    // 使用专用验证函数
    let errors = [];
    
    if (func === 'linearFitting' && window.validateLinearFittingSettings) {
        errors = window.validateLinearFittingSettings(settings, knownPointsCount);
    } else if (func === 'surfaceFitting' && window.validateSurfaceFittingSettings) {
        errors = window.validateSurfaceFittingSettings(settings, knownPointsCount);
    }
    
    // 显示验证错误
    if (errors.length > 0) {
        showMessage(errors.join('\
'), 'error');
        return false;
    }
    
    return true;
}

// 数据导入
function openImportDialog(type) {
    console.log('打开导入对话框:', type);
    const modal = document.getElementById('importModal');
    const title = document.getElementById('importModalTitle');
    
    if (modal && title) {
        title.textContent = `导入${type === 'known' ? '已知点' : '未知点'}数据`;
        modal.dataset.importType = type;
        
        // 显示/隐藏高程异常输入行
        const heightAnomalyRow = document.getElementById('manualHeightAnomalyRow');
        if (heightAnomalyRow) {
            heightAnomalyRow.style.display = type === 'known' ? 'flex' : 'none';
        }
        
        // 使用display方式显示模态框
        modal.style.display = 'block';
        modal.classList.add('show');
        console.log('模态框已显示');
    } else {
        console.error('找不到导入模态框元素:', { modal: !!modal, title: !!title });
    }
}

function switchImportTab(tabType) {
    // 更新选项卡
    document.querySelectorAll('.import-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabType}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 切换面板
    document.querySelectorAll('.import-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`${tabType}ImportPanel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

function handleFileSelect(files) {
    if (files.length === 0) return;
    
    const modal = document.getElementById('importModal');
    const importType = modal.dataset.importType;
    
    // 如果是高斯投影数据，使用专门的处理函数
    if (importType === 'gauss-forward') {
        if (typeof handleGaussFileImport === 'function') {
            console.log('调用高斯投影文件导入:', files[0]?.name);
            handleGaussFileImport(files[0]);
        } else {
            showMessage('高斯投影导入功能未加载', 'error');
        }
        return;
    }
    
    // 如果是四参数正算，使用专门的处理函数
    if (importType === 'four_param_forward') {
        if (typeof importFourParamForwardData === 'function') {
            console.log('调用四参数正算文件导入:', files[0]?.name);
            
            const file = files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n').filter(line => line.trim());
                    const data = [];
                    
                    for (let line of lines) {
                        // 跳过注释行
                        if (line.startsWith('#') || line.startsWith('//')) continue;
                        
                        // 分割数据（支持空格、制表符、逗号分隔）
                        const parts = line.trim().split(/[\s,\t]+/).filter(part => part);
                        
                        if (parts.length >= 3) {
                            const pointData = {
                                name: parts[0],
                                x: parseFloat(parts[1]),
                                y: parseFloat(parts[2])
                            };
                            
                            if (!isNaN(pointData.x) && !isNaN(pointData.y)) {
                                data.push(pointData);
                            }
                        }
                    }
                    
                    if (data.length > 0) {
                        importFourParamForwardData(data);
                        closeModal('importModal');
                        showMessage(`成功导入 ${data.length} 条数据`, 'success');
                    } else {
                        showMessage('文件中没有找到有效数据', 'error');
                    }
                } catch (error) {
                    console.error('文件解析失败:', error);
                    showMessage('文件解析失败: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file, 'UTF-8');
        } else {
            showMessage('四参数正算导入功能未加载', 'error');
        }
        return;
    }
    
    // 如果是四参数正算公共点，使用专门的处理函数
    if (importType === 'four_param_forward_common_points') {
        if (typeof importFourParamForwardCommonPointsData === 'function') {
            console.log('调用四参数正算公共点文件导入:', files[0]?.name);
            
            const file = files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n').filter(line => line.trim());
                    const data = [];
                    
                    for (let line of lines) {
                        // 跳过注释行
                        if (line.startsWith('#') || line.startsWith('//')) continue;
                        
                        // 分割数据（支持空格、制表符、逗号分隔）
                        const parts = line.trim().split(/[\s,\t]+/).filter(part => part);
                        
                        if (parts.length >= 5) {
                            const pointData = {
                                name: parts[0],
                                source_x: parseFloat(parts[1]),
                                source_y: parseFloat(parts[2]),
                                target_x: parseFloat(parts[3]),
                                target_y: parseFloat(parts[4])
                            };
                            
                            if (!isNaN(pointData.source_x) && !isNaN(pointData.source_y) && 
                                !isNaN(pointData.target_x) && !isNaN(pointData.target_y)) {
                                data.push(pointData);
                            }
                        }
                    }
                    
                    if (data.length > 0) {
                        importFourParamForwardCommonPointsData(data);
                        closeModal('importModal');
                        showMessage(`成功导入 ${data.length} 个公共点`, 'success');
                    } else {
                        showMessage('文件中没有找到有效的公共点数据（格式：点名 源X 源Y 目标X 目标Y）', 'error');
                    }
                } catch (error) {
                    console.error('文件解析失败:', error);
                    showMessage('文件解析失败: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file, 'UTF-8');
        } else {
            showMessage('四参数正算公共点导入功能未加载', 'error');
        }
        return;
    }

    // 如果是七参数转换数据，使用专门的处理函数
    if (importType === 'seven_param') {
        if (typeof importSevenParamData === 'function') {
            console.log('调用七参数转换数据文件导入:', files[0]?.name);
            
            const file = files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n').filter(line => line.trim());
                    const data = [];
                    
                    for (let line of lines) {
                        // 跳过注释行
                        if (line.startsWith('#') || line.startsWith('//')) continue;
                        
                        // 分割数据（支持空格、制表符、逗号分隔）
                        const parts = line.trim().split(/[\s,\t]+/).filter(part => part);
                        
                        if (parts.length >= 4) {
                            const pointData = {
                                name: parts[0],
                                X: parseFloat(parts[1]),
                                Y: parseFloat(parts[2]),
                                Z: parseFloat(parts[3])
                            };
                            
                            if (!isNaN(pointData.X) && !isNaN(pointData.Y) && !isNaN(pointData.Z)) {
                                data.push(pointData);
                            }
                        }
                    }
                    
                    if (data.length > 0) {
                        importSevenParamData(data);
                        closeModal('importModal');
                        showMessage(`成功导入 ${data.length} 个待转换点`, 'success');
                    } else {
                        showMessage('文件中没有找到有效的七参数转换数据（格式：点名 X Y Z）', 'error');
                    }
                } catch (error) {
                    console.error('文件解析失败:', error);
                    showMessage('文件解析失败: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file, 'UTF-8');
        } else {
            showMessage('七参数转换数据导入功能未加载', 'error');
        }
        return;
    }

    // 如果是七参数公共点，使用专门的处理函数
    if (importType === 'seven_param_common_points') {
        if (typeof importSevenParamCommonPointsData === 'function') {
            console.log('调用七参数公共点文件导入:', files[0]?.name);
            
            const file = files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n').filter(line => line.trim());
                    const data = [];
                    
                    for (let line of lines) {
                        // 跳过注释行
                        if (line.startsWith('#') || line.startsWith('//')) continue;
                        
                        // 分割数据（支持空格、制表符、逗号分隔）
                        const parts = line.trim().split(/[\s,\t]+/).filter(part => part);
                        
                        if (parts.length >= 7) {
                            const pointData = {
                                name: parts[0],
                                sourceX: parseFloat(parts[1]),
                                sourceY: parseFloat(parts[2]),
                                sourceZ: parseFloat(parts[3]),
                                targetX: parseFloat(parts[4]),
                                targetY: parseFloat(parts[5]),
                                targetZ: parseFloat(parts[6])
                            };
                            
                            if (!isNaN(pointData.sourceX) && !isNaN(pointData.sourceY) && !isNaN(pointData.sourceZ) &&
                                !isNaN(pointData.targetX) && !isNaN(pointData.targetY) && !isNaN(pointData.targetZ)) {
                                data.push(pointData);
                            }
                        }
                    }
                    
                    if (data.length > 0) {
                        importSevenParamCommonPointsData(data);
                        closeModal('importModal');
                        showMessage(`成功导入 ${data.length} 个公共点`, 'success');
                    } else {
                        showMessage('文件中没有找到有效的公共点数据（格式：点名 源X 源Y 源Z 目标X 目标Y 目标Z）', 'error');
                    }
                } catch (error) {
                    console.error('文件解析失败:', error);
                    showMessage('文件解析失败: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file, 'UTF-8');
        } else {
            showMessage('七参数公共点导入功能未加载', 'error');
        }
        return;
    }
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const data = parseFileContent(content, file.name);
            
            if (data && data.length > 0) {
                importDataToTable(data, importType);
                closeModal('importModal');
                showMessage(`成功导入 ${data.length} 条数据`, 'success');
            } else {
                showMessage('文件中没有找到有效数据', 'error');
            }
        } catch (error) {
            console.error('文件解析失败:', error);
            showMessage('文件解析失败: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

function parseFileContent(content, filename) {
    const lines = content.split('\n').filter(line => line.trim());
    const data = [];
    
    for (let line of lines) {
        // 跳过注释行
        if (line.startsWith('#') || line.startsWith('//')) continue;
        
        // 分割数据（支持空格、制表符、逗号分隔）
        const parts = line.trim().split(/[\s,\t]+/).filter(part => part);
        
        if (parts.length >= 4) {
            const pointData = {
                name: parts[0],
                latitude: parts[1],
                longitude: parts[2],
                ellipsoidHeight: parseFloat(parts[3])
            };
            
            // 如果有第5列，作为高程异常
            if (parts.length >= 5) {
                pointData.heightAnomaly = parseFloat(parts[4]);
            }
            
            data.push(pointData);
        }
    }
    
    return data;
}

function importDataToTable(data, type) {
    const tbody = document.getElementById(`${type}PointsBody`);
    if (!tbody) return;
    
    // 清空现有数据
    tbody.innerHTML = '';
    
    // 导入数据
    data.forEach(pointData => {
        if (type === 'known') {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="row-select"></td>
                <td class="editable"><input type="text" value="${pointData.name || ''}"></td>
                <td class="editable"><input type="text" value="${pointData.latitude || ''}"></td>
                <td class="editable"><input type="text" value="${pointData.longitude || ''}"></td>
                <td class="editable"><input type="number" step="0.001" value="${pointData.ellipsoidHeight || ''}"></td>
                <td class="editable"><input type="number" step="0.001" value="${pointData.heightAnomaly || ''}"></td>
                <td class="calculated">-</td>
                <td class="editable"><input type="text" value=""></td>
            `;
            
            tbody.appendChild(row);
            
            // 计算正常高
            if (pointData.ellipsoidHeight && pointData.heightAnomaly) {
                calculateNormalHeight(row);
            }
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="row-select"></td>
                <td class="editable"><input type="text" value="${pointData.name || ''}"></td>
                <td class="editable"><input type="text" value="${pointData.latitude || ''}"></td>
                <td class="editable"><input type="text" value="${pointData.longitude || ''}"></td>
                <td class="editable"><input type="number" step="0.001" value="${pointData.ellipsoidHeight || ''}"></td>
                <td class="calculated">-</td>
                <td class="calculated">-</td>
            `;
            
            tbody.appendChild(row);
        }
    });
    
    updateDataCounts();
}

function addManualPoint() {
    const modal = document.getElementById('importModal');
    const importType = modal.dataset.importType;
    
    // 收集手动输入的数据
    const pointData = {
        name: document.getElementById('manualPointName').value.trim(),
        latitude: document.getElementById('manualLatitude').value.trim(),
        longitude: document.getElementById('manualLongitude').value.trim(),
        ellipsoidHeight: parseFloat(document.getElementById('manualEllipsoidHeight').value)
    };
    
    if (importType === 'known') {
        pointData.heightAnomaly = parseFloat(document.getElementById('manualHeightAnomaly').value);
    }

    // 处理七参数公共点手动输入
    if (importType === 'seven_param_common_points') {
        const sourceX = parseFloat(document.getElementById('manualSourceX').value);
        const sourceY = parseFloat(document.getElementById('manualSourceY').value);
        const sourceZ = parseFloat(document.getElementById('manualSourceZ').value);
        const targetX = parseFloat(document.getElementById('manualTargetX').value);
        const targetY = parseFloat(document.getElementById('manualTargetY').value);
        const targetZ = parseFloat(document.getElementById('manualTargetZ').value);
        
        if (isNaN(sourceX) || isNaN(sourceY) || isNaN(sourceZ) ||
            isNaN(targetX) || isNaN(targetY) || isNaN(targetZ)) {
            showMessage('请填写完整的坐标信息', 'error');
            return;
        }
        
        pointData.sourceX = sourceX;
        pointData.sourceY = sourceY;
        pointData.sourceZ = sourceZ;
        pointData.targetX = targetX;
        pointData.targetY = targetY;
        pointData.targetZ = targetZ;
    }
    
    // 验证数据
    if (!pointData.name || !pointData.latitude || !pointData.longitude || isNaN(pointData.ellipsoidHeight)) {
        showMessage('请填写完整的点位信息', 'error');
        return;
    }
    
    if (importType === 'known' && isNaN(pointData.heightAnomaly)) {
        showMessage('请填写高程异常', 'error');
        return;
    }
    
    // 添加到表格
    importDataToTable([pointData], importType);
    
    // 清空输入框
    document.getElementById('manualPointName').value = '';
    document.getElementById('manualLatitude').value = '';
    document.getElementById('manualLongitude').value = '';
    document.getElementById('manualEllipsoidHeight').value = '';
    if (importType === 'known') {
        document.getElementById('manualHeightAnomaly').value = '';
    }
    
    showMessage('点位已添加到表格', 'success');
}

// 计算功能
async function startCalculation() {
    try {
        // 验证数据
        const knownPoints = collectTableData('known');
        const unknownPoints = collectTableData('unknown');
        
        console.log('收集到的已知点数据:', knownPoints);
        console.log('收集到的未知点数据:', unknownPoints);
        
        if (knownPoints.length === 0) {
            showMessage('请先添加已知点数据。您可以点击"添加行"按钮手动输入，或使用"导入已知点"功能。', 'error');
            return;
        }
        
        if (unknownPoints.length === 0) {
            showMessage('请先添加未知点数据。您可以点击"添加行"按钮手动输入，或使用"导入未知点"功能。', 'error');
            return;
        }
        
        const config = FUNCTION_CONFIG[currentFunction];
        if (knownPoints.length < config.minPoints) {
            showMessage(`${config.title.split(' - ')[1]}至少需要 ${config.minPoints} 个已知点`, 'error');
            return;
        }
        
        // 显示计算状态
        showLoading(true);
        
        // 准备计算参数
        let model = 'vertical_translation';
        if (currentFunction === 'linearFitting') {
            model = 'linear_basis';
        } else if (currentFunction === 'surfaceFitting') {
            model = 'surface_basis';
        }
        
        const calculationData = {
            known_points: knownPoints,
            unknown_points: unknownPoints,
            model: model,
            model_params: calculationSettings[currentFunction] || {}
        };
        
        console.log('开始计算:', calculationData);
        
        // 调用后端API
        const results = await performCalculation(calculationData);
        
        // 显示计算结果
        displayCalculationResults(results);
        
        showMessage('计算完成', 'success');
        
    } catch (error) {
        console.error('计算失败:', error);
        showMessage('计算失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function collectTableData(type) {
    const tbody = document.getElementById(`${type}PointsBody`);
    if (!tbody) {
        console.error(`表格 ${type}PointsBody 不存在`);
        return [];
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`${type}表格中找到 ${rows.length} 行数据`);
    const data = [];
    
    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
        console.log(`第${index+1}行找到 ${inputs.length} 个输入框`);
        
        if (type === 'known') {
            if (inputs.length >= 6) {
                // 处理经纬度格式转换
                const latValue = parseCoordinateValue(inputs[1].value.trim());
                const lonValue = parseCoordinateValue(inputs[2].value.trim());
                
                const pointData = {
                    name: inputs[0].value.trim(),
                    lat: latValue,
                    lon: lonValue,
                    H: parseFloat(inputs[3].value),
                    anomaly: parseFloat(inputs[4].value),
                    remark: inputs[5].value.trim()
                };
                
                console.log(`已知点数据:`, pointData);
                
                // 验证必要字段
                if (pointData.name && !isNaN(pointData.lat) && !isNaN(pointData.lon) && 
                    !isNaN(pointData.H) && !isNaN(pointData.anomaly)) {
                    data.push(pointData);
                } else {
                    console.warn(`已知点数据验证失败:`, pointData);
                }
            }
        } else {
            if (inputs.length >= 4) {
                // 处理经纬度格式转换
                const latValue = parseCoordinateValue(inputs[1].value.trim());
                const lonValue = parseCoordinateValue(inputs[2].value.trim());
                
                const pointData = {
                    name: inputs[0].value.trim(),
                    lat: latValue,
                    lon: lonValue,
                    H: parseFloat(inputs[3].value)
                };
                
                console.log(`未知点数据:`, pointData);
                
                // 验证必要字段
                if (pointData.name && !isNaN(pointData.lat) && !isNaN(pointData.lon) && 
                    !isNaN(pointData.H)) {
                    data.push(pointData);
                } else {
                    console.warn(`未知点数据验证失败:`, pointData);
                }
            }
        }
    });
    
    return data;
}

/**
 * 解析坐标值，支持度分秒格式和十进制度格式
 */
function parseCoordinateValue(value) {
    if (!value) return NaN;
    
    // 如果已经是数字，直接返回
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && !value.includes('°') && !value.includes('′') && !value.includes('″')) {
        return numValue;
    }
    
    // 解析度分秒格式 (例: 23°10′30″ 或 23°10'30")
    const dmsPattern = /(\d+)[°]\s*(\d+)[′']\s*(\d+(?:\.\d+)?)[″"]/;
    const match = value.match(dmsPattern);
    
    if (match) {
        const degrees = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseFloat(match[3]);
        
        return degrees + minutes / 60 + seconds / 3600;
    }
    
    // 解析度分格式 (例: 23°10.5′)
    const dmPattern = /(\d+)[°]\s*(\d+(?:\.\d+)?)[′']/;
    const dmMatch = value.match(dmPattern);
    
    if (dmMatch) {
        const degrees = parseInt(dmMatch[1]);
        const minutes = parseFloat(dmMatch[2]);
        
        return degrees + minutes / 60;
    }
    
    // 如果都不匹配，尝试直接解析为数字
    return numValue;
}

async function performCalculation(data) {
    console.log('发送计算请求到后端:', data);
    
    try {
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch('http://127.0.0.1:5000/api/gps-altitude', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('后端响应状态:', response.status);
        
        if (!response.ok) {
            let errorMessage = '计算请求失败';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
                console.error('后端错误详情:', errorData);
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('后端返回结果:', result);
        
        // 验证返回结果的完整性
        if (!result || typeof result !== 'object') {
            throw new Error('后端返回的数据格式无效');
        }
        
        return result;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('计算请求超时，请检查网络连接或减少数据量');
        }
        console.error('API调用失败:', error);
        throw error;
    }
}

function displayCalculationResults(results) {
    if (!results) {
        console.warn('无效的计算结果');
        showMessage('计算结果无效', 'error');
        return;
    }
    
    console.log('显示计算结果:', results);
    
    // 处理不同的结果格式
    let resultData = results.data || results.results || results;
    if (!Array.isArray(resultData)) {
        console.warn('计算结果数据格式不正确:', results);
        showMessage('计算结果数据格式不正确', 'error');
        return;
    }
    
    // 更新未知点表格
    const tbody = document.getElementById('unknownPointsBody');
    if (!tbody) {
        console.error('未找到未知点表格');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`找到 ${rows.length} 行，结果数据 ${resultData.length} 条`);
    
    resultData.forEach((result, index) => {
        if (index < rows.length) {
            const row = rows[index];
            const calculatedCells = row.querySelectorAll('.calculated');
            
            if (calculatedCells.length >= 2) {
                // 处理不同的字段名
                const anomaly = result.calculated_anomaly || result.anomaly || result.height_anomaly;
                const normalHeight = result.normal_height || result.h || result.height;
                
                calculatedCells[0].textContent = anomaly ? anomaly.toFixed(5) : '-';
                calculatedCells[1].textContent = normalHeight ? normalHeight.toFixed(5) : '-';
                
                // 添加成功样式
                calculatedCells[0].classList.add('result-success');
                calculatedCells[1].classList.add('result-success');
            }
        }
    });
    
    // 显示精度评定
    if (results.accuracy || results.statistics) {
        displayAccuracyAssessment(results.accuracy || results.statistics);
    }
    
    // 显示模型参数
    if (results.model_params || results.parameters) {
        displayModelParameters(results.model_params || results.parameters);
    }
    
    // 保存结果到全局变量
    window.calculationResults = results;
    calculationResults = results;
    console.log('计算结果已保存到全局变量:', results);
    
    // 显示成功消息
    showMessage(`成功计算 ${resultData.length} 个未知点的高程异常`, 'success');
}

/**
 * 显示模型参数
 */
function displayModelParameters(parameters) {
    if (!parameters) return;
    
    let paramHtml = `
        <div class="model-parameters">
            <div class="assessment-title">
                <i class="fas fa-cogs"></i>模型参数
            </div>
            <div class="assessment-content">
    `;
    
    // 根据当前计算模型类型筛选显示参数
    const currentModel = window.currentFunction || '';
    
    Object.entries(parameters).forEach(([key, value]) => {
        let displayKey = key;
        let displayValue = value;
        let shouldDisplay = true;
        
        // 根据模型类型筛选参数
        if (currentModel === 'linearFitting') {
            // 线性基函数拟合：不显示参考点坐标，显示线路方位角
            if (key === '参考点坐标') {
                shouldDisplay = false;
            }
        } else if (currentModel === 'surfaceFitting') {
            // 面基函数拟合：显示参考点坐标，不显示线路方位角
            if (key === '线路方位角') {
                shouldDisplay = false;
            }
        }
        
        if (!shouldDisplay) return;
        
        // 格式化参数名称
        switch (key) {
            case 'mean_anomaly':
            case '平均高程异常':
                displayKey = '平均高程异常';
                displayValue = typeof value === 'number' ? value.toFixed(5) + 'm' : value;
                break;
            case 'a0':
                displayKey = '常数项 a₀';
                displayValue = typeof value === 'number' ? value.toFixed(6) : value;
                break;
            case 'a1':
                displayKey = '一次项系数 a₁';
                displayValue = typeof value === 'number' ? value.toFixed(6) : value;
                break;
            case 'a2':
                displayKey = '二次项系数 a₂';
                displayValue = typeof value === 'number' ? value.toFixed(8) : value;
                break;
            case '模型类型':
                displayKey = '模型类型';
                displayValue = value;
                break;
            case '拟合系数':
                displayKey = '拟合系数';
                if (typeof value === 'object' && value !== null) {
                    displayValue = '<div style="margin-left: 10px;">';
                    Object.entries(value).forEach(([k, v]) => {
                        if (v !== null && v !== undefined) {
                            displayValue += `<div>${k}: ${typeof v === 'number' ? v.toFixed(12) : v}</div>`;
                        }
                    });
                    displayValue += '</div>';
                } else {
                    displayValue = value;
                }
                break;
            case '线路方位角':
                displayKey = '线路方位角';
                displayValue = typeof value === 'number' ? value.toFixed(4) + '°' : value;
                break;
            case '参考点坐标':
                displayKey = '参考点坐标';
                if (typeof value === 'object' && value !== null) {
                    // 处理新的参考点坐标格式（B₀和L₀）
                    if (value['纬度 B₀'] !== undefined && value['经度 L₀'] !== undefined) {
                        displayValue = `纬度 B₀: ${value['纬度 B₀']?.toFixed(6) || 'N/A'}°, 经度 L₀: ${value['经度 L₀']?.toFixed(6) || 'N/A'}°`;
                    } else {
                        // 兼容旧的参考点坐标格式
                        displayValue = `纬度: ${value.纬度?.toFixed(6) || value.lat?.toFixed(6) || 'N/A'}°, 经度: ${value.经度?.toFixed(6) || value.lon?.toFixed(6) || 'N/A'}°`;
                    }
                } else {
                    displayValue = value;
                }
                break;
            case '已知点数量':
                displayKey = '已知点数量';
                displayValue = value;
                break;
            case '未知点数量':
                displayKey = '未知点数量';
                displayValue = value;
                break;
            default:
                displayValue = typeof value === 'number' ? value.toFixed(4) : value;
        }
        
        paramHtml += `
            <div class="assessment-item">
                <div class="assessment-label">${displayKey}</div>
                <div class="assessment-value">${displayValue}</div>
            </div>
        `;
    });
    
    paramHtml += `
            </div>
        </div>
    `;
    
    // 在精度评定后显示模型参数
    const tableContent = document.querySelector('.table-content');
    if (tableContent) {
        let existingParams = tableContent.querySelector('.model-parameters');
        if (existingParams) {
            existingParams.remove();
        }
        tableContent.insertAdjacentHTML('beforeend', paramHtml);
    }
}

function displayAccuracyAssessment(accuracy) {
    let assessmentHtml = `
        <div class="accuracy-assessment">
            <div class="assessment-title">
                <i class="fas fa-chart-line"></i>精度评定
            </div>
            <div class="assessment-content">
    `;
    
    if (accuracy.rmsError !== undefined) {
        assessmentHtml += `
            <div class="assessment-item">
                <div class="assessment-label">均方根误差</div>
                <div class="assessment-value">${accuracy.rmsError.toFixed(4)}m</div>
            </div>
        `;
    }
    
    if (accuracy.maxResidual !== undefined) {
        assessmentHtml += `
            <div class="assessment-item">
                <div class="assessment-label">最大残差</div>
                <div class="assessment-value">${accuracy.maxResidual.toFixed(4)}m</div>
            </div>
        `;
    }
    
    if (accuracy.meanResidual !== undefined) {
        assessmentHtml += `
            <div class="assessment-item">
                <div class="assessment-label">平均残差</div>
                <div class="assessment-value">${accuracy.meanResidual.toFixed(4)}m</div>
            </div>
        `;
    }
    
    if (accuracy.unitWeightError !== undefined) {
        assessmentHtml += `
            <div class="assessment-item">
                <div class="assessment-label">单位权中误差</div>
                <div class="assessment-value">${accuracy.unitWeightError.toFixed(4)}m</div>
            </div>
        `;
    }
    
    assessmentHtml += `
            </div>
        </div>
    `;
    
    // 在表格容器下方显示精度评定
    const tableContent = document.querySelector('.table-content');
    if (tableContent) {
        let existingAssessment = tableContent.querySelector('.accuracy-assessment');
        if (existingAssessment) {
            existingAssessment.remove();
        }
        tableContent.insertAdjacentHTML('beforeend', assessmentHtml);
    }
}

// 其他功能
function openTableSettings() {
    const modal = document.getElementById('tableSettingsModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function applyTableSettings(settings) {
    const tables = document.querySelectorAll('.data-table');
    
    tables.forEach(table => {
        if (settings.font_size) {
            table.style.fontSize = settings.font_size + 'px';
        }
        
        if (settings.row_height) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                switch (settings.row_height) {
                    case 'compact':
                        row.style.height = '32px';
                        break;
                    case 'loose':
                        row.style.height = '48px';
                        break;
                    default:
                        row.style.height = '40px';
                }
            });
        }
    });
}

function exportResults() {
    if (!calculationResults || Object.keys(calculationResults).length === 0) {
        showMessage('没有可导出的计算结果', 'error');
        return;
    }
    
    try {
        // 准备导出数据
        const exportData = prepareExportData();
        
        // 创建CSV内容
        const csvContent = convertToCSV(exportData);
        
        // 下载文件
        const projectName = document.getElementById('projectName').value || '工程测量';
        const filename = `${projectName}_GPS高程转换结果_${new Date().toISOString().slice(0, 10)}.csv`;
        
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
        
        showMessage('结果导出成功', 'success');
    } catch (error) {
        console.error('导出失败:', error);
        showMessage('导出失败: ' + error.message, 'error');
    }
}

function prepareExportData() {
    const knownPoints = collectTableData('known');
    const unknownPoints = collectTableData('unknown');
    
    const data = [];
    
    // 添加标题行
    data.push(['GPS高程转换计算结果']);
    data.push(['项目名称', document.getElementById('projectName').value || '']);
    data.push(['计算功能', FUNCTION_CONFIG[currentFunction].title]);
    data.push(['计算日期', document.getElementById('calcDate').value || '']);
    data.push(['计算员', document.getElementById('calculator').value || '']);
    data.push(['复核员', document.getElementById('checker').value || '']);
    data.push([]);
    
    // 已知点数据
    data.push(['已知点数据']);
    data.push(['点名', '纬度', '经度', '大地高(m)', '高程异常(m)', '正常高(m)', '备注']);
    
    knownPoints.forEach(point => {
        const normalHeight = point.ellipsoidHeight - point.heightAnomaly;
        data.push([
            point.name,
            point.latitude,
            point.longitude,
            point.ellipsoidHeight.toFixed(3),
            point.heightAnomaly.toFixed(5),
            normalHeight.toFixed(5),
            point.remark || ''
        ]);
    });
    
    data.push([]);
    
    // 未知点数据
    data.push(['未知点计算结果']);
    data.push(['点名', '纬度', '经度', '大地高(m)', '计算高程异常(m)', '正常高(m)']);
    
    if (calculationResults.unknownPoints) {
        calculationResults.unknownPoints.forEach((result, index) => {
            const unknownPoint = unknownPoints[index];
            if (unknownPoint) {
                data.push([
                    unknownPoint.name,
                    unknownPoint.latitude,
                    unknownPoint.longitude,
                    unknownPoint.ellipsoidHeight.toFixed(3),
                    result.calculatedHeightAnomaly?.toFixed(5) || '-',
                    result.normalHeight?.toFixed(5) || '-'
                ]);
            }
        });
    }
    
    // 精度评定
    if (calculationResults.accuracy) {
        data.push([]);
        data.push(['精度评定']);
        const accuracy = calculationResults.accuracy;
        
        if (accuracy.rmsError !== undefined) {
            data.push(['均方根误差(m)', accuracy.rmsError.toFixed(4)]);
        }
        if (accuracy.maxResidual !== undefined) {
            data.push(['最大残差(m)', accuracy.maxResidual.toFixed(4)]);
        }
        if (accuracy.meanResidual !== undefined) {
            data.push(['平均残差(m)', accuracy.meanResidual.toFixed(4)]);
        }
        if (accuracy.unitWeightError !== undefined) {
            data.push(['单位权中误差(m)', accuracy.unitWeightError.toFixed(4)]);
        }
    }
    
    return data;
}

function convertToCSV(data) {
    return data.map(row => 
        row.map(cell => 
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
                ? `"${cell.replace(/"/g, '""')}"` 
                : cell
        ).join(',')
    ).join('\n');
}

function downloadFile(content, filename, mimeType) {
    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

function drawGrid(ctx, width, height) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    
    // 绘制垂直线
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function drawPoints(ctx, results) {
    // 绘制已知点（红色）
    ctx.fillStyle = '#e74c3c';
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    
    const knownPoints = collectTableData('known');
    knownPoints.forEach((point, index) => {
        const x = 100 + index * 50;
        const y = 100 + Math.random() * 200;
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 绘制点名
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.fillText(point.name, x + 10, y - 10);
        ctx.fillStyle = '#e74c3c';
    });
    
    // 绘制未知点（蓝色）
    ctx.fillStyle = '#3498db';
    ctx.strokeStyle = '#2980b9';
    
    const unknownPoints = collectTableData('unknown');
    unknownPoints.forEach((point, index) => {
        const x = 150 + index * 50;
        const y = 300 + Math.random() * 200;
        
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x - 5, y + 6);
        ctx.lineTo(x + 5, y + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 绘制点名
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.fillText(point.name, x + 10, y - 10);
        ctx.fillStyle = '#3498db';
    });
}

// 初始化默认设置
function initializeDefaultSettings() {
    // 从本地存储加载设置
    const savedSettings = localStorage.getItem('gpsCalculationSettings');
    if (savedSettings) {
        try {
            calculationSettings = JSON.parse(savedSettings);
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
    
    // 设置默认值
    Object.keys(FUNCTION_CONFIG).forEach(func => {
        if (!calculationSettings[func]) {
            calculationSettings[func] = getDefaultSettings(func);
        }
    });
}

function getDefaultSettings(func) {
    const defaultSettings = {
        coordinate_decimals: 3,
        coordinate_system: 'WGS84'
    };
    
    if (func === 'linearFitting') {
        defaultSettings.central_meridian_type = 'auto';
        defaultSettings.compensation_height_type = 'auto';
        defaultSettings.centerline_origin_type = 'auto';
        defaultSettings.fitting_model = 'quadratic';
    } else if (func === 'surfaceFitting') {
        defaultSettings.reference_point_type = 'auto';
        defaultSettings.surface_model = 'quadratic';
    }
    
    return defaultSettings;
}

// 模态框操作
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function showHelp(func) {
    const helpContent = {
        verticalTranslation: '垂直平移模型通过计算已知GPS水准点的平均高程异常来转换未知点的大地高为正常高。适用于小范围、高程异常变化平缓的区域。',
        linearFitting: '线性基函数拟合建立独立线路坐标系，支持直线和二次曲线模型，适用于铁路、公路等线性工程的GPS高程转换。',
        surfaceFitting: '面基函数拟合支持平面和二次曲面模型，通过设置参考点来适配大面积、地形略有起伏的面状区域。'
    };
    
    alert(helpContent[func] || '帮助信息暂未提供');
}

// 工具函数 - 使用统一通知系统
function showMessage(message, type = 'info') {
    if (window.notificationSystem) {
        window.notificationSystem.show(message, type);
    } else {
        // 降级方案
        console.log(`💬 ${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

function showLoading(show) {
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        if (show) {
            calculateBtn.innerHTML = '<span class="loading"></span> 计算中...';
            calculateBtn.disabled = true;
        } else {
            calculateBtn.innerHTML = '<i class="fas fa-play"></i> 开始计算';
            calculateBtn.disabled = false;
        }
    }
}

// 导出全局函数供HTML调用
window.switchFunction = switchFunction;
window.openCalculationSettings = openCalculationSettings;
window.closeModal = closeModal;
window.showHelp = showHelp;
