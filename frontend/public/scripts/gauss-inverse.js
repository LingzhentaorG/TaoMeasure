// 高斯投影反算模块 - 完善版本
console.log('🔧 加载高斯投影反算模块...');

// 全局设置对象
let gaussInverseSettings = {
    ellipsoid: 'CGCS2000',
    semiMajor: 6378137,
    flattening: 298.257222101,
    centralMeridian: 114,
    projectionHeight: 0,
    enable500km: true,
    coordDecimals: 6,
    angleFormat: 'dms'
};

// 椭球参数
const ELLIPSOID_PARAMS_INVERSE = {
    'CGCS2000': { a: 6378137, f: 298.257222101 },
    'WGS84': { a: 6378137, f: 298.257223563 },
    'Xian80': { a: 6378140, f: 298.257 },
    'Beijing54': { a: 6378245, f: 298.3 }
};

// 初始化高斯投影反算功能
function initializeGaussInverse() {
    console.log('🚀 初始化高斯投影反算功能...');
    
    setTimeout(() => {
        console.log('📋 开始初始化表格...');
        initializeGaussInverseTable();
        
        console.log('🔗 开始绑定事件...');
        bindGaussInverseEvents();
        
        console.log('📊 更新参数显示...');
        updateGaussInverseParametersDisplay();
        
        console.log('✅ 高斯投影反算模块初始化完成');
    }, 100);
}

// 绑定高斯投影反算事件
function bindGaussInverseEvents() {
    console.log('🔗 绑定高斯投影反算事件...');
    
    const gaussContent = document.getElementById('gauss_inverse-content');
    if (!gaussContent) {
        console.error('✗ 找不到高斯投影反算内容区域');
        return;
    }
    
    // 导入按钮
    const importBtn = gaussContent.querySelector('[data-action="import-data"]');
    if (importBtn) {
        console.log('✓ 找到导入按钮，绑定事件');
        importBtn.removeAttribute('data-action');
        importBtn.setAttribute('data-gauss-inverse-action', 'import-data');
        
        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入数据按钮');
            openGaussInverseImportDialog();
        });
    } else {
        console.error('✗ 找不到导入按钮');
    }
    
    // 计算方案按钮
    const settingsBtn = gaussContent.querySelector('[data-action="settings"]');
    if (settingsBtn) {
        console.log('✓ 找到计算方案按钮，绑定事件');
        settingsBtn.removeAttribute('data-action');
        settingsBtn.setAttribute('data-gauss-inverse-action', 'settings');
        
        // 移除可能存在的onclick属性
        settingsBtn.removeAttribute('onclick');
        
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ 点击计算方案按钮');
            openGaussInverseSettings();
        });
    } else {
        console.error('✗ 找不到计算方案按钮');
    }
    
    // 计算按钮
    const calculateBtn = gaussContent.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        console.log('✓ 找到计算按钮，绑定事件');
        calculateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🧮 点击开始计算按钮');
            performGaussInverseCalculation();
        });
    } else {
        console.error('✗ 找不到计算按钮');
    }
    
    // 导出按钮
    const exportBtn = gaussContent.querySelector('[data-action="export-result"]');
    if (exportBtn) {
        console.log('✓ 找到导出按钮，绑定事件');
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📤 点击导出成果按钮');
            exportGaussInverseResults();
        });
    } else {
        console.error('✗ 找不到导出按钮');
    }
    
    // 绑定表格控制按钮
    const addRowBtn = document.getElementById('gaussInverseAddRowBtn');
    if (addRowBtn) {
        console.log('✓ 找到添加行按钮');
        addRowBtn.addEventListener('click', () => {
            console.log('➕ 添加新行');
            addGaussInverseRow();
        });
    }
    
    const deleteRowBtn = document.getElementById('gaussInverseDeleteRowBtn');
    if (deleteRowBtn) {
        console.log('✓ 找到删除行按钮');
        deleteRowBtn.addEventListener('click', () => {
            console.log('➖ 删除选中行');
            deleteSelectedGaussInverseRows();
        });
    }
    
    const clearBtn = document.getElementById('gaussInverseClearBtn');
    if (clearBtn) {
        console.log('✓ 找到清空按钮');
        clearBtn.addEventListener('click', () => {
            console.log('🗑️ 清空数据');
            clearGaussInverseData();
        });
    }
}

