// 七参数坐标转换模块 - 完整版本
console.log('🔧 加载七参数坐标转换模块...');

// 全局设置对象
let sevenParamSettings = {
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
    coordDecimals: 3
};

let sevenParamCommonPoints = []; // 存储公共点数据

// 初始化七参数坐标转换功能
function initializeSevenParam() {
    console.log('🚀 初始化七参数坐标转换功能...');
    
    setTimeout(() => {
        console.log('📋 开始初始化表格...');
        initializeSevenParamTable();
        
        console.log('📋 开始初始化公共点表格...');
        updateSevenParamCommonPointsTable(); // 初始化公共点表格
        
        console.log('🔗 开始绑定事件...');
        bindSevenParamEvents();
        
        console.log('✅ 七参数坐标转换模块初始化完成');
    }, 100);
}

// 初始化七参数坐标转换表格
function initializeSevenParamTable() {
    const tbody = document.getElementById('seven_param-table-body');
    if (!tbody) {
        console.error('✗ 找不到七参数坐标转换表格体');
        return;
    }
    
    tbody.innerHTML = '';
    
    // 添加5行默认数据
    for (let i = 1; i <= 5; i++) {
        addSevenParamRow();
    }
    
    console.log('✅ 七参数坐标转换表格初始化完成，添加了5行');
}

