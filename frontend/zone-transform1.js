// 换带与投影面变换1 (xy → xy)模块 - 修复版本
console.log('🔧 加载换带与投影面变换1模块...');

// 全局设置对象
let zoneTransform1Settings = {
    sourceZone: 20,
    targetZone: 21,
    ellipsoid: 'CGCS2000',
    semiMajor: 6378137,
    flattening: 298.257222101,
    coordDecimals: 3
};

// 初始化换带与投影面变换1功能
function initializeZoneTransform1() {
    console.log('🚀 初始化换带与投影面变换1功能...');
    
    setTimeout(() => {
        console.log('📋 开始初始化表格...');
        initializeZoneTransform1Table();
        
        console.log('🔗 开始绑定事件...');
        bindZoneTransform1Events();
        
        console.log('✅ 换带与投影面变换1模块初始化完成');
    }, 100);
}

// 初始化换带与投影面变换1表格
function initializeZoneTransform1Table() {
    const tbody = document.getElementById('zone_transform_1-table-body'); // 修复ID匹配
    if (!tbody) {
        console.error('✗ 找不到换带与投影面变换1表格体');
        return;
    }
    
    tbody.innerHTML = '';
    
    // 添加5行默认数据
    for (let i = 1; i <= 5; i++) {
        addZoneTransform1Row();
    }
    
    console.log('✅ 换带与投影面变换1表格初始化完成，添加了5行');
}

// 添加换带与投影面变换1行
function addZoneTransform1Row(data = {}) {
    const tbody = document.getElementById('zone_transform_1-table-body'); // 修复ID匹配
    if (!tbody) return;
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td><input type="text" class="point-name param-input" value="${data.name || 'P' + rowCount.toString().padStart(2, '0')}" placeholder="点名"></td>
        <td><input type="number" class="x-input param-input" value="${data.x || ''}" placeholder="X坐标(m)" step="0.001"></td>
        <td><input type="number" class="y-input param-input" value="${data.y || ''}" placeholder="Y坐标(m)" step="0.001"></td>
        <td><span class="result-new-x result-value">-</span></td>
        <td><span class="result-new-y result-value">-</span></td>
        <td><input type="text" class="remark param-input" value="${data.remark || ''}" placeholder="备注"></td>
    `;
    
    tbody.appendChild(row);
}

// 绑定换带与投影面变换1事件
function bindZoneTransform1Events() {
    console.log('🔗 绑定换带与投影面变换1事件...');
    
    const zoneContent = document.getElementById('zone_transform_1-content'); // 修复ID匹配
    if (!zoneContent) {
        console.error('✗ 找不到换带与投影面变换1内容区域');
        return;
    }
    
    // 导入按钮
    const importBtn = zoneContent.querySelector('[data-action="import-data"]');
    if (importBtn) {
        console.log('✓ 找到导入按钮，绑定事件');
        importBtn.removeAttribute('data-action');
        importBtn.setAttribute('data-zone1-action', 'import-data');
        
        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入数据按钮');
            openZoneTransform1ImportDialog();
        });
    } else {
        console.error('✗ 找不到导入按钮');
    }
    
    // 计算方案按钮
    const settingsBtn = zoneContent.querySelector('[data-action="settings"]');
    if (settingsBtn) {
        console.log('✓ 找到计算方案按钮，绑定事件');
        settingsBtn.removeAttribute('data-action');
        settingsBtn.setAttribute('data-zone1-action', 'settings');
        
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ 点击计算方案按钮');
            openZoneTransform1Settings();
        });
    } else {
        console.error('✗ 找不到计算方案按钮');
    }
    
    // 计算按钮
    const calculateBtn = zoneContent.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        console.log('✓ 找到计算按钮，绑定事件');
        calculateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🧮 点击开始计算按钮');
            performZoneTransform1Calculation();
        });
    } else {
        console.error('✗ 找不到计算按钮');
    }
    
    // 导出按钮
    const exportBtn = zoneContent.querySelector('[data-action="export-result"]');
    if (exportBtn) {
        console.log('✓ 找到导出按钮，绑定事件');
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📤 点击导出结果按钮');
            showZoneTransform1ExportDialog();
        });
    } else {
        console.error('✗ 找不到导出按钮');
    }
    
    // 绑定模态框关闭按钮事件（扩展至设置模态框）
    const modalCloseBtns = document.querySelectorAll('#zoneTransform1ImportModal .modal-close, #zoneTransform1SettingsModal .modal-close');
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 绑定设置模态框外部点击关闭事件
    const settingsModal = document.getElementById('zoneTransform1SettingsModal');
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }
}

// 打开导入对话框
function openZoneTransform1ImportDialog() {
    console.log('📥 打开换带与投影面变换1导入对话框');
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.dat,.csv';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`📁 选择文件: ${file.name}`);
            handleZoneTransform1FileImport(file);
        }
        document.body.removeChild(fileInput);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// 处理文件导入
function handleZoneTransform1FileImport(file) {
    console.log('📥 处理文件导入...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log('📄 文件内容长度:', content.length);
            
            const data = parseZoneTransform1FileContent(content);
            console.log('📊 解析后的数据:', data);
            
            if (data.length === 0) {
                showMessage('文件中没有有效数据。请确保文件格式正确：点名 X坐标 Y坐标', 'warning');
                return;
            }
            
            importZoneTransform1Data(data);
        } catch (error) {
            console.error('❌ 文件解析错误:', error);
            showMessage('文件格式错误: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file, 'utf-8');
}

// 解析文件内容
function parseZoneTransform1FileContent(content) {
    console.log('🔍 解析文件内容...');
    
    const lines = content.split('\n').filter(line => line.trim());
    const data = [];
    
    lines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
            const name = parts[0];
            const xStr = parts[1];
            const yStr = parts[2];
            
            const x = parseFloat(xStr);
            const y = parseFloat(yStr);
            
            if (!isNaN(x) && !isNaN(y)) {
                data.push({
                    name: name,
                    x: x,
                    y: y
                });
                console.log(`✓ 第 ${index + 1} 行: ${name} ${x} ${y}`);
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行格式错误: ${line}`);
            }
        }
    });
    
    console.log(`📊 解析完成，共 ${data.length} 个有效数据点`);
    return data;
}

