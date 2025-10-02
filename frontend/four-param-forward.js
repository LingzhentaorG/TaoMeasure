// 四参数坐标转换正算模块 - 完整版本
console.log('🔧 加载四参数坐标转换正算模块...');

// 全局设置对象
let fourParamForwardSettings = {
    deltaX: 0,
    deltaY: 0,
    rotation: 0,
    scale: 1,
    coordDecimals: 3
};

// 初始化四参数坐标转换正算功能
function initializeFourParamForward() {
    console.log('🚀 初始化四参数坐标转换正算功能...');
    
    setTimeout(() => {
        console.log('📋 开始初始化表格...');
        initializeFourParamForwardTable();
        
        console.log('📋 开始初始化公共点表格');
        initializeCommonPointsTable();
        
        console.log('🔗 开始绑定事件...');
        bindFourParamForwardEvents();
        
        console.log('✅ 四参数坐标转换正算模块初始化完成');
    }, 100);
}

// 初始化四参数坐标转换正算表格
function initializeFourParamForwardTable() {
    const tbody = document.getElementById('four_param_forward-table-body');
    if (!tbody) {
        console.error('✗ 找不到四参数坐标转换正算表格体');
        return;
    }
    
    tbody.innerHTML = '';
    
    // 添加5行默认数据
    for (let i = 1; i <= 5; i++) {
        addFourParamForwardRow();
    }
    
    console.log('✅ 四参数坐标转换正算表格初始化完成，添加了5行');
}