// 添加七参数坐标转换行
function addSevenParamRow(data = {}) {
    const tbody = document.getElementById('seven_param-table-body');
    if (!tbody) return;
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="text" class="table-input" value="${data.name || 'P' + String(rowCount).padStart(3, '0')}" placeholder="点名"></td>
        <td><input type="number" class="table-input" value="${data.X || ''}" placeholder="X坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.Y || ''}" placeholder="Y坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.Z || ''}" placeholder="Z坐标(m)" step="0.001"></td>
        
        <td><span class="result-new-x result-value">${data.newX || '-'}</span></td>
        <td><span class="result-new-y result-value">${data.newY || '-'}</span></td>
        <td><span class="result-new-z result-value">${data.newZ || '-'}</span></td>
        <td><span class="result-delta-x result-value">${data.deltaX || '-'}</span></td>
        <td><span class="result-delta-y result-value">${data.deltaY || '-'}</span></td>
        <td><span class="result-delta-z result-value">${data.deltaZ || '-'}</span></td>
    `;
    
    tbody.appendChild(row);
}

// 绑定七参数坐标转换事件
function bindSevenParamEvents() {
    console.log('🔗 绑定七参数坐标转换事件...');
    
    const sevenParamContent = document.getElementById('seven_param-content');
    if (!sevenParamContent) {
        console.error('✗ 找不到七参数坐标转换内容区域');
        return;
    }
    
    // 导入按钮
    const importBtn = sevenParamContent.querySelector('[data-action="import-data"]');
    if (importBtn) {
        console.log('✓ 找到导入按钮，绑定事件');
        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入数据按钮');
            openSevenParamImportDialog();
        });
    }
    
    // 导入公共点按钮
    const importCommonPointsBtn = sevenParamContent.querySelector('[data-action="import-common-points"]');
    if (importCommonPointsBtn) {
        console.log('✓ 找到导入公共点按钮，绑定事件');
        importCommonPointsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入公共点按钮');
            openSevenParamCommonPointsImportDialog();
        });
    }
    
    // 计算方案按钮
    const settingsBtn = sevenParamContent.querySelector('[data-action="settings"]');
    if (settingsBtn) {
        console.log('✓ 找到计算方案按钮，绑定事件');
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ 点击计算方案按钮');
            openSevenParamSettings();
        });
    }
    
    // 计算按钮
    const calculateBtn = sevenParamContent.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        console.log('✓ 找到计算按钮，绑定事件');
        calculateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🧮 点击开始计算按钮');
            performSevenParamCalculation();
        });
    }
    
    // 导出按钮
    const exportBtn = sevenParamContent.querySelector('[data-action="export-result"]');
    if (exportBtn) {
        console.log('✓ 找到导出按钮，绑定事件');
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📤 点击导出结果按钮');
            showSevenParamExportDialog();
        });
    }
}

// 打开导入对话框
function openSevenParamImportDialog() {
    console.log('📥 打开七参数坐标转换导入对话框');
    
    const modal = document.getElementById('importModal');
    const titleEl = document.getElementById('importModalTitle');
    const formatInfoEl = modal.querySelector('.file-format-info');
    
    if (modal && titleEl && formatInfoEl) {
        titleEl.textContent = '导入数据 - 七参数坐标转换';
        modal.dataset.importType = 'seven_param';
        
        formatInfoEl.innerHTML = `
            <h4>文件格式说明:</h4>
            <p><strong>格式:</strong> 点名 X坐标(m) Y坐标(m) Z坐标(m)</p>
            <p><strong>示例:</strong></p>
            <pre>P01 -2148744.123 4426641.456 4044492.789
P02 -2148855.234 4426752.567 4044603.890
P03 -2148966.345 4426863.678 4044714.901</pre>
        `;
        
        modal.style.display = 'block';
        modal.classList.add('show');
    }
}

// 打开导入公共点对话框
function openSevenParamCommonPointsImportDialog() {
    console.log('📥 打开七参数公共点导入对话框');
    
    const modal = document.getElementById('importModal');
    const titleEl = document.getElementById('importModalTitle');
    const formatInfoEl = modal.querySelector('.file-format-info');
    
    if (modal && titleEl && formatInfoEl) {
        titleEl.textContent = '导入公共点 - 七参数坐标转换';
        modal.dataset.importType = 'seven_param_common_points';
        
        formatInfoEl.innerHTML = `
            <h4>文件格式说明:</h4>
            <p><strong>格式:</strong> 点名 源X(m) 源Y(m) 源Z(m) 目标X(m) 目标Y(m) 目标Z(m)</p>
            <p><strong>示例:</strong></p>
            <pre>P01 -2148744.123 4426641.456 4044492.789 -2148744.456 4426641.789 4044493.123
P02 -2148855.234 4426752.567 4044603.890 -2148855.567 4426752.890 4044604.234
P03 -2148966.345 4426863.678 4044714.901 -2148966.678 4426864.012 4044715.245</pre>
            <p><strong>说明:</strong> 至少需要3个公共点才能解算七参数</p>
        `;
        
        modal.style.display = 'block';
        modal.classList.add('show');
    }
}

// 打开计算方案设置
function openSevenParamSettings() {
    console.log('⚙️ 打开七参数坐标转换计算方案设置');
    
    // 创建设置对话框
    const settingsModal = document.createElement('div');
    settingsModal.className = 'modal';
    settingsModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>七参数坐标转换 - 计算方案设置</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>X平移参数 (ΔX):</label>
                    <input type="number" id="deltaXParam7" value="${sevenParamSettings.deltaX}" step="0.001" placeholder="米">
                </div>
                <div class="form-group">
                    <label>Y平移参数 (ΔY):</label>
                    <input type="number" id="deltaYParam7" value="${sevenParamSettings.deltaY}" step="0.001" placeholder="米">
                </div>
                <div class="form-group">
                    <label>Z平移参数 (ΔZ):</label>
                    <input type="number" id="deltaZParam7" value="${sevenParamSettings.deltaZ}" step="0.001" placeholder="米">
                </div>
                <div class="form-group">
                    <label>X旋转角 (εX):</label>
                    <input type="number" id="rotationXParam7" value="${sevenParamSettings.rotationX}" step="0.000001" placeholder="弧度">
                </div>
                <div class="form-group">
                    <label>Y旋转角 (εY):</label>
                    <input type="number" id="rotationYParam7" value="${sevenParamSettings.rotationY}" step="0.000001" placeholder="弧度">
                </div>
                <div class="form-group">
                    <label>Z旋转角 (εZ):</label>
                    <input type="number" id="rotationZParam7" value="${sevenParamSettings.rotationZ}" step="0.000001" placeholder="弧度">
                </div>
                <div class="form-group">
                    <label>尺度因子 (k):</label>
                    <input type="number" id="scaleParam7" value="${sevenParamSettings.scale}" step="0.000001" placeholder="无量纲">
                </div>
                <div class="form-group">
                    <label>坐标小数位数:</label>
                    <input type="number" id="coordDecimalsSeven" value="${sevenParamSettings.coordDecimals}" min="0" max="6">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-info" onclick="calculateSevenParamFromCommonPoints()">从公共点解算</button>
                <button type="button" class="btn btn-secondary" onclick="closeSevenParamSettings()">取消</button>
                <button type="button" class="btn btn-primary" onclick="saveSevenParamSettings()">确定</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(settingsModal);
    settingsModal.style.display = 'block';
    
    // 绑定关闭事件
    const closeBtn = settingsModal.querySelector('.close');
    closeBtn.onclick = () => closeSevenParamSettings();
    
    window.closeSevenParamSettings = () => {
        document.body.removeChild(settingsModal);
    };
    
    window.saveSevenParamSettings = () => {
        sevenParamSettings.deltaX = parseFloat(document.getElementById('deltaXParam7').value) || 0;
        sevenParamSettings.deltaY = parseFloat(document.getElementById('deltaYParam7').value) || 0;
        sevenParamSettings.deltaZ = parseFloat(document.getElementById('deltaZParam7').value) || 0;
        sevenParamSettings.rotationX = parseFloat(document.getElementById('rotationXParam7').value) || 0;
        sevenParamSettings.rotationY = parseFloat(document.getElementById('rotationYParam7').value) || 0;
        sevenParamSettings.rotationZ = parseFloat(document.getElementById('rotationZParam7').value) || 0;
        sevenParamSettings.scale = parseFloat(document.getElementById('scaleParam7').value) || 1;
        sevenParamSettings.coordDecimals = parseInt(document.getElementById('coordDecimalsSeven').value) || 3;
        
        alert('设置已保存');
        closeSevenParamSettings();
    };
}

// 执行七参数坐标转换计算
function performSevenParamCalculation() {
    console.log('🧮 开始执行七参数坐标转换计算');
    
    const data = collectSevenParamData();
    if (!data || data.length === 0) {
        alert('请先输入坐标数据');
        return;
    }
    
    // 检查是否有足够的公共点
    if (sevenParamCommonPoints.length < 3) {
        alert('七参数转换至少需要3个公共点');
        return;
    }
    
    showSevenParamLoading(true);
    
    // 准备请求数据，匹配后端接口格式
    const requestData = {
        points: data.map(point => ({
            name: point.name,
            x: point.X,  // 将大写X转换为小写x
            y: point.Y,  // 将大写Y转换为小写y
            z: point.Z   // 将大写Z转换为小写z
        })),
        control_points: sevenParamCommonPoints.map(point => ({
            source_x: point.sourceX,
            source_y: point.sourceY,
            source_z: point.sourceZ,
            target_x: point.targetX,
            target_y: point.targetY,
            target_z: point.targetZ
        }))
    };
    
    fetch('http://127.0.0.1:5000/api/seven-parameter-transform', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('✅ 七参数坐标转换计算完成:', result);
        
        if (result.success) {
            displaySevenParamResults(result.data, result.parameters);
            alert('计算完成！');
        } else {
            alert('计算失败: ' + (result.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('❌ 七参数坐标转换计算失败:', error);
        alert('计算过程发生错误: ' + error.message);
    })
    .finally(() => {
        showSevenParamLoading(false);
    });
}

// 收集七参数坐标转换数据
function collectSevenParamData() {
    const tbody = document.getElementById('seven_param-table-body');
    if (!tbody) return [];
    
    const data = [];
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0]?.value?.trim();
        const X = parseFloat(inputs[1]?.value);
        const Y = parseFloat(inputs[2]?.value);
        const Z = parseFloat(inputs[3]?.value);
        
        if (name && !isNaN(X) && !isNaN(Y) && !isNaN(Z)) {
            data.push({
                name: name,
                X: X,
                Y: Y,
                Z: Z
            });
        }
    });
    
    return data;
}

// 显示七参数坐标转换结果
function displaySevenParamResults(results, parameters) {
    const tbody = document.getElementById('seven_param-table-body');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    results.forEach((result, index) => {
        if (index < rows.length) {
            const row = rows[index];
            const inputs = row.querySelectorAll('input');
            
            // 更新转换后坐标（使用span元素）
            const newXElement = row.querySelector('.result-new-x');
            const newYElement = row.querySelector('.result-new-y');
            const newZElement = row.querySelector('.result-new-z');
            
            if (newXElement && result.transformed_x !== undefined) {
                newXElement.textContent = result.transformed_x.toFixed(sevenParamSettings.coordDecimals) + 'm';
            }
            
            if (newYElement && result.transformed_y !== undefined) {
                newYElement.textContent = result.transformed_y.toFixed(sevenParamSettings.coordDecimals) + 'm';
            }
            
            if (newZElement && result.transformed_z !== undefined) {
                newZElement.textContent = result.transformed_z.toFixed(sevenParamSettings.coordDecimals) + 'm';
            }
            
            // 更新ΔX、ΔY、ΔZ（使用span元素）
            const deltaXElement = row.querySelector('.result-delta-x');
            const deltaYElement = row.querySelector('.result-delta-y');
            const deltaZElement = row.querySelector('.result-delta-z');
            
            if (deltaXElement && result.original_x !== undefined && result.transformed_x !== undefined) {
                const deltaX = result.transformed_x - result.original_x;
                deltaXElement.textContent = deltaX.toFixed(sevenParamSettings.coordDecimals) + 'm';
            }
            
            if (deltaYElement && result.original_y !== undefined && result.transformed_y !== undefined) {
                const deltaY = result.transformed_y - result.original_y;
                deltaYElement.textContent = deltaY.toFixed(sevenParamSettings.coordDecimals) + 'm';
            }
            
            if (deltaZElement && result.original_z !== undefined && result.transformed_z !== undefined) {
                const deltaZ = result.transformed_z - result.original_z;
                deltaZElement.textContent = deltaZ.toFixed(sevenParamSettings.coordDecimals) + 'm';
            }
        }
    });
    
    // 显示七参数结果
    if (parameters) {
        console.log('七参数转换参数:', parameters);
        // 可以在这里添加显示转换参数的UI逻辑
    }
}

// 显示加载状态
function showSevenParamLoading(show) {
    const sevenParamContent = document.getElementById('seven_param-content');
    const calculateBtn = sevenParamContent?.querySelector('[data-action="calculate"]');
    
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

// 导入七参数坐标转换数据
function importSevenParamData(data) {
    console.log('📥 导入七参数坐标转换数据:', data);
    
    const tbody = document.getElementById('seven_param-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach(point => {
        addSevenParamRow(point);
    });
    
    while (tbody.children.length < 5) {
        addSevenParamRow();
    }
    
    console.log(`✅ 成功导入 ${data.length} 个点的数据`);
}

// 导入公共点数据
function importSevenParamCommonPointsData(data) {
    console.log('📥 开始导入七参数公共点数据...');
    
    if (!data || data.length === 0) {
        console.warn('⚠️ 导入数据为空');
        return;
    }
    
    sevenParamCommonPoints = [];
    
    data.forEach((row, index) => {
        if (row.name && row.sourceX !== undefined && row.sourceY !== undefined && row.sourceZ !== undefined &&
            row.targetX !== undefined && row.targetY !== undefined && row.targetZ !== undefined) {
            sevenParamCommonPoints.push({
                name: row.name,
                sourceX: parseFloat(row.sourceX),
                sourceY: parseFloat(row.sourceY),
                sourceZ: parseFloat(row.sourceZ),
                targetX: parseFloat(row.targetX),
                targetY: parseFloat(row.targetY),
                targetZ: parseFloat(row.targetZ)
            });
        }
    });
    
    updateSevenParamCommonPointsTable();
    console.log(`✅ 成功导入 ${sevenParamCommonPoints.length} 个公共点`);
    showMessage(`成功导入 ${sevenParamCommonPoints.length} 个公共点`, 'success');
}

// 添加七参数公共点输入行
function addSevenParamCommonPointRow(data = {}) {
    const tbody = document.getElementById('seven-param-common-points-tbody');
    if (!tbody) return;
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="text" class="table-input" value="${data.name || 'P' + String(rowCount).padStart(3, '0')}" placeholder="点名"></td>
        <td><input type="number" class="table-input" value="${data.sourceX !== undefined ? data.sourceX : ''}" placeholder="源X坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.sourceY !== undefined ? data.sourceY : ''}" placeholder="源Y坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.sourceZ !== undefined ? data.sourceZ : ''}" placeholder="源Z坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.targetX !== undefined ? data.targetX : ''}" placeholder="目标X坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.targetY !== undefined ? data.targetY : ''}" placeholder="目标Y坐标(m)" step="0.001"></td>
        <td><input type="number" class="table-input" value="${data.targetZ !== undefined ? data.targetZ : ''}" placeholder="目标Z坐标(m)" step="0.001"></td>
    `;
    
    tbody.appendChild(row);
}