// 导入数据到表格
function importZoneTransform1Data(data) {
    console.log('📥 导入数据到表格...');
    
    const tbody = document.getElementById('zone_transform_1-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
        addZoneTransform1Row({
            name: item.name,
            x: item.x,
            y: item.y
        });
    });
    
    while (tbody.children.length < Math.max(5, data.length)) {
        addZoneTransform1Row();
    }
    
    showMessage(`✅ 成功导入 ${data.length} 个点的数据`, 'success');
    console.log(`✅ 导入完成，表格共 ${tbody.children.length} 行`);
}

// 打开计算方案设置
function openZoneTransform1Settings() {
    console.log('⚙️ 打开换带与投影面变换1计算方案设置');
    
    // 打开设置模态框
    const modal = document.getElementById('zoneTransform1SettingsModal');
    if (modal) {
        modal.style.display = 'block';
        loadZoneTransform1SettingsToForm();
    } else {
        console.error('未找到换带与投影面变换1设置模态框');
    }
}

// 将设置加载到表单
function loadZoneTransform1SettingsToForm() {
    document.getElementById('zone1-source-zone').value = zoneTransform1Settings.sourceZone;
    document.getElementById('zone1-target-zone').value = zoneTransform1Settings.targetZone;
    document.getElementById('zone1-ellipsoid').value = zoneTransform1Settings.ellipsoid;
    document.getElementById('zone1-semi-major').value = zoneTransform1Settings.semiMajor;
    document.getElementById('zone1-flattening').value = zoneTransform1Settings.flattening;
    document.getElementById('zone1-coord-decimals').value = zoneTransform1Settings.coordDecimals;
}