// 添加四参数坐标转换正算行
function addFourParamForwardRow(data = {}) {
    const tbody = document.getElementById('four_param_forward-table-body');
    if (!tbody) return;
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="text" class="table-input" value="${data.name || 'P' + String(rowCount).padStart(3, '0')}" placeholder="点名"></td>
        <td><input type="number" class="table-input" value="${data.x || ''}" placeholder="X坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.y || ''}" placeholder="Y坐标(m)" step="0.001"></td>
        
        <td><span class="result-transformed-x result-value">${data.newX || '-'}</span></td>
        <td><span class="result-transformed-y result-value">${data.newY || '-'}</span></td>
        <td><span class="result-delta-x result-value">${data.deltaX || '-'}</span></td>
        <td><span class="result-delta-y result-value">${data.deltaY || '-'}</span></td>
        
    `;
    
    tbody.appendChild(row);
}

// 绑定四参数坐标转换正算事件
function bindFourParamForwardEvents() {
    console.log('🔗 绑定四参数坐标转换正算事件...');
    
    const fourParamContent = document.getElementById('four_param_forward-content');
    if (!fourParamContent) {
        console.error('✗ 找不到四参数坐标转换正算内容区域');
        return;
    }
    
    // 导入按钮
    const importBtn = fourParamContent.querySelector('[data-action="import-data"]');
    if (importBtn) {
        console.log('✓ 找到导入按钮，绑定事件');
        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入数据按钮');
            openFourParamForwardImportDialog();
        });
    }
    
    // 导入公共点按钮
    const importCommonBtn = fourParamContent.querySelector('[data-action="import-common-points"]');
    if (importCommonBtn) {
        console.log('✓ 找到导入公共点按钮，绑定事件');
        importCommonBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入公共点按钮');
            openFourParamForwardCommonPointsImportDialog();
        });
    }
    
    // 计算方案按钮
    const settingsBtn = fourParamContent.querySelector('[data-action="settings"]');
    if (settingsBtn) {
        console.log('✓ 找到计算方案按钮，绑定事件');
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ 点击计算方案按钮');
            openFourParamForwardSettings();
        });
    }
    
    // 计算按钮 - 注释掉直接事件绑定，使用coordinate-main.js的事件委托机制
    const calculateBtn = fourParamContent.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        console.log('✓ 找到计算按钮，事件绑定已由coordinate-main.js处理');
        // 注意：事件绑定由coordinate-main.js的事件委托机制处理
        // 不要在这里添加addEventListener，避免双重绑定
    }
    
    // 导出按钮
    const exportBtn = fourParamContent.querySelector('[data-action="export-result"]');
    if (exportBtn) {
        console.log('✓ 找到导出按钮，绑定事件');
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📤 点击导出结果按钮');
            showFourParamForwardExportDialog();
        });
    }
}

// 打开导入对话框
function openFourParamForwardImportDialog() {
    console.log('📥 打开四参数坐标转换正算导入对话框');
    
    const modal = document.getElementById('importModal');
    const titleEl = document.getElementById('importModalTitle');
    const formatInfoEl = modal.querySelector('.file-format-info');
    
    if (modal && titleEl && formatInfoEl) {
        titleEl.textContent = '导入数据 - 四参数坐标转换正算';
        modal.dataset.importType = 'four_param_forward';
        
        formatInfoEl.innerHTML = `
            <h4>文件格式说明:</h4>
            <p><strong>格式:</strong> 点名 X坐标(m) Y坐标(m)</p>
            <p><strong>示例:</strong></p>
            <pre>P01 4380123.456 20654321.789
P02 4380234.567 20654432.890
P03 4380345.678 20654543.901</pre>
        `;
        
        modal.style.display = 'block';
        modal.classList.add('show');
    }
}

// 打开公共点导入对话框
function openFourParamForwardCommonPointsImportDialog() {
    console.log('📥 打开四参数坐标转换正算公共点导入对话框');
    
    const modal = document.getElementById('importModal');
    const titleEl = document.getElementById('importModalTitle');
    const formatInfoEl = modal.querySelector('.file-format-info');
    
    if (modal && titleEl && formatInfoEl) {
        titleEl.textContent = '导入公共点 - 四参数坐标转换正算';
        modal.dataset.importType = 'four_param_forward_common_points';
        
        formatInfoEl.innerHTML = `
            <h4>文件格式说明:</h4>
            <p><strong>格式:</strong> 点名 源X坐标(m) 源Y坐标(m) 目标X坐标(m) 目标Y坐标(m)</p>
            <p><strong>示例:</strong></p>
            <pre>P01 4380123.456 20654321.789 4380223.456 20654421.789
P02 4380234.567 20654432.890 4380334.567 20654532.890</pre>
        `;
        
        modal.style.display = 'block';
        modal.classList.add('show');
    }
}

// DMS格式转换函数
function dmsToDecimal(dmsStr) {
    if (!dmsStr || dmsStr.trim() === '') return 0;
    
    // 如果已经是纯数字，直接返回
    const cleanStr = dmsStr.toString().trim();
    if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
        return parseFloat(cleanStr);
    }
    
    // 解析度分秒格式
    try {
        // 支持多种格式：39°54′15.12″ 或 39°54'15.12" 或 39度54分15.12秒
        let normalized = cleanStr
            .replace(/[°度]/g, ' ')
            .replace(/[′']/g, ' ')
            .replace(/[″"]/g, ' ')
            .replace(/分/g, ' ')
            .replace(/秒/g, ' ')
            .trim();
        
        const parts = normalized.split(/\s+/);
        if (parts.length === 0) return 0;
        
        const degrees = parseFloat(parts[0]);
        const minutes = parts.length > 1 ? parseFloat(parts[1]) : 0;
        const seconds = parts.length > 2 ? parseFloat(parts[2]) : 0;
        
        // 处理负角度
        const sign = degrees < 0 ? -1 : 1;
        const decimal = Math.abs(degrees) + minutes/60.0 + seconds/3600.0;
        return sign * decimal;
    } catch (e) {
        console.warn('DMS解析失败:', dmsStr, e);
        return 0;
    }
}

function decimalToDms(decimal) {
    if (isNaN(decimal)) return "0°00′00.000″";
    
    const sign = decimal < 0 ? "-" : "";
    decimal = Math.abs(decimal);
    
    const degrees = Math.floor(decimal);
    const minutesFloat = (decimal - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = (minutesFloat - minutes) * 60;
    
    return `${sign}${degrees}°${String(minutes).padStart(2, '0')}′${seconds.toFixed(3).padStart(6, '0')}″`;
}

// 打开计算方案设置
function openFourParamForwardSettings() {
    console.log('⚙️ 打开四参数坐标转换正算计算方案设置');
    
    // 创建设置对话框
    const settingsModal = document.createElement('div');
    settingsModal.className = 'modal';
    settingsModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>四参数坐标转换正算 - 计算方案设置</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>X平移参数 (ΔX):</label>
                    <input type="number" id="deltaXParam" value="${fourParamForwardSettings.deltaX}" step="0.001" placeholder="米">
                </div>
                <div class="form-group">
                    <label>Y平移参数 (ΔY):</label>
                    <input type="number" id="deltaYParam" value="${fourParamForwardSettings.deltaY}" step="0.001" placeholder="米">
                </div>
                <div class="form-group">
                    <label>旋转角 (α) - DMS格式:</label>
                    <input type="text" id="rotationDMSParam" value="${decimalToDms(fourParamForwardSettings.rotation * 180 / Math.PI)}" placeholder="例如: 1°30′15.123″">
                    <small style="color: #666;">支持格式：度°分′秒″ 或 十进制度</small>
                </div>
                <div class="form-group">
                    <label>尺度因子 (k):</label>
                    <input type="number" id="scaleParam" value="${fourParamForwardSettings.scale}" step="0.000001" placeholder="无量纲">
                </div>
                <div class="form-group">
                    <label>坐标小数位数:</label>
                    <input type="number" id="coordDecimalsFour" value="${fourParamForwardSettings.coordDecimals}" min="0" max="6">
                </div>
                <div class="form-group" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                    <label>由公共点解算参数：</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="file" id="commonPointsFile" accept=".txt,.csv" style="flex: 1;">
                        <button type="button" class="btn btn-info" onclick="calculateParamsFromCommonPoints()">解算参数</button>
                    </div>
                    <small style="color: #666;">文件格式：点名 源X 源Y 目标X 目标Y（空格分隔）</small>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeFourParamForwardSettings()">取消</button>
                <button type="button" class="btn btn-primary" onclick="saveFourParamForwardSettings()">确定</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(settingsModal);
    settingsModal.style.display = 'block';
    
    // 绑定关闭事件
    const closeBtn = settingsModal.querySelector('.close');
    closeBtn.onclick = () => closeFourParamForwardSettings();
    
    window.closeFourParamForwardSettings = () => {
        document.body.removeChild(settingsModal);
    };
    
    window.calculateParamsFromCommonPoints = () => {
        const fileInput = document.getElementById('commonPointsFile');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('请先选择公共点文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const lines = content.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    alert('至少需要2个公共点');
                    return;
                }
                
                const commonPoints = [];
                for (let line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5) {
                        commonPoints.push({
                            name: parts[0],
                            source_x: parseFloat(parts[1]),
                            source_y: parseFloat(parts[2]),
                            target_x: parseFloat(parts[3]),
                            target_y: parseFloat(parts[4])
                        });
                    }
                }
                
                if (commonPoints.length < 2) {
                    alert('至少需要2个有效的公共点');
                    return;
                }
                
                // 调用后端API计算四参数
                fetch('/api/four-parameter-transform', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        operation_type: 'calculate_params',
                        common_points: commonPoints
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const params = data.parameters;
                        document.getElementById('param-dx').textContent = params.dx.toFixed(4);
                        document.getElementById('param-dy').textContent = params.dy.toFixed(4);
                        document.getElementById('param-rotation').textContent = params.alpha.toFixed(8);
                        document.getElementById('param-scale').textContent = params.m.toFixed(8);
                        
                        showParamStatus('参数解算成功！', 'success');
                        
                        const settings = JSON.parse(localStorage.getItem('fourParamForwardSettings') || '{}');
                        settings.deltaX = params.dx;
                        settings.deltaY = params.dy;
                        settings.rotation = params.alpha;
                        settings.scale = params.m;
                        localStorage.setItem('fourParamForwardSettings', JSON.stringify(settings));
                        
                    } else {
                        showParamStatus('参数解算失败: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('参数解算错误:', error);
                    showParamStatus('参数解算失败: 网络错误', 'error');
                });
            } catch (error) {
                console.error('文件解析错误:', error);
                showParamStatus('文件解析失败: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    window.saveFourParamForwardSettings = () => {
        const dmsRotation = document.getElementById('rotationDMSParam').value.trim();
        const rotationDegrees = dmsToDecimal(dmsRotation);
        const rotationRadians = rotationDegrees * Math.PI / 180;
        
        fourParamForwardSettings.deltaX = parseFloat(document.getElementById('deltaXParam').value) || 0;
        fourParamForwardSettings.deltaY = parseFloat(document.getElementById('deltaYParam').value) || 0;
        fourParamForwardSettings.rotation = rotationRadians;
        fourParamForwardSettings.scale = parseFloat(document.getElementById('scaleParam').value) || 0;
        fourParamForwardSettings.coordDecimals = parseInt(document.getElementById('coordDecimalsFour').value) || 3;
        
        alert('设置已保存');
        closeFourParamForwardSettings();
    };
}

// 执行四参数坐标转换正算计算
function performFourParamForwardCalculation() {
    console.log('🧮 开始执行四参数坐标转换正算计算');
    
    const data = collectFourParamForwardData();
    if (!data || data.length === 0) {
        alert('请先输入坐标数据');
        return;
    }
    
    // 从localStorage获取最新的解算参数
    const savedSettings = JSON.parse(localStorage.getItem('fourParamForwardSettings') || '{}');
    
    // 合并解算参数到当前设置中
    const currentSettings = {
        deltaX: savedSettings.deltaX || fourParamForwardSettings.deltaX,
        deltaY: savedSettings.deltaY || fourParamForwardSettings.deltaY,
        rotation: savedSettings.rotation || fourParamForwardSettings.rotation,
        scale: savedSettings.scale || fourParamForwardSettings.scale,
        coordDecimals: fourParamForwardSettings.coordDecimals
    };
    
    showFourParamForwardLoading(true);
    
    const requestData = {
        operation: 'four_param_forward',
        points: data,
        settings: currentSettings
    };
    
    fetch('http://127.0.0.1:5000/api/four-param-transform', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('✅ 四参数坐标转换正算计算完成:', result);
        
        if (result.success) {
            displayFourParamForwardResults(result.results);
            alert('计算完成！');
        } else {
            alert('计算失败: ' + (result.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('❌ 四参数坐标转换正算计算失败:', error);
        alert('计算过程发生错误: ' + error.message);
    })
    .finally(() => {
        showFourParamForwardLoading(false);
    });
}

// 收集四参数坐标转换正算数据
function collectFourParamForwardData() {
    const tbody = document.getElementById('four_param_forward-table-body');
    if (!tbody) return [];
    
    const data = [];
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0]?.value?.trim();
        const x = parseFloat(inputs[1]?.value);
        const y = parseFloat(inputs[2]?.value);
        
        if (name && !isNaN(x) && !isNaN(y)) {
            data.push({
                name: name,
                x: x,
                y: y
            });
        }
    });
    
    return data;
}

// 显示四参数坐标转换正算结果
function displayFourParamForwardResults(results) {
    const tbody = document.getElementById('four_param_forward-table-body');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    results.forEach((result, index) => {
        if (index < rows.length) {
            const row = rows[index];
            
            // 更新转换后的坐标（使用span元素）
            const transformedXElement = row.querySelector('.result-transformed-x');
            const transformedYElement = row.querySelector('.result-transformed-y');
            
            if (transformedXElement) {
                transformedXElement.textContent = result.newX !== undefined && result.newX !== null 
                    ? parseFloat(result.newX).toFixed(fourParamForwardSettings.coordDecimals) 
                    : '-';
            }
            if (transformedYElement) {
                transformedYElement.textContent = result.newY !== undefined && result.newY !== null 
                    ? parseFloat(result.newY).toFixed(fourParamForwardSettings.coordDecimals) 
                    : '-';
            }
            
            // 更新坐标增量（使用span元素）
            const deltaXElement = row.querySelector('.result-delta-x');
            const deltaYElement = row.querySelector('.result-delta-y');
            
            if (deltaXElement) {
                deltaXElement.textContent = result.deltaX !== undefined && result.deltaX !== null 
                    ? parseFloat(result.deltaX).toFixed(fourParamForwardSettings.coordDecimals) + 'm' 
                    : '-';
            }
            if (deltaYElement) {
                deltaYElement.textContent = result.deltaY !== undefined && result.deltaY !== null 
                    ? parseFloat(result.deltaY).toFixed(fourParamForwardSettings.coordDecimals) + 'm' 
                    : '-';
            }
        }
    });
}

// 显示加载状态
function showFourParamForwardLoading(show) {
    const fourParamContent = document.getElementById('four_param_forward-content');
    const calculateBtn = fourParamContent?.querySelector('[data-action="calculate"]');
    
    if (calculateBtn) {
        if (show) {
            calculateBtn.disabled = true;
            calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 计算中...';
        } else {
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> 开始计算';
        }
    }
}

// 导入四参数坐标转换正算数据
function importFourParamForwardData(data) {
    console.log('📥 导入四参数坐标转换正算数据:', data);
    
    const tbody = document.getElementById('four_param_forward-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach(point => {
        addFourParamForwardRow(point);
    });
    
    while (tbody.children.length < 5) {
        addFourParamForwardRow();
    }
    
    console.log(`✅ 成功导入 ${data.length} 个点的数据`);
}

// 导入公共点数据
function importFourParamForwardCommonPointsData(data) {
    const tbody = document.getElementById('common-points-tbody');
    tbody.innerHTML = '';
    
    data.forEach((row, index) => {
        addCommonPointRow(row);
    });
    
    showParamStatus(`成功导入 ${data.length} 个公共点`, 'success');
}

// 添加公共点输入行
function addCommonPointRow(data = {}) {
    const tbody = document.getElementById('common-points-tbody');
    if (!tbody) return;
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="text" class="table-input" value="${data.name || 'P' + String(rowCount).padStart(3, '0')}" placeholder="点名"></td>
        <td><input type="number" class="table-input" value="${data.source_x || ''}" placeholder="源X坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.source_y || ''}" placeholder="源Y坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.target_x || ''}" placeholder="目标X坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.target_y || ''}" placeholder="目标Y坐标(m)" step="0.001"></td>
    `;
    
    tbody.appendChild(row);
}