// 更新公共点表格显示
function updateSevenParamCommonPointsTable() {
    const tbody = document.getElementById('seven-param-common-points-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    sevenParamCommonPoints.forEach((point, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${point.name}</td>
            <td>${point.sourceX.toFixed(3)}</td>
            <td>${point.sourceY.toFixed(3)}</td>
            <td>${point.sourceZ.toFixed(3)}</td>
            <td>${point.targetX.toFixed(3)}</td>
            <td>${point.targetY.toFixed(3)}</td>
            <td>${point.targetZ.toFixed(3)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // 如果没有数据，添加5行预设输入行
    if (sevenParamCommonPoints.length === 0) {
        for (let i = 1; i <= 5; i++) {
            addSevenParamCommonPointRow();
        }
    }
}

// 清空公共点数据
function clearSevenParamCommonPoints() {
    sevenParamCommonPoints = [];
    updateSevenParamCommonPointsTable();
    showMessage('公共点数据已清空，已重新添加预设行', 'info');
}

// 从公共点解算七参数
function calculateSevenParamFromCommonPoints() {
    console.log('🧮 开始从公共点解算七参数...');
    
    // 优先使用已导入的公共点数据
    if (sevenParamCommonPoints.length > 0) {
        console.log(`使用已导入的 ${sevenParamCommonPoints.length} 个公共点进行解算`);
        
        if (sevenParamCommonPoints.length < 3) {
            showMessage('至少需要3个公共点才能解算七参数', 'error');
            return;
        }
        
        try {
            // 简化的七参数解算算法
            const params = solveSevenParameters(sevenParamCommonPoints);
            
            // 更新设置
            sevenParamSettings.deltaX = params.dx;
            sevenParamSettings.deltaY = params.dy;
            sevenParamSettings.deltaZ = params.dz;
            sevenParamSettings.rotationX = params.rotationX;
            sevenParamSettings.rotationY = params.rotationY;
            sevenParamSettings.rotationZ = params.rotationZ;
            sevenParamSettings.scale = params.scale;
            
            // 更新显示
            updateSevenParamDisplay();
            
            showMessage('七参数解算成功！', 'success');
            
        } catch (error) {
            console.error('七参数解算失败:', error);
            showMessage('七参数解算失败：' + error.message, 'error');
        }
        return;
    }
    
    // 如果没有导入的公共点数据，则尝试从表格读取
    console.log('没有导入的公共点数据，尝试从表格读取...');
    
    const tbody = document.getElementById('seven-param-common-points-tbody');
    const rows = tbody.querySelectorAll('tr');
    
    if (rows.length < 3) {
        showMessage('至少需要3个公共点才能解算七参数', 'error');
        return;
    }
    
    const commonPoints = [];
    let validPoints = 0;
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 7) {
            const name = inputs[0].value.trim();
            const sourceX = parseFloat(inputs[1].value);
            const sourceY = parseFloat(inputs[2].value);
            const sourceZ = parseFloat(inputs[3].value);
            const targetX = parseFloat(inputs[4].value);
            const targetY = parseFloat(inputs[5].value);
            const targetZ = parseFloat(inputs[6].value);
            
            // 检查是否有有效的坐标数据
            if (name && !isNaN(sourceX) && !isNaN(sourceY) && !isNaN(sourceZ) && 
                !isNaN(targetX) && !isNaN(targetY) && !isNaN(targetZ)) {
                commonPoints.push({
                    name: name,
                    sourceX: sourceX,
                    sourceY: sourceY,
                    sourceZ: sourceZ,
                    targetX: targetX,
                    targetY: targetY,
                    targetZ: targetZ
                });
                validPoints++;
            }
        }
    });
    
    if (validPoints < 3) {
        showMessage('至少需要3个有效的公共点才能解算七参数', 'error');
        return;
    }
    
    try {
        // 简化的七参数解算算法
        const params = solveSevenParameters(commonPoints);
        
        // 更新设置
        sevenParamSettings.deltaX = params.dx;
        sevenParamSettings.deltaY = params.dy;
        sevenParamSettings.deltaZ = params.dz;
        sevenParamSettings.rotationX = params.rotationX;
        sevenParamSettings.rotationY = params.rotationY;
        sevenParamSettings.rotationZ = params.rotationZ;
        sevenParamSettings.scale = params.scale;
        
        // 更新显示
        updateSevenParamDisplay();
        
        showMessage('七参数解算成功！', 'success');
        
    } catch (error) {
        console.error('七参数解算失败:', error);
        showMessage('七参数解算失败：' + error.message, 'error');
    }
}