// 保存换带与投影面变换1设置
function saveZoneTransform1Settings() {
    // 获取表单值
    zoneTransform1Settings.sourceZone = parseInt(document.getElementById('zone1-source-zone').value);
    zoneTransform1Settings.targetZone = parseInt(document.getElementById('zone1-target-zone').value);
    zoneTransform1Settings.ellipsoid = document.getElementById('zone1-ellipsoid').value;
    zoneTransform1Settings.semiMajor = parseFloat(document.getElementById('zone1-semi-major').value);
    zoneTransform1Settings.flattening = parseFloat(document.getElementById('zone1-flattening').value);
    zoneTransform1Settings.coordDecimals = parseInt(document.getElementById('zone1-coord-decimals').value);
    
    // 关闭模态框
    closeModal('zoneTransform1SettingsModal');
    
    // 更新参数显示
    updateZoneTransform1ParametersDisplay();
    
    showMessage('换带与投影面变换1设置已保存', 'success');
}

// 更新参数显示
function updateZoneTransform1ParametersDisplay() {
    const displayElement = document.querySelector('#zone-transform1 .parameters-display');
    if (displayElement) {
        displayElement.innerHTML = `
            <div>源投影带: ${zoneTransform1Settings.sourceZone}</div>
            <div>目标投影带: ${zoneTransform1Settings.targetZone}</div>
            <div>坐标系: ${zoneTransform1Settings.ellipsoid}</div>
            <div>坐标小数位: ${zoneTransform1Settings.coordDecimals}</div>
        `;
    }
}

// 执行换带与投影面变换1计算
function performZoneTransform1Calculation() {
    console.log('🧮 开始执行换带与投影面变换1计算');
    
    const data = collectZoneTransform1Data();
    if (!data || data.length === 0) {
        showMessage('请先输入坐标数据。格式示例：X坐标 4380123.456 Y坐标 20654321.789', 'warning');
        return;
    }
    
    console.log('📊 开始计算，数据:', data);
    showZoneTransform1Loading(true);
    
    // 确定变换类型：如果源带号 < 目标带号，则是3度带转6度带，否则是6度带转3度带
    const transformType = zoneTransform1Settings.sourceZone < zoneTransform1Settings.targetZone ? '3to6' : '6to3';
    
    const requestData = {
        points: data.map(point => ({
            name: point.name,
            x: point.x,
            y: point.y,
            zone: zoneTransform1Settings.sourceZone
        })),
        type: transformType
    };
    
    console.log('📤 发送请求数据:', requestData);
    
    fetch('http://127.0.0.1:5000/api/zone-transform', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('📥 响应状态:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('📊 计算结果:', result);
        showZoneTransform1Loading(false);
        if (result.success) {
            displayZoneTransform1Results(result.data);
            showMessage('换带与投影面变换1计算完成', 'success');
        } else {
            console.error('❌ 计算失败:', result.error);
            showMessage('计算失败: ' + result.error, 'error');
        }
    })
    .catch(error => {
        showZoneTransform1Loading(false);
        console.error('❌ 计算错误:', error);
        showMessage('计算过程中发生错误: ' + error.message, 'error');
    });
}

// 收集换带与投影面变换1数据
function collectZoneTransform1Data() {
    console.log('📊 收集换带与投影面变换1数据...');
    
    const tbody = document.getElementById('zone_transform_1-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return [];
    }
    
    const data = [];
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 检查 ${rows.length} 行数据...`);
    
    rows.forEach((row, index) => {
        const pointName = row.querySelector('.point-name')?.value.trim();
        const xInput = row.querySelector('.x-input')?.value.trim();  // 使用正确的类名
        const yInput = row.querySelector('.y-input')?.value.trim();  // 使用正确的类名
        
        console.log(`第 ${index + 1} 行: 点名="${pointName}", X="${xInput}", Y="${yInput}"`);
        
        if (pointName && xInput && yInput) {
            const x = parseFloat(xInput);
            const y = parseFloat(yInput);
            
            console.log(`解析结果: X=${x}, Y=${y}`);
            
            if (!isNaN(x) && !isNaN(y)) {
                data.push({
                    name: pointName,
                    x: x,
                    y: y
                });
                console.log(`✓ 第 ${index + 1} 行数据有效`);
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行坐标解析失败`);
            }
        } else {
            console.log(`- 第 ${index + 1} 行数据不完整，跳过`);
        }
    });
    
    console.log(`📊 收集到 ${data.length} 个有效数据点`);
    return data;
}