// 初始化高斯投影反算表格
function initializeGaussInverseTable() {
    console.log('📋 初始化高斯投影反算表格...');
    
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素 (gauss_inverse-table-body)');
        return;
    }
    
    console.log('✓ 找到表格体元素');
    
    // 清空现有内容
    tbody.innerHTML = '';
    
    // 添加5行数据
    console.log('📝 添加5行数据...');
    for (let i = 1; i <= 5; i++) {
        addGaussInverseRow();
    }
    
    console.log(`✅ 表格初始化完成，共 ${tbody.children.length} 行`);
}

// 添加高斯投影反算行
function addGaussInverseRow(data = {}) {
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td><input type="text" class="point-name param-input" value="${data.name || 'P' + rowCount.toString().padStart(2, '0')}" placeholder="点名"></td>
        <td><input type="number" class="x-input param-input" value="${data.x || ''}" placeholder="X坐标" step="0.001"></td>
        <td><input type="number" class="y-input param-input" value="${data.y || ''}" placeholder="Y坐标" step="0.001"></td>
        <td><span class="result-latitude result-value">-</span></td>
        <td><span class="result-longitude result-value">-</span></td>
        <td><input type="text" class="remark param-input" value="${data.remark || ''}" placeholder="备注"></td>
    `;
    
    tbody.appendChild(row);
    console.log(`✓ 添加第 ${rowCount} 行`);
}

// 收集高斯投影反算数据
function collectGaussInverseData() {
    console.log('📊 收集高斯投影反算数据...');
    
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return [];
    }
    
    const data = [];
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 检查 ${rows.length} 行数据...`);
    
    rows.forEach((row, index) => {
        const pointName = row.querySelector('.point-name')?.value.trim();
        const xInput = row.querySelector('.x-input')?.value.trim();
        const yInput = row.querySelector('.y-input')?.value.trim();
        
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

// 执行高斯投影反算计算
function performGaussInverseCalculation() {
    console.log('🧮 开始执行高斯投影反算计算...');
    
    const data = collectGaussInverseData();
    if (data.length === 0) {
        console.warn('⚠️ 没有有效数据');
        showMessage('请先输入坐标数据。格式示例：X坐标 4000000.123 Y坐标 500000.456', 'warning');
        return;
    }
    
    console.log('📊 开始计算，数据:', data);
    showGaussInverseLoading(true);
    
    const requestData = {
        operation: 'gauss_inverse',
        points: data.map(point => ({
            name: point.name,
            x: point.x,
            y: point.y
        })),
        params: {
            ellipsoid: gaussInverseSettings.ellipsoid,
            central_meridian: gaussInverseSettings.centralMeridian,
            projection_height: gaussInverseSettings.projectionHeight,
            add_500km: gaussInverseSettings.enable500km
        }
    };
    
    console.log('📤 发送请求数据:', requestData);
    
    fetch('http://127.0.0.1:5000/api/coordinate-transform', {
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
        showGaussInverseLoading(false);
        if (result.success) {
            displayGaussInverseResults(result.data);
            showMessage('高斯投影反算计算完成', 'success');
        } else {
            console.error('❌ 计算失败:', result.error);
            showMessage('计算失败: ' + result.error, 'error');
        }
    })
    .catch(error => {
        showGaussInverseLoading(false);
        console.error('❌ 计算错误:', error);
        showMessage('计算过程中发生错误: ' + error.message, 'error');
    });
}

// 显示计算结果
function displayGaussInverseResults(results) {
    console.log('📊 显示计算结果...');
    
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 显示结果，结果数量: ${results.length}, 表格行数: ${rows.length}`);
    
    results.forEach((result, index) => {
        if (index < rows.length) {
            const row = rows[index];
            
            const latValue = result.output_lat || result.lat || result.latitude;
            const lonValue = result.output_lon || result.lon || result.longitude;
            
            console.log(`第 ${index + 1} 行结果: Lat=${latValue}, Lon=${lonValue}`);
            
            if (latValue !== undefined) {
                const latElement = row.querySelector('.result-latitude');
                if (latElement) {
                    latElement.textContent = formatDMS(latValue, 'lat');
                }
            }
            if (lonValue !== undefined) {
                const lonElement = row.querySelector('.result-longitude');
                if (lonElement) {
                    lonElement.textContent = formatDMS(lonValue, 'lon');
                }
            }
        }
    });
    
    console.log('✅ 结果显示完成');
}

// 格式化度分秒
function formatDMS(decimal, type) {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = ((abs - degrees) * 60 - minutes) * 60;
    
    const direction = type === 'lat' ? (decimal >= 0 ? 'N' : 'S') : (decimal >= 0 ? 'E' : 'W');
    
    return `${degrees}°${minutes}'${seconds.toFixed(3)}"${direction}`;
}

// 显示加载状态
function showGaussInverseLoading(show) {
    const gaussContent = document.getElementById('gauss_inverse-content');
    const calculateBtn = gaussContent?.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        calculateBtn.disabled = show;
        const icon = calculateBtn.querySelector('i');
        const text = show ? '计算中...' : '开始计算';
        calculateBtn.innerHTML = `${icon ? icon.outerHTML : '<i class="fas fa-calculator"></i>'} ${text}`;
    }
}

// 打开高斯投影反算设置
function openGaussInverseSettings() {
    console.log('⚙️ 打开高斯投影反算设置...');
    
    const modal = document.getElementById('gaussInverseSettingsModal');
    if (modal) {
        console.log('✓ 找到设置模态框');
        modal.style.display = 'block';
        loadGaussInverseSettingsToForm();
    } else {
        console.error('✗ 找不到设置模态框 (gaussInverseSettingsModal)');
        showMessage('设置界面加载失败', 'error');
        return;
    }
}

// 加载设置到表单
function loadGaussInverseSettingsToForm() {
    console.log('📋 加载设置到表单...');
    
    const form = document.getElementById('gaussInverseSettingsModal');
    if (!form) {
        console.error('✗ 找不到设置表单');
        return;
    }
    
    const ellipsoidSelect = document.getElementById('gauss-inverse-ellipsoid');
    if (ellipsoidSelect) {
        ellipsoidSelect.value = gaussInverseSettings.ellipsoid;
        console.log(`✓ 设置椭球: ${gaussInverseSettings.ellipsoid}`);
    }
    
    const meridianInput = document.getElementById('gauss-inverse-central-meridian');
    if (meridianInput) {
        meridianInput.value = gaussInverseSettings.centralMeridian;
        console.log(`✓ 设置中央子午线: ${gaussInverseSettings.centralMeridian}`);
    }
    
    const heightInput = document.getElementById('gauss-inverse-projection-height');
    if (heightInput) {
        heightInput.value = gaussInverseSettings.projectionHeight;
        console.log(`✓ 设置投影面高程: ${gaussInverseSettings.projectionHeight}`);
    }
    
    const enable500kmCheck = document.getElementById('gauss-inverse-500km');
    if (enable500kmCheck) {
        enable500kmCheck.checked = gaussInverseSettings.enable500km;
        console.log(`✓ 设置500km偏移: ${gaussInverseSettings.enable500km}`);
    }
}

// 保存高斯投影反算设置
function saveGaussInverseSettings() {
    console.log('💾 保存高斯投影反算设置...');
    
    const form = document.getElementById('gaussInverseSettingsModal');
    if (!form) {
        console.error('✗ 找不到设置表单');
        return;
    }
    
    const ellipsoidSelect = document.getElementById('gauss-inverse-ellipsoid');
    const meridianInput = document.getElementById('gauss-inverse-central-meridian');
    const heightInput = document.getElementById('gauss-inverse-projection-height');
    const enable500kmCheck = document.getElementById('gauss-inverse-500km');
    
    if (ellipsoidSelect) {
        gaussInverseSettings.ellipsoid = ellipsoidSelect.value;
        console.log(`✓ 保存椭球: ${gaussInverseSettings.ellipsoid}`);
    }
    
    if (meridianInput) {
        gaussInverseSettings.centralMeridian = parseFloat(meridianInput.value) || 114;
        console.log(`✓ 保存中央子午线: ${gaussInverseSettings.centralMeridian}`);
    }
    
    if (heightInput) {
        gaussInverseSettings.projectionHeight = parseFloat(heightInput.value) || 0;
        console.log(`✓ 保存投影面高程: ${gaussInverseSettings.projectionHeight}`);
    }
    
    if (enable500kmCheck) {
        gaussInverseSettings.enable500km = enable500kmCheck.checked;
        console.log(`✓ 保存500km偏移: ${gaussInverseSettings.enable500km}`);
    }
    
    updateGaussInverseParametersDisplay();
    closeModal('gaussInverseSettingsModal');
    showMessage('计算方案设置已保存', 'success');
    
    console.log('✅ 设置保存完成');
}

// 更新参数显示
function updateGaussInverseParametersDisplay() {
    console.log('📊 更新参数显示...');
    
    const ellipsoidElement = document.getElementById('current-inverse-ellipsoid');
    if (ellipsoidElement) {
        ellipsoidElement.textContent = gaussInverseSettings.ellipsoid;
    }
    
    const meridianElement = document.getElementById('current-inverse-central-meridian');
    if (meridianElement) {
        meridianElement.textContent = gaussInverseSettings.centralMeridian;
    }
    
    const heightElement = document.getElementById('current-inverse-projection-height');
    if (heightElement) {
        heightElement.textContent = gaussInverseSettings.projectionHeight;
    }
    
    console.log('✅ 参数显示更新完成');
}

// 打开导入对话框
function openGaussInverseImportDialog() {
    console.log('📥 打开导入对话框...');
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.dat,.csv';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`📁 选择文件: ${file.name}`);
            handleGaussInverseFileImport(file);
        }
        document.body.removeChild(fileInput);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// 处理文件导入
function handleGaussInverseFileImport(file) {
    console.log('📥 处理文件导入...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log('📄 文件内容长度:', content.length);
            
            const data = parseGaussInverseFileContent(content);
            console.log('📊 解析后的数据:', data);
            
            if (data.length === 0) {
                showMessage('文件中没有有效数据。请确保文件格式正确：点名 X坐标 Y坐标', 'warning');
                return;
            }
            
            importGaussInverseData(data);
        } catch (error) {
            console.error('❌ 文件解析错误:', error);
            showMessage('文件格式错误: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file, 'utf-8');
}

// 解析文件内容
function parseGaussInverseFileContent(content) {
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
function importGaussInverseData(data) {
    console.log('📥 导入数据到表格...');
    
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
        addGaussInverseRow({
            name: item.name,
            x: item.x,
            y: item.y
        });
    });
    
    while (tbody.children.length < Math.max(5, data.length)) {
        addGaussInverseRow();
    }
    
    showMessage(`✅ 成功导入 ${data.length} 个点的数据`, 'success');
    console.log(`✅ 导入完成，表格共 ${tbody.children.length} 行`);
}

// 删除选中的行
function deleteSelectedGaussInverseRows() {
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (!tbody) return;
    
    const selectedRows = tbody.querySelectorAll('tr input.row-select:checked');
    if (selectedRows.length === 0) {
        showMessage('请先选择要删除的行', 'warning');
        return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedRows.length} 行吗？`)) {
        selectedRows.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row) {
                row.remove();
            }
        });
        console.log(`✅ 删除了 ${selectedRows.length} 行`);
    }
}

// 清空高斯投影反算数据
function clearGaussInverseData() {
    if (confirm('确定要清空所有高斯投影反算数据吗？')) {
        const tbody = document.getElementById('gauss_inverse-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                addGaussInverseRow();
            }
            console.log('✅ 数据已清空，重新添加5行');
        }
    }
}

// 导出高斯投影反算结果
function exportGaussInverseResults() {
    console.log('📤 导出高斯投影反算结果...');
    
    // 检查是否有计算结果
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    
    rows.forEach(row => {
        const latResult = row.querySelector('.result-latitude')?.textContent;
        const lonResult = row.querySelector('.result-longitude')?.textContent;
        if (latResult && lonResult && latResult !== '-' && lonResult !== '-') {
            hasResults = true;
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    // 显示导出对话框
    showGaussInverseExportDialog();
}

// 显示高斯投影反算导出对话框
function showGaussInverseExportDialog() {
    console.log('📤 显示高斯投影反算导出对话框...');
    
    // 检查是否已存在导出模态框
    let modal = document.getElementById('gaussInverseExportModal');
    if (!modal) {
        createGaussInverseExportModal();
        modal = document.getElementById('gaussInverseExportModal');
    }
    
    // 设置默认文件名
    const projectName = document.getElementById('projectName')?.value || '工程测量';
    const fileName = `${projectName}_高斯投影反算结果`;
    document.getElementById('gaussInverseExportFileName').value = fileName;
    
    // 显示模态框
    modal.style.display = 'block';
}

// 创建高斯投影反算导出模态框
function createGaussInverseExportModal() {
    const modalHTML = `
        <div class="modal" id="gaussInverseExportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>高斯投影反算结果导出</h3>
                    <span class="close" onclick="closeModal('gaussInverseExportModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="export-section">
                        <h4>导出格式</h4>
                        <div class="format-grid">
                            <label class="format-option">
                                <input type="radio" name="gaussInverseExportFormat" value="txt" checked>
                                <span class="format-label">
                                    <i class="fas fa-file-alt"></i>
                                    <strong>TXT文本</strong>
                                    <small>纯文本格式，通用性强</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussInverseExportFormat" value="dat">
                                <span class="format-label">
                                    <i class="fas fa-database"></i>
                                    <strong>DAT数据</strong>
                                    <small>测量数据标准格式</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussInverseExportFormat" value="csv">
                                <span class="format-label">
                                    <i class="fas fa-table"></i>
                                    <strong>CSV表格</strong>
                                    <small>逗号分隔值格式</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussInverseExportFormat" value="excel">
                                <span class="format-label">
                                    <i class="fas fa-file-excel"></i>
                                    <strong>Excel表格</strong>
                                    <small>Microsoft Excel格式</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussInverseExportFormat" value="word">
                                <span class="format-label">
                                    <i class="fas fa-file-word"></i>
                                    <strong>Word文档</strong>
                                    <small>Microsoft Word格式</small>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>导出内容</h4>
                        <div class="content-options">
                            <label><input type="checkbox" id="gaussInverseIncludeParameters" checked> 计算参数</label>
                            <label><input type="checkbox" id="gaussInverseIncludeInputData" checked> 输入数据</label>
                            <label><input type="checkbox" id="gaussInverseIncludeResults" checked> 计算结果</label>
                            <label><input type="checkbox" id="gaussInverseIncludeProjectInfo" checked> 项目信息</label>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>文件设置</h4>
                        <div class="file-settings">
                            <div class="param-row">
                                <label>文件名:</label>
                                <input type="text" id="gaussInverseExportFileName" placeholder="高斯投影反算结果">
                            </div>
                            <div class="param-row">
                                <label><input type="checkbox" id="gaussInverseIncludeTimestamp" checked> 包含时间戳</label>
                            </div>
                            <div class="param-row">
                                <label>角度小数位数:</label>
                                <select id="gaussInverseDecimalPlaces">
                                    <option value="3">3位</option>
                                    <option value="4">4位</option>
                                    <option value="5">5位</option>
                                    <option value="6" selected>6位</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="tool-btn" onclick="closeModal('gaussInverseExportModal')">取消</button>
                    <button class="tool-btn primary" onclick="performGaussInverseExport()">导出</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 执行高斯投影反算导出
function performGaussInverseExport() {
    try {
        // 获取导出设置
        const format = document.querySelector('input[name="gaussInverseExportFormat"]:checked').value;
        const fileName = document.getElementById('gaussInverseExportFileName').value || '高斯投影反算结果';
        const includeTimestamp = document.getElementById('gaussInverseIncludeTimestamp').checked;
        const decimalPlaces = parseInt(document.getElementById('gaussInverseDecimalPlaces').value);

        // 获取导出内容选项
        const contentOptions = {
            parameters: document.getElementById('gaussInverseIncludeParameters').checked,
            inputData: document.getElementById('gaussInverseIncludeInputData').checked,
            results: document.getElementById('gaussInverseIncludeResults').checked,
            projectInfo: document.getElementById('gaussInverseIncludeProjectInfo').checked
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
                exportGaussInverseToTxt(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'dat':
                exportGaussInverseToDat(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'csv':
                exportGaussInverseToCsv(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'excel':
                exportGaussInverseToExcel(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'word':
                exportGaussInverseToWord(finalFileName, contentOptions, decimalPlaces);
                break;
            default:
                throw new Error('不支持的导出格式');
        }

        // 关闭模态框
        closeModal('gaussInverseExportModal');
        showMessage(`成功导出为 ${format.toUpperCase()} 格式`, 'success');

    } catch (error) {
        console.error('导出失败:', error);
        showMessage('导出失败: ' + error.message, 'error');
    }
}

// 收集高斯投影反算导出数据
function collectGaussInverseExportData(contentOptions, decimalPlaces) {
    const data = {
        projectInfo: {},
        inputData: [],
        results: [],
        parameters: {}
    };

    // 项目信息
    if (contentOptions.projectInfo) {
        data.projectInfo = {
            projectName: document.getElementById('projectName')?.value || '',
            functionName: '高斯投影反算',
            calcDate: document.getElementById('calcDate')?.value || new Date().toISOString().slice(0, 10),
            calculator: document.getElementById('calculator')?.value || '',
            checker: document.getElementById('checker')?.value || '',
            exportTime: new Date().toLocaleString('zh-CN')
        };
    }

    // 计算参数
    if (contentOptions.parameters) {
        data.parameters = {
            ellipsoid: gaussInverseSettings.ellipsoid,
            centralMeridian: gaussInverseSettings.centralMeridian,
            projectionHeight: gaussInverseSettings.projectionHeight,
            enable500km: gaussInverseSettings.enable500km,
            coordDecimals: gaussInverseSettings.coordDecimals,
            angleFormat: gaussInverseSettings.angleFormat
        };
    }

    // 输入数据和结果
    const tbody = document.getElementById('gauss_inverse-table-body');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const pointName = row.querySelector('.point-name')?.value.trim();
            const xInput = row.querySelector('.x-input')?.value.trim();
            const yInput = row.querySelector('.y-input')?.value.trim();
            const latResult = row.querySelector('.result-latitude')?.textContent;
            const lonResult = row.querySelector('.result-longitude')?.textContent;
            const remark = row.querySelector('.remark')?.value.trim();

            if (pointName && xInput && yInput) {
                const inputPoint = {
                    name: pointName,
                    x: parseFloat(xInput),
                    y: parseFloat(yInput),
                    remark: remark || ''
                };

                if (contentOptions.inputData) {
                    data.inputData.push(inputPoint);
                }

                if (contentOptions.results && latResult && lonResult && latResult !== '-' && lonResult !== '-') {
                    data.results.push({
                        ...inputPoint,
                        latitude: latResult,
                        longitude: lonResult
                    });
                }
            }
        });
    }

    return data;
}

// 导出为TXT格式
function exportGaussInverseToTxt(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussInverseExportData(contentOptions, decimalPlaces);
    let content = '';

    // 项目信息
    if (contentOptions.projectInfo && data.projectInfo) {
        content += '='.repeat(60) + '\n';
        content += '                高斯投影反算计算结果报告\n';
        content += '='.repeat(60) + '\n';
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
        content += `中央子午线: ${data.parameters.centralMeridian}°\n`;
        content += `投影面高程: ${data.parameters.projectionHeight}m\n`;
        content += `500km偏移: ${data.parameters.enable500km ? '启用' : '禁用'}\n`;
        content += `角度格式: ${data.parameters.angleFormat === 'dms' ? '度分秒' : '十进制度'}\n\n`;
    }

    // 输入数据
    if (contentOptions.inputData && data.inputData.length > 0) {
        content += '-'.repeat(60) + '\n';
        content += '输入数据\n';
        content += '-'.repeat(60) + '\n';
        content += '点名'.padEnd(12) + 'X坐标(m)'.padEnd(15) + 'Y坐标(m)'.padEnd(15) + '备注\n';
        content += '-'.repeat(60) + '\n';
        
        data.inputData.forEach(point => {
            content += `${point.name.padEnd(12)}${point.x.toFixed(3).padEnd(15)}${point.y.toFixed(3).padEnd(15)}${point.remark.padEnd(10)}\n`;
        });
        content += '\n';
    }

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        content += '-'.repeat(60) + '\n';
        content += '计算结果\n';
        content += '-'.repeat(60) + '\n';
        content += '点名'.padEnd(12) + '纬度'.padEnd(20) + '经度'.padEnd(20) + '备注\n';
        content += '-'.repeat(60) + '\n';
        
        data.results.forEach(result => {
            content += `${result.name.padEnd(12)}${result.latitude.padEnd(20)}${result.longitude.padEnd(20)}${result.remark.padEnd(10)}\n`;
        });
        content += '\n';
    }

    downloadFile(content, `${fileName}.txt`, 'text/plain;charset=utf-8');
}

// 导出为CSV格式
function exportGaussInverseToCsv(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussInverseExportData(contentOptions, decimalPlaces);
    const csvData = [];

    // 项目信息
    if (contentOptions.projectInfo) {
        csvData.push(['高斯投影反算计算结果']);
        csvData.push(['项目名称', data.projectInfo?.projectName || '']);
        csvData.push(['计算功能', data.projectInfo?.functionName || '']);
        csvData.push(['计算日期', data.projectInfo?.calcDate || '']);
        csvData.push(['计算员', data.projectInfo?.calculator || '']);
        csvData.push(['复核员', data.projectInfo?.checker || '']);
        csvData.push([]);
    }

    // 计算参数
    if (contentOptions.parameters) {
        csvData.push(['计算参数']);
        csvData.push(['椭球类型', data.parameters?.ellipsoid || '']);
        csvData.push(['中央子午线', data.parameters?.centralMeridian + '°' || '']);
        csvData.push(['投影面高程', data.parameters?.projectionHeight + 'm' || '']);
        csvData.push(['500km偏移', data.parameters?.enable500km ? '启用' : '禁用']);
        csvData.push([]);
    }

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        csvData.push(['计算结果']);
        csvData.push(['点名', 'X坐标(m)', 'Y坐标(m)', '纬度', '经度', '备注']);
        data.results.forEach(result => {
            csvData.push([
                result.name,
                result.x.toFixed(3),
                result.y.toFixed(3),
                result.latitude,
                result.longitude,
                result.remark || ''
            ]);
        });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8');
}

// 导出为Excel格式
function exportGaussInverseToExcel(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussInverseExportData(contentOptions, decimalPlaces);
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
    htmlContent += `<div class="title">高斯投影反算计算结果</div>`;

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

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        htmlContent += `
            <div class="section">
                <h3>计算结果</h3>
                <table>
                    <tr>
                        <th>点名</th><th>X坐标(m)</th><th>Y坐标(m)</th><th>纬度</th><th>经度</th><th>备注</th>
                    </tr>
        `;
        data.results.forEach(result => {
            htmlContent += `
                <tr>
                    <td>${result.name}</td>
                    <td>${result.x.toFixed(3)}</td>
                    <td>${result.y.toFixed(3)}</td>
                    <td>${result.latitude}</td>
                    <td>${result.longitude}</td>
                    <td>${result.remark || ''}</td>
                </tr>
            `;
        });
        htmlContent += '</table></div>';
    }

    htmlContent += '</body></html>';
    downloadFile(htmlContent, `${fileName}.xls`, 'application/vnd.ms-excel;charset=utf-8');
}

// 导出为Word格式
function exportGaussInverseToWord(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussInverseExportData(contentOptions, decimalPlaces);
    let htmlContent = `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: '宋体', SimSun, serif; font-size: 12pt; line-height: 1.5; }
                .title { font-size: 16pt; font-weight: bold; text-align: center; margin: 20px 0; }
                .subtitle { font-size: 14pt; font-weight: bold; margin: 15px 0 10px 0; }
                table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                th, td { border: 1px solid #000; padding: 6px; text-align: center; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .info-table td:first-child { text-align: right; font-weight: bold; width: 120px; }
                .info-table td:last-child { text-align: left; }
            </style>
        </head>
        <body>
    `;

    // 标题
    htmlContent += `<div class="title">高斯投影反算计算结果报告</div>`;

    // 项目信息
    if (contentOptions.projectInfo) {
        htmlContent += `
            <div class="subtitle">一、项目基本信息</div>
            <table class="info-table">
                <tr><td>项目名称：</td><td>${data.projectInfo?.projectName || ''}</td></tr>
                <tr><td>计算功能：</td><td>${data.projectInfo?.functionName || ''}</td></tr>
                <tr><td>计算日期：</td><td>${data.projectInfo?.calcDate || ''}</td></tr>
                <tr><td>计算员：</td><td>${data.projectInfo?.calculator || ''}</td></tr>
                <tr><td>复核员：</td><td>${data.projectInfo?.checker || ''}</td></tr>
            </table>
        `;
    }

    // 计算参数
    if (contentOptions.parameters) {
        htmlContent += `
            <div class="subtitle">二、计算参数</div>
            <table class="info-table">
                <tr><td>椭球类型：</td><td>${data.parameters?.ellipsoid || ''}</td></tr>
                <tr><td>中央子午线：</td><td>${data.parameters?.centralMeridian}°</td></tr>
                <tr><td>投影面高程：</td><td>${data.parameters?.projectionHeight}m</td></tr>
                <tr><td>500km偏移：</td><td>${data.parameters?.enable500km ? '启用' : '禁用'}</td></tr>
            </table>
        `;
    }

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        htmlContent += `
            <div class="subtitle">三、计算结果</div>
            <table>
                <tr>
                    <th>序号</th><th>点名</th><th>X坐标(m)</th><th>Y坐标(m)</th><th>纬度</th><th>经度</th><th>备注</th>
                </tr>
        `;
        data.results.forEach((result, index) => {
            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${result.name}</td>
                    <td>${result.x.toFixed(3)}</td>
                    <td>${result.y.toFixed(3)}</td>
                    <td>${result.latitude}</td>
                    <td>${result.longitude}</td>
                    <td>${result.remark || ''}</td>
                </tr>
            `;
        });
        htmlContent += '</table>';
    }

    htmlContent += '</body></html>';
    downloadFile(htmlContent, `${fileName}.doc`, 'application/msword;charset=utf-8');
}

// 导出为DAT格式
function exportGaussInverseToDat(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussInverseExportData(contentOptions, decimalPlaces);
    let content = '';

    // DAT格式头部信息
    content += `# 高斯投影反算数据文件
`;
    content += `# 项目: ${data.projectInfo?.projectName || ''}
`;
    content += `# 日期: ${data.projectInfo?.calcDate || ''}
`;
    content += `# 格式: 点名,X坐标,Y坐标,纬度,经度
`;
    content += `#
`;

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        content += `# 高斯投影反算结果
`;
        data.results.forEach(result => {
            content += `${result.name},${result.x.toFixed(3)},${result.y.toFixed(3)},` +
                      `${result.latitude},${result.longitude}
`;
        });
    }

    downloadFile(content, `${fileName}.dat`, 'text/plain;charset=utf-8');
}

// 下载文件函数
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 绑定设置保存按钮事件
document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveGaussInverseSettingsBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveGaussInverseSettings);
        console.log('✓ 绑定高斯投影反算设置保存按钮事件');
    }
});



// 更新参数显示
function updateGaussInverseParametersDisplay() {
    console.log('📊 更新参数显示...');
    
    const ellipsoidElement = document.getElementById('gauss-inverse-ellipsoid-display');
    if (ellipsoidElement) {
        ellipsoidElement.textContent = gaussInverseSettings.ellipsoid;
    }
    
    const semiMajorElement = document.getElementById('gauss-inverse-semi-major-display');
    if (semiMajorElement) {
        semiMajorElement.textContent = gaussInverseSettings.semiMajor;
    }
    
    const flatteningElement = document.getElementById('gauss-inverse-flattening-display');
    if (flatteningElement) {
        flatteningElement.textContent = gaussInverseSettings.flattening;
    }
    
    const meridianElement = document.getElementById('gauss-inverse-central-meridian-display');
    if (meridianElement) {
        meridianElement.textContent = gaussInverseSettings.centralMeridian;
    }
    
    const heightElement = document.getElementById('gauss-inverse-projection-height-display');
    if (heightElement) {
        heightElement.textContent = gaussInverseSettings.projectionHeight;
    }
    
    console.log('✅ 参数显示更新完成');
}

// 导出全局函数
window.initializeGaussInverse = initializeGaussInverse;
window.initializeGaussInverseTable = initializeGaussInverseTable;
window.bindGaussInverseEvents = bindGaussInverseEvents;
window.performGaussInverseCalculation = performGaussInverseCalculation;
window.openGaussInverseSettings = openGaussInverseSettings;
window.saveGaussInverseSettings = saveGaussInverseSettings;
window.exportGaussInverseResults = exportGaussInverseResults;
window.updateGaussInverseParametersDisplay = updateGaussInverseParametersDisplay;
window.showGaussInverseExportDialog = showGaussInverseExportDialog;
window.performGaussInverseExport = performGaussInverseExport;

console.log('✅ 高斯投影反算模块加载完成');