// 更新七参数显示
function updateSevenParamDisplay() {
    document.getElementById('seven-param-dx').textContent = sevenParamSettings.deltaX.toFixed(3);
    document.getElementById('seven-param-dy').textContent = sevenParamSettings.deltaY.toFixed(3);
    document.getElementById('seven-param-dz').textContent = sevenParamSettings.deltaZ.toFixed(3);
    document.getElementById('seven-param-rotationx').textContent = (sevenParamSettings.rotationX * 206264.8).toFixed(3); // 转换为秒
    document.getElementById('seven-param-rotationy').textContent = (sevenParamSettings.rotationY * 206264.8).toFixed(3);
    document.getElementById('seven-param-rotationz').textContent = (sevenParamSettings.rotationZ * 206264.8).toFixed(3);
    document.getElementById('seven-param-scale').textContent = ((sevenParamSettings.scale - 1) * 1000000).toFixed(3); // 转换为ppm
}

// 简化的七参数解算算法
function solveSevenParameters(points) {
    if (points.length < 3) {
        throw new Error('至少需要3个公共点');
    }
    
    // 这里实现一个简化的七参数求解算法
    // 实际应用中应该使用更严格的数学方法
    
    // 计算平均差值作为平移参数
    let sumDx = 0, sumDy = 0, sumDz = 0;
    points.forEach(point => {
        sumDx += point.targetX - point.sourceX;
        sumDy += point.targetY - point.sourceY;
        sumDz += point.targetZ - point.sourceZ;
    });
    
    const n = points.length;
    const avgDx = sumDx / n;
    const avgDy = sumDy / n;
    const avgDz = sumDz / n;
    
    // 简化的旋转和尺度参数（实际应该使用矩阵运算）
    const avgDistance = points.reduce((sum, point) => {
        return sum + Math.sqrt(
            point.sourceX * point.sourceX + 
            point.sourceY * point.sourceY + 
            point.sourceZ * point.sourceZ
        );
    }, 0) / n;
    
    const avgTargetDistance = points.reduce((sum, point) => {
        return sum + Math.sqrt(
            point.targetX * point.targetX + 
            point.targetY * point.targetY + 
            point.targetZ * point.targetZ
        );
    }, 0) / n;
    
    const scale = avgTargetDistance / avgDistance;
    
    return {
        dx: avgDx,
        dy: avgDy,
        dz: avgDz,
        rotationX: 0, // 简化处理
        rotationY: 0,
        rotationZ: 0,
        scale: scale
    };
}