// 初始化公共点表格
function initializeCommonPointsTable() {
    const tbody = document.getElementById('common-points-tbody');
    if (!tbody) {
        console.error('✗ 找不到公共点表格体');
        return;
    }
    
    tbody.innerHTML = '';
    
    // 添加3行可输入的预设行
    for (let i = 1; i <= 3; i++) {
        addCommonPointRow();
    }
    
    console.log('✅ 公共点表格初始化完成，添加了3行可输入行');
}

// 清空公共点
function clearCommonPoints() {
    const tbody = document.getElementById('common-points-tbody');
    tbody.innerHTML = '';
    clearParameterDisplay();
    
    // 重新添加3行预设输入行
    for (let i = 1; i <= 3; i++) {
        addCommonPointRow();
    }
    
    showParamStatus('公共点已清空，已重新添加预设行', 'info');
}

// 清空参数显示
function clearParameterDisplay() {
    document.getElementById('param-dx').textContent = '-';
    document.getElementById('param-dy').textContent = '-';
    document.getElementById('param-rotation').textContent = '-';
    document.getElementById('param-scale').textContent = '-';
    document.getElementById('param-status').style.display = 'none';
}

// 显示参数状态
function showParamStatus(message, type = 'info') {
    const statusEl = document.getElementById('param-status');
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    
    const colors = {
        'success': '#28a745',
        'error': '#dc3545',
        'info': '#17a2b8',
        'warning': '#ffc107'
    };
    
    statusEl.style.backgroundColor = colors[type] || colors.info;
    statusEl.style.color = 'white';
}