// 显示换带与投影面变换1结果
function displayZoneTransform1Results(results) {
    console.log('📊 显示计算结果...');
    
    if (!results || !Array.isArray(results)) {
        showMessage('计算结果格式错误', 'error');
        return;
    }
    
    const tbody = document.getElementById('zone_transform_1-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 显示结果，结果数量: ${results.length}, 表格行数: ${rows.length}`);
    
    try {
        results.forEach((result, index) => {
            if (index < rows.length) {
                const row = rows[index];
                
                // 使用类选择器找到结果显示元素（与高斯投影反算模块类似）
                const newXElement = row.querySelector('.result-new-x');
                const newYElement = row.querySelector('.result-new-y');
                
                if (newXElement && result.output_x !== undefined && result.output_x !== null) {
                    newXElement.textContent = parseFloat(result.output_x).toFixed(zoneTransform1Settings.coordDecimals);
                }
                if (newYElement && result.output_y !== undefined && result.output_y !== null) {
                    newYElement.textContent = parseFloat(result.output_y).toFixed(zoneTransform1Settings.coordDecimals);
                }
            }
        });
        
        console.log('✅ 换带与投影面变换1结果显示完成');
    } catch (error) {
        console.error('显示结果时出错:', error);
        showMessage('显示结果时出错: ' + error.message, 'error');
    }
}

// 显示加载状态
function showZoneTransform1Loading(show) {
    const zoneContent = document.getElementById('zone_transform_1-content');
    const calculateBtn = zoneContent?.querySelector('[data-action="calculate"]');
    
    if (calculateBtn) {
        calculateBtn.disabled = show;
        const icon = calculateBtn.querySelector('i');
        const text = show ? '计算中...' : '开始计算';
        calculateBtn.innerHTML = `${icon ? icon.outerHTML : '<i class="fas fa-calculator"></i>'} ${text}`;
    }
}

// 显示导出对话框
function showZoneTransform1ExportDialog() {
    console.log('📤 显示换带与投影面变换1导出对话框');
    
    const tbody = document.getElementById('zone_transform_1-table-body');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    
    rows.forEach(row => {
        const newXResult = row.querySelector('.result-new-x')?.textContent;
        const newYResult = row.querySelector('.result-new-y')?.textContent;
        if (newXResult && newYResult && newXResult !== '-' && newYResult !== '-') {
            hasResults = true;
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    showMessage('换带与投影面变换1结果导出功能', 'info');
}

// 显示消息 - 使用统一通知系统
function showMessage(message, type = 'info') {
    if (window.notificationSystem) {
        window.notificationSystem.show(message, type);
    } else if (window.showMessage) {
        window.showMessage(message, type);
    } else {
        console.log(`💬 ${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

// 显示换带与投影面变换1导出对话框
function showZoneTransform1ExportDialog() {
    console.log('📤 显示换带与投影面变换1导出对话框...');
    
    // 检查是否有计算结果
    const tbody = document.getElementById('zone_transform_1-table-body');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    
    rows.forEach(row => {
        const newXResult = row.querySelector('.result-new-x')?.textContent;
        const newYResult = row.querySelector('.result-new-y')?.textContent;
        if (newXResult && newYResult && newXResult !== '-' && newYResult !== '-') {
            hasResults = true;
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    // 检查是否已存在导出模态框
    let modal = document.getElementById('zoneTransform1ExportModal');
    if (!modal) {
        createZoneTransform1ExportModal();
        modal = document.getElementById('zoneTransform1ExportModal');
    }
    
    // 设置默认文件名
    const projectName = document.querySelector('#zone_transform_1-content .project-name-input')?.value || '工程测量';
    const fileName = `${projectName}_换带与投影面变换1结果`;
    document.getElementById('zoneTransform1ExportFileName').value = fileName;
    
    // 显示模态框
    modal.style.display = 'block';
}

// 创建换带与投影面变换1导出模态框
function createZoneTransform1ExportModal() {
    const modalHTML = `
        <div class="modal" id="zoneTransform1ExportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>换带与投影面变换1结果导出</h3>
                    <span class="close" onclick="closeModal('zoneTransform1ExportModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="export-section">
                        <h4>导出格式</h4>
                        <div class="format-grid">
                            <label class="format-option">
                                <input type="radio" name="zoneTransform1ExportFormat" value="txt" checked>
                                <span class="format-label">
                                    <i class="fas fa-file-alt"></i>
                                    <strong>TXT文本</strong>
                                    <small>纯文本格式，通用性强</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="zoneTransform1ExportFormat" value="dat">
                                <span class="format-label">
                                    <i class="fas fa-database"></i>
                                    <strong>DAT数据</strong>
                                    <small>逗号分隔格式，便于数据处理</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="zoneTransform1ExportFormat" value="excel">
                                <span class="format-label">
                                    <i class="fas fa-file-excel"></i>
                                    <strong>Excel表格</strong>
                                    <small>电子表格格式，便于编辑</small>
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h4>导出设置</h4>
                        <div class="form-group">
                            <label>文件名：</label>
                            <input type="text" id="zoneTransform1ExportFileName" class="form-input" placeholder="请输入文件名">
                            <label class="checkbox-label">
                                <input type="checkbox" id="zoneTransform1IncludeTimestamp" checked>
                                添加时间戳
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label>坐标小数位：</label>
                            <select id="zoneTransform1DecimalPlaces" class="form-select">
                                <option value="0">0位</option>
                                <option value="1">1位</option>
                                <option value="2">2位</option>
                                <option value="3" selected>3位</option>
                                <option value="4">4位</option>
                                <option value="5">5位</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h4>导出内容</h4>
                        <div class="content-options">
                            <label class="checkbox-label">
                                <input type="checkbox" id="zoneTransform1IncludeProjectInfo" checked>
                                项目信息
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="zoneTransform1IncludeParameters" checked>
                                计算参数
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="zoneTransform1IncludeInputData" checked>
                                输入数据
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="zoneTransform1IncludeResults" checked>
                                计算结果
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('zoneTransform1ExportModal')">取消</button>
                    <button class="btn btn-primary" onclick="performZoneTransform1Export()">导出</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 执行换带与投影面变换1导出
function performZoneTransform1Export() {
    try {
        // 获取导出设置
        const format = document.querySelector('input[name="zoneTransform1ExportFormat"]:checked').value;
        const fileName = document.getElementById('zoneTransform1ExportFileName').value || '换带与投影面变换1结果';
        const includeTimestamp = document.getElementById('zoneTransform1IncludeTimestamp').checked;
        const decimalPlaces = parseInt(document.getElementById('zoneTransform1DecimalPlaces').value);

        // 获取导出内容选项
        const contentOptions = {
            parameters: document.getElementById('zoneTransform1IncludeParameters').checked,
            inputData: document.getElementById('zoneTransform1IncludeInputData').checked,
            results: document.getElementById('zoneTransform1IncludeResults').checked,
            projectInfo: document.getElementById('zoneTransform1IncludeProjectInfo').checked
        };

        // 生成最终文件名
        let finalFileName = fileName;
        if (includeTimestamp) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            finalFileName += `_${timestamp}`;
        }

        // 根据格式执行导出
        switch (format) {
            case 'txt':
                exportZoneTransform1ToTxt(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'dat':
                exportZoneTransform1ToDat(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'excel':
                exportZoneTransform1ToExcel(finalFileName, contentOptions, decimalPlaces);
                break;
            default:
                throw new Error('不支持的导出格式: ' + format);
        }
        
        // 关闭模态框
        closeModal('zoneTransform1ExportModal');
        showMessage('导出成功！', 'success');
        
    } catch (error) {
        console.error('❌ 导出错误:', error);
        showMessage('导出失败: ' + error.message, 'error');
    }
}

// 收集换带与投影面变换1导出数据
function collectZoneTransform1ExportData(contentOptions, decimalPlaces) {
    const data = {
        projectInfo: {},
        inputData: [],
        results: [],
        parameters: {}
    };

    // 项目信息
    if (contentOptions.projectInfo) {
        data.projectInfo = {
            projectName: document.querySelector('#zone_transform_1-content .project-name-input')?.value || '',
            functionName: '换带与投影面变换1(xy → xy)',
            calcDate: document.getElementById('calcDate')?.value || new Date().toISOString().slice(0, 10),
            calculator: document.getElementById('calculator')?.value || '',
            checker: document.getElementById('checker')?.value || '',
            exportTime: new Date().toLocaleString('zh-CN')
        };
    }

    // 计算参数
    if (contentOptions.parameters) {
        data.parameters = {
            sourceZone: zoneTransform1Settings.sourceZone,
            targetZone: zoneTransform1Settings.targetZone,
            ellipsoid: zoneTransform1Settings.ellipsoid,
            coordDecimals: zoneTransform1Settings.coordDecimals
        };
    }

    // 输入数据和结果
    const tbody = document.getElementById('zone_transform_1-table-body');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const pointName = row.querySelector('.point-name')?.value.trim();
            const inputX = row.querySelector('.input-x')?.value;
            const inputY = row.querySelector('.input-y')?.value;
            const newX = row.querySelector('.result-new-x')?.textContent;
            const newY = row.querySelector('.result-new-y')?.textContent;
            
            if (pointName && inputX && inputY) {
                if (contentOptions.inputData) {
                    data.inputData.push({
                        pointName: pointName,
                        x: parseFloat(inputX) || 0,
                        y: parseFloat(inputY) || 0
                    });
                }
                
                if (contentOptions.results && newX && newY && newX !== '-' && newY !== '-') {
                    data.results.push({
                        pointName: pointName,
                        newX: parseFloat(newX) || 0,
                        newY: parseFloat(newY) || 0
                    });
                }
            }
        });
    }

    return data;
}

// 导出为TXT格式
function exportZoneTransform1ToTxt(fileName, contentOptions, decimalPlaces) {
    const data = collectZoneTransform1ExportData(contentOptions, decimalPlaces);
    let content = '';

    // 项目信息
    if (contentOptions.projectInfo && data.projectInfo) {
        content += '='.repeat(60) + '\n';
        content += '                换带与投影面变换1计算结果报告\n';
        content += '='.repeat(60) + '\n\n';
        content += `项目名称: ${data.projectInfo.projectName}\n`;
        content += `计算功能: ${data.projectInfo.functionName}\n`;
        content += `计算日期: ${data.projectInfo.calcDate}\n`;
        content += `计算员: ${data.projectInfo.calculator}\n`;
        content += `复核员: ${data.projectInfo.checker}\n`;
        content += `导出时间: ${data.projectInfo.exportTime}\n\n`;
    }

    // 计算参数
    if (contentOptions.parameters && data.parameters) {
        content += '-'.repeat(60) + '\n';
        content += '计算参数\n';
        content += '-'.repeat(60) + '\n';
        content += `椭球类型: ${data.parameters.ellipsoid}\n`;
        content += `源投影带: ${data.parameters.sourceZone}带\n`;
        content += `目标投影带: ${data.parameters.targetZone}带\n`;
        content += `坐标小数位: ${data.parameters.coordDecimals}位\n\n`;
    }

    // 输入数据
    if (contentOptions.inputData && data.inputData.length > 0) {
        content += '-'.repeat(60) + '\n';
        content += '输入数据\n';
        content += '-'.repeat(60) + '\n';
        content += `序号    点名        源X坐标(m)        源Y坐标(m)\n`;
        data.inputData.forEach((item, index) => {
            content += `${(index + 1).toString().padStart(4)}    ${item.pointName.padEnd(10)} ${item.x.toFixed(decimalPlaces).padStart(15)} ${item.y.toFixed(decimalPlaces).padStart(15)}\n`;
        });
        content += '\n';
    }

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        content += '-'.repeat(60) + '\n';
        content += '计算结果\n';
        content += '-'.repeat(60) + '\n';
        content += `序号    点名        新X坐标(m)        新Y坐标(m)\n`;
        data.results.forEach((item, index) => {
            content += `${(index + 1).toString().padStart(4)}    ${item.pointName.padEnd(10)} ${item.newX.toFixed(decimalPlaces).padStart(15)} ${item.newY.toFixed(decimalPlaces).padStart(15)}\n`;
        });
    }

    // 创建并下载文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导出为DAT格式
function exportZoneTransform1ToDat(fileName, contentOptions, decimalPlaces) {
    const data = collectZoneTransform1ExportData(contentOptions, decimalPlaces);
    let content = '';

    // 项目信息（作为注释）
    if (contentOptions.projectInfo && data.projectInfo) {
        content += `# 项目名称: ${data.projectInfo.projectName}\n`;
        content += `# 计算功能: ${data.projectInfo.functionName}\n`;
        content += `# 计算日期: ${data.projectInfo.calcDate}\n`;
        content += `# 计算员: ${data.projectInfo.calculator}\n`;
        content += `# 复核员: ${data.projectInfo.checker}\n`;
        content += `# 导出时间: ${data.projectInfo.exportTime}\n`;
        content += `# 源投影带: ${data.parameters.sourceZone}带\n`;
        content += `# 目标投影带: ${data.parameters.targetZone}带\n`;
        content += `# 椭球类型: ${data.parameters.ellipsoid}\n`;
        content += '#\n';
    }

    // 数据标题行
    if (contentOptions.results && data.results.length > 0) {
        content += '点名,源X坐标(m),源Y坐标(m),新X坐标(m),新Y坐标(m)\n';
        
        data.results.forEach((result, index) => {
            const inputItem = data.inputData[index];
            if (inputItem) {
                content += `${result.pointName},${inputItem.x.toFixed(decimalPlaces)},${inputItem.y.toFixed(decimalPlaces)},${result.newX.toFixed(decimalPlaces)},${result.newY.toFixed(decimalPlaces)}\n`;
            }
        });
    }

    // 创建并下载文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + '.dat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导出为Excel格式
function exportZoneTransform1ToExcel(fileName, contentOptions, decimalPlaces) {
    const data = collectZoneTransform1ExportData(contentOptions, decimalPlaces);
    let htmlContent = `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .title { font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
                .section { margin: 20px 0; }
            </style>
        </head>
        <body>
    `;

    // 标题
    htmlContent += `<div class="title">换带与投影面变换1计算结果</div>`;

    // 项目信息
    if (contentOptions.projectInfo) {
        htmlContent += `
            <table>
                <tr><td>项目名称</td><td>${data.projectInfo?.projectName || ''}</td></tr>
                <tr><td>计算功能</td><td>${data.projectInfo?.functionName || ''}</td></tr>
                <tr><td>计算日期</td><td>${data.projectInfo?.calcDate || ''}</td></tr>
                <tr><td>计算员</td><td>${data.projectInfo?.calculator || ''}</td></tr>
                <tr><td>复核员</td><td>${data.projectInfo?.checker || ''}</td></tr>
            </table>
        `;
    }

    // 计算参数
    if (contentOptions.parameters) {
        htmlContent += `
            <table>
                <tr><td>椭球类型</td><td>${data.parameters?.ellipsoid || ''}</td></tr>
                <tr><td>源投影带</td><td>${data.parameters?.sourceZone || ''}带</td></tr>
                <tr><td>目标投影带</td><td>${data.parameters?.targetZone || ''}带</td></tr>
                <tr><td>坐标小数位</td><td>${data.parameters?.coordDecimals || ''}位</td></tr>
            </table>
        `;
    }

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        htmlContent += `
            <table>
                <thead>
                    <tr>
                        <th>点名</th>
                        <th>源X坐标(m)</th>
                        <th>源Y坐标(m)</th>
                        <th>新X坐标(m)</th>
                        <th>新Y坐标(m)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.results.forEach((result, index) => {
            const inputItem = data.inputData[index];
            if (inputItem) {
                htmlContent += `
                    <tr>
                        <td>${result.pointName}</td>
                        <td>${inputItem.x.toFixed(decimalPlaces)}</td>
                        <td>${inputItem.y.toFixed(decimalPlaces)}</td>
                        <td>${result.newX.toFixed(decimalPlaces)}</td>
                        <td>${result.newY.toFixed(decimalPlaces)}</td>
                    </tr>
                `;
            }
        });
        
        htmlContent += '</tbody></table>';
    }

    htmlContent += '</body></html>';

    // 创建并下载文件
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导出全局函数
window.initializeZoneTransform1 = initializeZoneTransform1;
window.bindZoneTransform1Events = bindZoneTransform1Events;
window.performZoneTransform1Calculation = performZoneTransform1Calculation;
window.showZoneTransform1ExportDialog = showZoneTransform1ExportDialog;
window.importZoneTransform1Data = importZoneTransform1Data;

console.log('✅ 换带与投影面变换1模块加载完成');