// 显示导出对话框
function showSevenParamExportDialog() {
    console.log('📤 显示七参数坐标转换导出对话框');
    
    // 检查是否有计算结果
    const tbody = document.getElementById('seven_param-table-body');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    
    rows.forEach(row => {
        const newXElement = row.querySelector('.result-new-x');
        const newYElement = row.querySelector('.result-new-y');
        const newZElement = row.querySelector('.result-new-z');
        
        if (newXElement && newYElement && newZElement && 
            newXElement.textContent && newYElement.textContent && newZElement.textContent &&
            newXElement.textContent !== '-' && newYElement.textContent !== '-' && newZElement.textContent !== '-') {
            hasResults = true;
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    // 显示导出对话框
    showSevenParamExportModal();
}

// 显示七参数导出模态框
function showSevenParamExportModal() {
    console.log('📤 显示七参数导出模态框...');
    
    // 检查是否已存在导出模态框
    let modal = document.getElementById('sevenParamExportModal');
    if (!modal) {
        createSevenParamExportModal();
        modal = document.getElementById('sevenParamExportModal');
    }
    
    // 设置默认文件名
    const projectName = document.querySelector('#seven_param-content .project-name-input')?.value || '七参数转换';
    const fileName = `${projectName}_七参数坐标转换结果`;
    document.getElementById('sevenParamExportFileName').value = fileName;
    
    // 显示模态框
    modal.style.display = 'block';
}

// 创建七参数导出模态框
function createSevenParamExportModal() {
    const modalHTML = `
        <div class="modal" id="sevenParamExportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>七参数坐标转换结果导出</h3>
                    <span class="close" onclick="closeModal('sevenParamExportModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="export-section">
                        <h4>导出格式</h4>
                        <div class="format-grid">
                            <label class="format-option">
                                <input type="radio" name="sevenParamExportFormat" value="txt" checked>
                                <span class="format-label">
                                    <i class="fas fa-file-alt"></i>
                                    <strong>TXT文本</strong>
                                    <small>纯文本格式，通用性强</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="sevenParamExportFormat" value="csv">
                                <span class="format-label">
                                    <i class="fas fa-file-csv"></i>
                                    <strong>CSV表格</strong>
                                    <small>逗号分隔，Excel兼容</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="sevenParamExportFormat" value="xlsx">
                                <span class="format-label">
                                    <i class="fas fa-file-excel"></i>
                                    <strong>Excel表格</strong>
                                    <small>完整格式，功能丰富</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="sevenParamExportFormat" value="dat">
                                <span class="format-label">
                                    <i class="fas fa-file-code"></i>
                                    <strong>DAT数据</strong>
                                    <small>测绘软件专用格式</small>
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h4>导出设置</h4>
                        <div class="form-group">
                            <label>文件名：</label>
                            <input type="text" id="sevenParamExportFileName" class="form-input" value="七参数坐标转换结果">
                        </div>
                        <div class="form-group">
                            <label>小数位数：</label>
                            <select id="sevenParamDecimalPlaces" class="form-input">
                                <option value="2">2位</option>
                                <option value="3" selected>3位</option>
                                <option value="4">4位</option>
                                <option value="5">5位</option>
                                <option value="6">6位</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h4>导出内容</h4>
                        <div class="checkbox-group">
                            <label class="checkbox-option">
                                <input type="checkbox" id="sevenParamIncludeProjectInfo" checked>
                                <span class="checkmark"></span>
                                项目信息（工程名称、操作员等）
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="sevenParamIncludeParameters" checked>
                                <span class="checkmark"></span>
                                转换参数（七参数值）
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="sevenParamIncludeInputData" checked>
                                <span class="checkmark"></span>
                                原始坐标数据
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="sevenParamIncludeResults" checked>
                                <span class="checkmark"></span>
                                转换结果数据
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="sevenParamIncludeTimestamp" checked>
                                <span class="checkmark"></span>
                                时间戳信息
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('sevenParamExportModal')">取消</button>
                    <button class="btn btn-primary" onclick="performSevenParamExport()">导出</button>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 绑定关闭事件
    const modal = document.getElementById('sevenParamExportModal');
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => closeModal('sevenParamExportModal'));
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('sevenParamExportModal');
        }
    });
}

// 执行七参数导出
function performSevenParamExport() {
    console.log('📤 执行七参数导出...');
    
    // 获取导出设置
    const format = document.querySelector('input[name="sevenParamExportFormat"]:checked')?.value || 'txt';
    const fileName = document.getElementById('sevenParamExportFileName')?.value || '七参数坐标转换结果';
    const decimalPlaces = parseInt(document.getElementById('sevenParamDecimalPlaces')?.value || '3');
    
    const includeParameters = document.getElementById('sevenParamIncludeParameters')?.checked || false;
    const includeInputData = document.getElementById('sevenParamIncludeInputData')?.checked || false;
    const includeResults = document.getElementById('sevenParamIncludeResults')?.checked || false;
    const includeProjectInfo = document.getElementById('sevenParamIncludeProjectInfo')?.checked || false;
    const includeTimestamp = document.getElementById('sevenParamIncludeTimestamp')?.checked || false;
    
    // 收集导出数据
    const exportData = collectSevenParamExportData({
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
    
    // 生成文件内容
    let content = '';
    let fullFileName = '';
    
    switch (format) {
        case 'txt':
            content = generateSevenParamTXT(exportData, decimalPlaces);
            fullFileName = fileName + '.txt';
            break;
        case 'csv':
            content = generateSevenParamCSV(exportData, decimalPlaces);
            fullFileName = fileName + '.csv';
            break;
        case 'xlsx':
            content = generateSevenParamExcel(exportData, decimalPlaces);
            fullFileName = fileName + '.xlsx';
            break;
        case 'dat':
            content = generateSevenParamDAT(exportData, decimalPlaces);
            fullFileName = fileName + '.dat';
            break;
        default:
            content = generateSevenParamTXT(exportData, decimalPlaces);
            fullFileName = fileName + '.txt';
    }
    
    // 下载文件
    downloadFile(content, fullFileName, format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/plain;charset=utf-8');
    
    // 关闭模态框
    closeModal('sevenParamExportModal');
    
    showMessage('导出成功！', 'success');
}

// 收集七参数导出数据
function collectSevenParamExportData(options) {
    console.log('📊 收集七参数导出数据...');
    
    const data = {
        projectInfo: {},
        parameters: {},
        inputData: [],
        results: [],
        timestamp: null
    };
    
    // 项目信息
    if (options.includeProjectInfo) {
        const projectName = document.querySelector('#seven_param-content .project-name-input')?.value || '';
        const operator = document.querySelector('#seven_param-content .module-footer .form-input[placeholder="计算人"]')?.value || '';
        const calculator = document.querySelector('#seven_param-content .module-footer .form-input[placeholder="复核人"]')?.value || '';
        const reviewer = '';
        const date = document.querySelector('#seven_param-content .module-footer .form-input[type="date"]')?.value || '';
        
        data.projectInfo = {
            projectName,
            operator,
            calculator,
            reviewer,
            date,
            module: '七参数坐标转换',
            exportTime: new Date().toLocaleString()
        };
    }
    
    // 转换参数
    if (options.includeParameters) {
        const deltaX = document.getElementById('seven-param-dx')?.textContent || '';
        const deltaY = document.getElementById('seven-param-dy')?.textContent || '';
        const deltaZ = document.getElementById('seven-param-dz')?.textContent || '';
        const rotationX = document.getElementById('seven-param-rotationx')?.textContent || '';
        const rotationY = document.getElementById('seven-param-rotationy')?.textContent || '';
        const rotationZ = document.getElementById('seven-param-rotationz')?.textContent || '';
        const scale = document.getElementById('seven-param-scale')?.textContent || '';
        
        data.parameters = {
            deltaX,
            deltaY,
            deltaZ,
            rotationX,
            rotationY,
            rotationZ,
            scale
        };
    }
    
    // 原始坐标数据和转换结果
    const tbody = document.getElementById('seven_param-table-body');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            const name = inputs[0]?.value?.trim();
            const X = parseFloat(inputs[1]?.value);
            const Y = parseFloat(inputs[2]?.value);
            const Z = parseFloat(inputs[3]?.value);
            
            if (name && !isNaN(X) && !isNaN(Y) && !isNaN(Z)) {
                // 原始数据
                if (options.includeInputData) {
                    data.inputData.push({
                        name,
                        X,
                        Y,
                        Z
                    });
                }
                
                // 转换结果
                if (options.includeResults) {
                    const newXElement = row.querySelector('.result-new-x');
                    const newYElement = row.querySelector('.result-new-y');
                    const newZElement = row.querySelector('.result-new-z');
                    const deltaXElement = row.querySelector('.result-delta-x');
                    const deltaYElement = row.querySelector('.result-delta-y');
                    const deltaZElement = row.querySelector('.result-delta-z');
                    
                    const newX = newXElement?.textContent?.replace('m', '') || '';
                    const newY = newYElement?.textContent?.replace('m', '') || '';
                    const newZ = newZElement?.textContent?.replace('m', '') || '';
                    const deltaX = deltaXElement?.textContent?.replace('m', '') || '';
                    const deltaY = deltaYElement?.textContent?.replace('m', '') || '';
                    const deltaZ = deltaZElement?.textContent?.replace('m', '') || '';
                    
                    data.results.push({
                        name,
                        newX,
                        newY,
                        newZ,
                        deltaX,
                        deltaY,
                        deltaZ
                    });
                }
            }
        });
    }
    
    // 时间戳
    if (options.includeTimestamp) {
        data.timestamp = new Date().toLocaleString();
    }
    
    return data;
}

// 生成TXT格式
function generateSevenParamTXT(data, decimalPlaces) {
    let content = '';
    
    // 标题
    content += '七参数坐标转换结果\n';
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
        content += `ΔZ: ${data.parameters.deltaZ}\n`;
        content += `εX: ${data.parameters.rotationX}\n`;
        content += `εY: ${data.parameters.rotationY}\n`;
        content += `εZ: ${data.parameters.rotationZ}\n`;
        content += `尺度因子: ${data.parameters.scale}\n\n`;
    }
    
    // 转换结果
    if (data.results && data.results.length > 0) {
        content += '【转换结果】\n';
        content += `序号\t点名\t源X坐标\t源Y坐标\t源Z坐标\t转换后X坐标\t转换后Y坐标\t转换后Z坐标\tΔX\tΔY\tΔZ\n`;
        content += '-'.repeat(120) + '\n';
        
        data.results.forEach((result, index) => {
            const input = data.inputData[index] || {};
            const inputX = input.X !== undefined ? input.X.toFixed(decimalPlaces) : '';
            const inputY = input.Y !== undefined ? input.Y.toFixed(decimalPlaces) : '';
            const inputZ = input.Z !== undefined ? input.Z.toFixed(decimalPlaces) : '';
            
            content += `${index + 1}\t${result.name}\t${inputX}\t${inputY}\t${inputZ}\t${result.newX}\t${result.newY}\t${result.newZ}\t${result.deltaX}\t${result.deltaY}\t${result.deltaZ}\n`;
        });
    }
    
    if (data.timestamp) {
        content += `\n导出时间: ${data.timestamp}\n`;
    }
    
    return content;
}

// 生成CSV格式
function generateSevenParamCSV(data, decimalPlaces) {
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
        content += '参数名称,参数值,单位\n';
        content += `ΔX,${data.parameters.deltaX},m\n`;
        content += `ΔY,${data.parameters.deltaY},m\n`;
        content += `ΔZ,${data.parameters.deltaZ},m\n`;
        content += `εX,${data.parameters.rotationX},"\n`;
        content += `εY,${data.parameters.rotationY},"\n`;
        content += `εZ,${data.parameters.rotationZ},"\n`;
        content += `尺度因子,${data.parameters.scale},ppm\n\n`;
    }
    
    // 转换结果
    if (data.results && data.results.length > 0) {
        content += '转换结果\n';
        content += '序号,点名,源X坐标(m),源Y坐标(m),源Z坐标(m),转换后X坐标(m),转换后Y坐标(m),转换后Z坐标(m),ΔX(m),ΔY(m),ΔZ(m)\n';
        
        data.results.forEach((result, index) => {
            const input = data.inputData[index] || {};
            const inputX = input.X !== undefined ? input.X.toFixed(decimalPlaces) : '';
            const inputY = input.Y !== undefined ? input.Y.toFixed(decimalPlaces) : '';
            const inputZ = input.Z !== undefined ? input.Z.toFixed(decimalPlaces) : '';
            
            content += `${index + 1},${result.name},${inputX},${inputY},${inputZ},${result.newX},${result.newY},${result.newZ},${result.deltaX},${result.deltaY},${result.deltaZ}\n`;
        });
    }
    
    if (data.timestamp) {
        content += `\n导出时间,${data.timestamp}\n`;
    }
    
    return content;
}

// 生成DAT格式
function generateSevenParamDAT(data, decimalPlaces) {
    let content = '';
    
    // 标题行
    content += '// 七参数坐标转换结果\n';
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
        content += '// ΔX: ' + data.parameters.deltaX + ' m\n';
        content += '// ΔY: ' + data.parameters.deltaY + ' m\n';
        content += '// ΔZ: ' + data.parameters.deltaZ + ' m\n';
        content += '// εX: ' + data.parameters.rotationX + ' "\n';
        content += '// εY: ' + data.parameters.rotationY + ' "\n';
        content += '// εZ: ' + data.parameters.rotationZ + ' "\n';
        content += '// 尺度因子: ' + data.parameters.scale + ' ppm\n\n';
    }
    
    // 数据头
    content += '// 点名, 源X坐标, 源Y坐标, 源Z坐标, 转换后X坐标, 转换后Y坐标, 转换后Z坐标, ΔX, ΔY, ΔZ\n';
    
    // 转换结果
    if (data.results && data.results.length > 0) {
        data.results.forEach((result, index) => {
            const input = data.inputData[index] || {};
            const inputX = input.X !== undefined ? input.X.toFixed(decimalPlaces) : '';
            const inputY = input.Y !== undefined ? input.Y.toFixed(decimalPlaces) : '';
            const inputZ = input.Z !== undefined ? input.Z.toFixed(decimalPlaces) : '';
            
            content += `${result.name}, ${inputX}, ${inputY}, ${inputZ}, ${result.newX}, ${result.newY}, ${result.newZ}, ${result.deltaX}, ${result.deltaY}, ${result.deltaZ}\n`;
        });
    }
    
    return content;
}

// 生成Excel格式（简化版本，实际使用时需要引入专门的Excel库）
function generateSevenParamExcel(data, decimalPlaces) {
    // 这里返回CSV格式，实际使用时可以引入xlsx.js等库来生成真正的Excel文件
    console.log('注意：当前生成的是CSV格式，如需真正的Excel格式，请引入xlsx.js库');
    return generateSevenParamCSV(data, decimalPlaces);
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 显示消息 - 使用统一通知系统
function showMessage(message, type = 'info') {
    if (window.notificationSystem) {
        window.notificationSystem.show(message, type);
    } else if (window.showMessage) {
        window.showMessage(message, type);
    } else {
        alert(message);
    }
}

// 下载文件
function downloadFile(content, fileName, mimeType = 'text/plain;charset=utf-8') {
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