// 从公共点计算参数
function calculateParametersFromCommonPoints() {
    const tbody = document.getElementById('common-points-tbody');
    const rows = tbody.querySelectorAll('tr');
    
    if (rows.length < 2) {
        showParamStatus('至少需要2个公共点才能解算参数', 'error');
        return;
    }
    
    const commonPoints = [];
    let validPoints = 0;
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 5) {
            const name = inputs[0].value.trim();
            const source_x = parseFloat(inputs[1].value);
            const source_y = parseFloat(inputs[2].value);
            const target_x = parseFloat(inputs[3].value);
            const target_y = parseFloat(inputs[4].value);
            
            // 检查是否有有效的坐标数据
            if (name && !isNaN(source_x) && !isNaN(source_y) && !isNaN(target_x) && !isNaN(target_y)) {
                commonPoints.push({
                    name: name,
                    source_x: source_x,
                    source_y: source_y,
                    target_x: target_x,
                    target_y: target_y
                });
                validPoints++;
            }
        }
    });
    
    if (validPoints < 2) {
        showParamStatus('至少需要2个有效的公共点才能解算参数', 'error');
        return;
    }
    
    showParamStatus('正在解算参数...', 'info');
    
    fetch('http://127.0.0.1:5000/api/four-parameter-transform', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            operation_type: 'calculate_params',
            common_points: commonPoints
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const params = data.parameters;
            document.getElementById('param-dx').textContent = params.dx.toFixed(4);
            document.getElementById('param-dy').textContent = params.dy.toFixed(4);
            document.getElementById('param-rotation').textContent = params.alpha.toFixed(8);
            document.getElementById('param-scale').textContent = params.m.toFixed(8);
            
            showParamStatus('参数解算成功！', 'success');
            
            // 更新全局设置对象
            fourParamForwardSettings.deltaX = params.dx;
            fourParamForwardSettings.deltaY = params.dy;
            fourParamForwardSettings.rotation = params.alpha;
            fourParamForwardSettings.scale = params.m;
            
            // 保存到localStorage
            const settings = JSON.parse(localStorage.getItem('fourParamForwardSettings') || '{}');
            settings.deltaX = params.dx;
            settings.deltaY = params.dy;
            settings.rotation = params.alpha;
            settings.scale = params.m;
            localStorage.setItem('fourParamForwardSettings', JSON.stringify(settings));
            
        } else {
            showParamStatus('参数解算失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('参数解算错误:', error);
        showParamStatus('参数解算失败: 网络错误', 'error');
    });
}

// 显示导出对话框
function showFourParamForwardExportDialog() {
    console.log('📤 显示四参数坐标转换正算导出对话框');
    
    // 检查是否有计算结果
    const tbody = document.getElementById('four_param_forward-table-body');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    
    rows.forEach(row => {
        const transformedXElement = row.querySelector('.result-transformed-x');
        const transformedYElement = row.querySelector('.result-transformed-y');
        if (transformedXElement && transformedYElement && 
            transformedXElement.textContent && transformedYElement.textContent &&
            transformedXElement.textContent !== '-' && transformedYElement.textContent !== '-') {
            hasResults = true;
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    // 显示导出对话框
    showFourParamForwardExportModal();
}

// 显示四参数正算导出模态框
function showFourParamForwardExportModal() {
    console.log('📤 显示四参数正算导出模态框...');
    
    // 检查是否已存在导出模态框
    let modal = document.getElementById('fourParamForwardExportModal');
    if (!modal) {
        createFourParamForwardExportModal();
        modal = document.getElementById('fourParamForwardExportModal');
    }
    
    // 设置默认文件名
    const projectName = document.querySelector('#four_param_forward-content .project-name-input')?.value || '四参数正算';
    const fileName = `${projectName}_四参数坐标转换正算结果`;
    document.getElementById('fourParamForwardExportFileName').value = fileName;
    
    // 显示模态框
    modal.style.display = 'block';
}

// 创建四参数正算导出模态框
function createFourParamForwardExportModal() {
    const modalHTML = `
        <div class="modal" id="fourParamForwardExportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>四参数坐标转换正算结果导出</h3>
                    <span class="close" onclick="closeModal('fourParamForwardExportModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="export-section">
                        <h4>导出格式</h4>
                        <div class="format-grid">
                            <label class="format-option">
                                <input type="radio" name="fourParamForwardExportFormat" value="txt" checked>
                                <span class="format-label">
                                    <i class="fas fa-file-alt"></i>
                                    <strong>TXT文本</strong>
                                    <small>纯文本格式，通用性强</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="fourParamForwardExportFormat" value="csv">
                                <span class="format-label">
                                    <i class="fas fa-file-csv"></i>
                                    <strong>CSV表格</strong>
                                    <small>逗号分隔，Excel兼容</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="fourParamForwardExportFormat" value="excel">
                                <span class="format-label">
                                    <i class="fas fa-file-excel"></i>
                                    <strong>Excel文件</strong>
                                    <small>HTML表格格式</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="fourParamForwardExportFormat" value="dat">
                                <span class="format-label">
                                    <i class="fas fa-database"></i>
                                    <strong>DAT数据</strong>
                                    <small>专业数据格式</small>
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h4>导出内容</h4>
                        <div class="content-options">
                            <label class="checkbox-option">
                                <input type="checkbox" id="fourParamForwardIncludeParameters" checked>
                                <span>转换参数</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="fourParamForwardIncludeInputData" checked>
                                <span>输入数据</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="fourParamForwardIncludeResults" checked>
                                <span>转换结果</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="fourParamForwardIncludeProjectInfo" checked>
                                <span>项目信息</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h4>导出设置</h4>
                        <div class="setting-row">
                            <label>文件名：</label>
                            <input type="text" id="fourParamForwardExportFileName" class="form-input" placeholder="请输入文件名">
                        </div>
                        <div class="setting-row">
                            <label>小数位数：</label>
                            <select id="fourParamForwardDecimalPlaces" class="form-select">
                                <option value="2">2位</option>
                                <option value="3">3位</option>
                                <option value="4" selected>4位</option>
                                <option value="6">6位</option>
                                <option value="8">8位</option>
                            </select>
                        </div>
                        <div class="setting-row">
                            <label class="checkbox-option">
                                <input type="checkbox" id="fourParamForwardIncludeTimestamp" checked>
                                <span>添加时间戳</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('fourParamForwardExportModal')">取消</button>
                    <button class="btn btn-primary" onclick="performFourParamForwardExport()">导出</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 执行四参数正算导出
function performFourParamForwardExport() {
    console.log('📤 执行四参数正算导出...');
    
    // 获取导出设置
    const format = document.querySelector('input[name="fourParamForwardExportFormat"]:checked')?.value || 'txt';
    const fileName = document.getElementById('fourParamForwardExportFileName')?.value || '四参数正算结果';
    const decimalPlaces = parseInt(document.getElementById('fourParamForwardDecimalPlaces')?.value || '4');
    
    const includeParameters = document.getElementById('fourParamForwardIncludeParameters')?.checked || false;
    const includeInputData = document.getElementById('fourParamForwardIncludeInputData')?.checked || false;
    const includeResults = document.getElementById('fourParamForwardIncludeResults')?.checked || false;
    const includeProjectInfo = document.getElementById('fourParamForwardIncludeProjectInfo')?.checked || false;
    const includeTimestamp = document.getElementById('fourParamForwardIncludeTimestamp')?.checked || false;
    
    // 收集导出数据
    const exportData = collectFourParamForwardExportData({
        includeParameters,
        includeInputData,
        includeResults,
        includeProjectInfo,
        includeTimestamp,
        decimalPlaces
    });
    
    if (!exportData || (!exportData.parameters && !exportData.inputData && !exportData.results)) {
        showMessage('没有可导出的数据', 'warning');
        return;
    }
    
    // 根据格式导出
    let content = '';
    let finalFileName = fileName;
    
    switch (format) {
        case 'txt':
            content = generateFourParamForwardTXT(exportData, decimalPlaces);
            finalFileName = fileName + '.txt';
            break;
        case 'csv':
            content = generateFourParamForwardCSV(exportData, decimalPlaces);
            finalFileName = fileName + '.csv';
            break;
        case 'excel':
            content = generateFourParamForwardExcel(exportData, decimalPlaces);
            finalFileName = fileName + '.xls';
            break;
        case 'dat':
            content = generateFourParamForwardDAT(exportData, decimalPlaces);
            finalFileName = fileName + '.dat';
            break;
        default:
            content = generateFourParamForwardTXT(exportData, decimalPlaces);
            finalFileName = fileName + '.txt';
    }
    
    // 下载文件
    downloadFile(content, finalFileName, format);
    
    // 关闭模态框
    closeModal('fourParamForwardExportModal');
    
    showMessage(`导出成功: ${finalFileName}`, 'success');
}

// 收集四参数正算导出数据
function collectFourParamForwardExportData(options) {
    console.log('📊 收集四参数正算导出数据...');
    
    const data = {
        projectInfo: {},
        parameters: {},
        inputData: [],
        results: [],
        timestamp: null
    };
    
    // 项目信息
    if (options.includeProjectInfo) {
        const projectName = document.querySelector('#four_param_forward-content .project-name-input')?.value || '';
        const operator = document.querySelector('#four_param_forward-content .module-footer .form-input[placeholder="计算人"]')?.value || '';
        const calculator = document.querySelector('#four_param_forward-content .module-footer .form-input[placeholder="复核人"]')?.value || '';
        const reviewer = '';
        const date = document.querySelector('#four_param_forward-content .module-footer .form-input[type="date"]')?.value || '';
        
        data.projectInfo = {
            projectName,
            operator,
            calculator,
            reviewer,
            date,
            module: '四参数坐标转换正算',
            exportTime: new Date().toLocaleString()
        };
    }
    
    // 转换参数
    if (options.includeParameters) {
        const deltaX = document.getElementById('param-dx')?.textContent || '';
        const deltaY = document.getElementById('param-dy')?.textContent || '';
        const rotation = document.getElementById('param-rotation')?.textContent || '';
        const scale = document.getElementById('param-scale')?.textContent || '';
        
        data.parameters = {
            deltaX,
            deltaY,
            rotation,
            scale,
            parameterCount: 4
        };
    }
    
    // 输入数据和结果
    if (options.includeInputData || options.includeResults) {
        const tbody = document.getElementById('four_param_forward-table-body');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach(row => {
                // 获取输入数据 - 表格中的input元素
                const nameInput = row.querySelector('td:nth-child(1) input');
                const xInput = row.querySelector('td:nth-child(2) input');
                const yInput = row.querySelector('td:nth-child(3) input');
                
                // 获取结果数据 - 表格中的span元素
                const transformedXSpan = row.querySelector('td:nth-child(4) span');
                const transformedYSpan = row.querySelector('td:nth-child(5) span');
                
                const name = nameInput ? nameInput.value || '' : '';
                const sourceX = xInput ? xInput.value || '' : '';
                const sourceY = yInput ? yInput.value || '' : '';
                const transformedX = transformedXSpan ? transformedXSpan.textContent || '' : '';
                const transformedY = transformedYSpan ? transformedYSpan.textContent || '' : '';
                
                if (options.includeInputData) {
                    data.inputData.push({
                        name,
                        sourceX,
                        sourceY
                    });
                }
                
                if (options.includeResults) {
                    data.results.push({
                        name,
                        transformedX,
                        transformedY
                    });
                }
            });
        }
    }
    
    // 时间戳
    if (options.includeTimestamp) {
        data.timestamp = new Date().toLocaleString();
    }
    
    return data;
}

// 生成TXT格式
function generateFourParamForwardTXT(data, decimalPlaces) {
    let content = '';
    
    // 标题
    content += '四参数坐标转换正算结果\n';
    content += '='.repeat(50) + '\n\n';
    
    // 项目信息
    if (data.projectInfo && Object.keys(data.projectInfo).length > 0) {
        content += '【项目信息】\n';
        content += `项目名称: ${data.projectInfo.projectName}\n`;
        content += `操作员: ${data.projectInfo.operator}\n`;
        content += `计算员: ${data.projectInfo.calculator}\n`;
        content += `复核员: ${data.projectInfo.reviewer}\n`;
        content += `日期: ${data.projectInfo.date}\n`;
        content += `导出时间: ${data.projectInfo.exportTime}\n\n`;
    }
    
    // 转换参数
    if (data.parameters && Object.keys(data.parameters).length > 0) {
        content += '【转换参数】\n';
        content += `ΔX: ${data.parameters.deltaX}\n`;
        content += `ΔY: ${data.parameters.deltaY}\n`;
        content += `旋转角α: ${data.parameters.rotation}\n`;
        content += `尺度因子k: ${data.parameters.scale}\n\n`;
    }
    
    // 转换结果
    if (data.results && data.results.length > 0) {
        content += '【转换结果】\n';
        content += `序号\t点名\t源X坐标\t源Y坐标\t转换后X坐标\t转换后Y坐标\n`;
        content += '-'.repeat(80) + '\n';
        
        data.results.forEach((result, index) => {
            const input = data.inputData[index] || {};
            content += `${index + 1}\t${result.name}\t${input.sourceX || ''}\t${input.sourceY || ''}\t${result.transformedX}\t${result.transformedY}\n`;
        });
        content += '\n';
    }
    
    // 时间戳
    if (data.timestamp) {
        content += `\n导出时间: ${data.timestamp}\n`;
    }
    
    return content;
}

// 生成CSV格式
function generateFourParamForwardCSV(data, decimalPlaces) {
    let content = '';
    
    // 项目信息
    if (data.projectInfo && Object.keys(data.projectInfo).length > 0) {
        content += '项目信息\n';
        content += `项目名称,${data.projectInfo.projectName}\n`;
        content += `操作员,${data.projectInfo.operator}\n`;
        content += `计算员,${data.projectInfo.calculator}\n`;
        content += `复核员,${data.projectInfo.reviewer}\n`;
        content += `日期,${data.projectInfo.date}\n`;
        content += `导出时间,${data.projectInfo.exportTime}\n\n`;
    }
    
    // 转换参数
    if (data.parameters && Object.keys(data.parameters).length > 0) {
        content += '转换参数\n';
        content += `ΔX,${data.parameters.deltaX}\n`;
        content += `ΔY,${data.parameters.deltaY}\n`;
        content += `旋转角α,${data.parameters.rotation}\n`;
        content += `尺度因子k,${data.parameters.scale}\n\n`;
    }
    
    // 转换结果
    if (data.results && data.results.length > 0) {
        content += '转换结果\n';
        content += '序号,点名,源X坐标,源Y坐标,转换后X坐标,转换后Y坐标\n';
        
        data.results.forEach((result, index) => {
            const input = data.inputData[index] || {};
            content += `${index + 1},${result.name},${input.sourceX || ''},${input.sourceY || ''},${result.transformedX},${result.transformedY}\n`;
        });
    }
    
    return content;
}

// 生成Excel格式（HTML表格）
function generateFourParamForwardExcel(data, decimalPlaces) {
    let content = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    content += '<head><meta charset="utf-8"><title>四参数坐标转换正算结果</title></head><body>';
    content += '<table border="1">';
    
    // 标题
    content += '<tr><th colspan="6" style="background-color: #4472C4; color: white; font-size: 16px;">四参数坐标转换正算结果</th></tr>';
    
    // 项目信息
    if (data.projectInfo && Object.keys(data.projectInfo).length > 0) {
        content += '<tr><th colspan="6" style="background-color: #D5E2F1;">项目信息</th></tr>';
        content += `<tr><td>项目名称</td><td colspan="5">${data.projectInfo.projectName}</td></tr>`;
        content += `<tr><td>操作员</td><td colspan="5">${data.projectInfo.operator}</td></tr>`;
        content += `<tr><td>计算员</td><td colspan="5">${data.projectInfo.calculator}</td></tr>`;
        content += `<tr><td>复核员</td><td colspan="5">${data.projectInfo.reviewer}</td></tr>`;
        content += `<tr><td>日期</td><td colspan="5">${data.projectInfo.date}</td></tr>`;
        content += `<tr><td>导出时间</td><td colspan="5">${data.projectInfo.exportTime}</td></tr>`;
    }
    
    // 转换参数
    if (data.parameters && Object.keys(data.parameters).length > 0) {
        content += '<tr><th colspan="6" style="background-color: #D5E2F1;">转换参数</th></tr>';
        content += `<tr><td>ΔX</td><td colspan="5">${data.parameters.deltaX}</td></tr>`;
        content += `<tr><td>ΔY</td><td colspan="5">${data.parameters.deltaY}</td></tr>`;
        content += `<tr><td>旋转角α</td><td colspan="5">${data.parameters.rotation}</td></tr>`;
        content += `<tr><td>尺度因子k</td><td colspan="5">${data.parameters.scale}</td></tr>`;
    }
    
    // 转换结果
    if (data.results && data.results.length > 0) {
        content += '<tr><th colspan="6" style="background-color: #D5E2F1;">转换结果</th></tr>';
        content += '<tr><th>序号</th><th>点名</th><th>源X坐标</th><th>源Y坐标</th><th>转换后X坐标</th><th>转换后Y坐标</th></tr>';
        
        data.results.forEach((result, index) => {
            const input = data.inputData[index] || {};
            content += `<tr><td>${index + 1}</td><td>${result.name}</td><td>${input.sourceX || ''}</td><td>${input.sourceY || ''}</td><td>${result.transformedX}</td><td>${result.transformedY}</td></tr>`;
        });
    }
    
    content += '</table></body></html>';
    return content;
}

// 生成DAT格式
function generateFourParamForwardDAT(data, decimalPlaces) {
    let content = '';
    
    // 标题行
    content += '// 四参数坐标转换正算结果\n';
    content += '// 导出时间: ' + (data.timestamp || new Date().toLocaleString()) + '\n';
    
    // 项目信息
    if (data.projectInfo && Object.keys(data.projectInfo).length > 0) {
        content += '// 项目名称: ' + data.projectInfo.projectName + '\n';
        content += '// 操作员: ' + data.projectInfo.operator + '\n';
        content += '// 计算员: ' + data.projectInfo.calculator + '\n';
        content += '// 复核员: ' + data.projectInfo.reviewer + '\n';
        content += '// 日期: ' + data.projectInfo.date + '\n\n';
    }
    
    // 转换参数
    if (data.parameters && Object.keys(data.parameters).length > 0) {
        content += '// 转换参数\n';
        content += '// ΔX: ' + data.parameters.deltaX + '\n';
        content += '// ΔY: ' + data.parameters.deltaY + '\n';
        content += '// 旋转角α: ' + data.parameters.rotation + '\n';
        content += '// 尺度因子k: ' + data.parameters.scale + '\n\n';
    }
    
    // 数据头
    content += '// 点名, 源X坐标, 源Y坐标, 转换后X坐标, 转换后Y坐标\n';
    
    // 转换结果
    if (data.results && data.results.length > 0) {
        data.results.forEach((result, index) => {
            const input = data.inputData[index] || {};
            content += `${result.name}, ${input.sourceX || ''}, ${input.sourceY || ''}, ${result.transformedX}, ${result.transformedY}\n`;
        });
    }
    
    return content;
}

// 导出全局函数
window.initializeFourParamForward = initializeFourParamForward;
window.bindFourParamForwardEvents = bindFourParamForwardEvents;
window.performFourParamForwardCalculation = performFourParamForwardCalculation;
window.showFourParamForwardExportDialog = showFourParamForwardExportDialog;
window.importFourParamForwardData = importFourParamForwardData;
window.calculateParametersFromCommonPoints = calculateParametersFromCommonPoints;
window.importFourParamForwardCommonPointsData = importFourParamForwardCommonPointsData;
window.clearCommonPoints = clearCommonPoints;

console.log('✅ 四参数坐标转换正算模块加载完成');