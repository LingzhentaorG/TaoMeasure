// 高斯投影正算模块 - 修复版本
console.log('🔧 加载高斯投影正算模块...');

// 全局设置对象
let gaussForwardSettings = {
    ellipsoid: 'CGCS2000',
    semiMajor: 6378137,
    flattening: 298.257222101,
    centralMeridian: 114,
    projectionHeight: 0,
    enable500km: true,
    coordDecimals: 3
};

// 椭球参数
const ELLIPSOID_PARAMS = {
    'CGCS2000': { a: 6378137, f: 298.257222101 },
    'WGS84': { a: 6378137, f: 298.257223563 },
    'Xi\'an80': { a: 6378140, f: 298.257 },
    'Beijing54': { a: 6378245, f: 298.3 }
};

// 初始化高斯投影正算功能
function initializeGaussForward() {
    console.log('🚀 初始化高斯投影正算功能...');
    
    setTimeout(() => {
        console.log('📋 开始初始化表格...');
        initializeGaussForwardTable();
        
        console.log('🔗 开始绑定事件...');
        bindGaussForwardEvents();
        
        console.log('📊 更新参数显示...');
        updateGaussParametersDisplay();
        
        console.log('✅ 高斯投影正算模块初始化完成');
    }, 100);
}

// 绑定高斯投影正算事件
function bindGaussForwardEvents() {
    console.log('🔗 绑定高斯投影正算事件...');
    
    const gaussContent = document.getElementById('gauss_forward-content');
    if (!gaussContent) {
        console.error('✗ 找不到高斯投影正算内容区域');
        return;
    }
    
    // 导入按钮
    const importBtn = gaussContent.querySelector('[data-action="import-data"]');
    if (importBtn) {
        console.log('✓ 找到导入按钮，绑定事件');
        importBtn.removeAttribute('data-action');
        importBtn.setAttribute('data-gauss-action', 'import-data');
        
        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入数据按钮');
            openGaussImportDialog();
        });
    } else {
        console.error('✗ 找不到导入按钮');
    }
    
    // 计算方案按钮
    const settingsBtn = gaussContent.querySelector('[data-action="settings"]');
    if (settingsBtn) {
        console.log('✓ 找到计算方案按钮，绑定事件');
        settingsBtn.removeAttribute('data-action');
        settingsBtn.setAttribute('data-gauss-action', 'settings');
        
        // 移除可能存在的onclick属性
        settingsBtn.removeAttribute('onclick');
        
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ 点击计算方案按钮');
            openGaussSettings();
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
            performGaussForwardCalculation();
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
            exportGaussResults();
        });
    } else {
        console.error('✗ 找不到导出按钮');
    }
    
    // 绑定表格控制按钮
    const addRowBtn = document.getElementById('gaussAddRowBtn');
    if (addRowBtn) {
        console.log('✓ 找到添加行按钮');
        addRowBtn.addEventListener('click', () => {
            console.log('➕ 添加新行');
            addGaussForwardRow();
        });
    }
    
    const deleteRowBtn = document.getElementById('gaussDeleteRowBtn');
    if (deleteRowBtn) {
        console.log('✓ 找到删除行按钮');
        deleteRowBtn.addEventListener('click', () => {
            console.log('➖ 删除选中行');
            deleteSelectedGaussRows();
        });
    }
    
    const clearBtn = document.getElementById('gaussClearBtn');
    if (clearBtn) {
        console.log('✓ 找到清空按钮');
        clearBtn.addEventListener('click', () => {
            console.log('🗑️ 清空数据');
            clearGaussForwardData();
        });
    }
}

// 初始化高斯投影正算表格
function initializeGaussForwardTable() {
    console.log('📋 初始化高斯投影正算表格...');
    
    const tbody = document.getElementById('gaussForwardTableBody');
    if (!tbody) {
        console.error('✗ 找不到表格体元素 (gaussForwardTableBody)');
        return;
    }
    
    console.log('✓ 找到表格体元素');
    
    // 清空现有内容
    tbody.innerHTML = '';
    
    // 添加5行数据
    console.log('📝 添加5行数据...');
    for (let i = 1; i <= 5; i++) {
        addGaussForwardRow();
    }
    
    console.log(`✅ 表格初始化完成，共 ${tbody.children.length} 行`);
}

// 添加高斯投影正算行
function addGaussForwardRow(data = {}) {
    const tbody = document.getElementById('gaussForwardTableBody');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td><input type="text" class="point-name param-input" value="${data.name || 'P' + rowCount.toString().padStart(2, '0')}" placeholder="点名"></td>
        <td><input type="text" class="latitude-input param-input" value="${data.latitude || ''}" placeholder="°′″" title="格式：度°分′秒″"></td>
        <td><input type="text" class="longitude-input param-input" value="${data.longitude || ''}" placeholder="°′″" title="格式：度°分′秒″"></td>
        <td><span class="result-x result-value">-</span></td>
        <td><span class="result-y result-value">-</span></td>
        <td><input type="text" class="remark param-input" value="${data.remark || ''}" placeholder="备注"></td>
    `;
    
    tbody.appendChild(row);
    console.log(`✓ 添加第 ${rowCount} 行`);
}

// 收集高斯投影正算数据
function collectGaussForwardData() {
    console.log('📊 收集高斯投影正算数据...');
    
    const tbody = document.getElementById('gaussForwardTableBody');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return [];
    }
    
    const data = [];
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 检查 ${rows.length} 行数据...`);
    
    rows.forEach((row, index) => {
        const pointName = row.querySelector('.point-name')?.value.trim();
        const latInput = row.querySelector('.latitude-input')?.value.trim();
        const lonInput = row.querySelector('.longitude-input')?.value.trim();
        
        console.log(`第 ${index + 1} 行: 点名="${pointName}", 纬度="${latInput}", 经度="${lonInput}"`);
        
        if (pointName && latInput && lonInput) {
            const lat = parseDMSCoordinate(latInput);
            const lon = parseDMSCoordinate(lonInput);
            
            console.log(`解析结果: 纬度=${lat}, 经度=${lon}`);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                data.push({
                    name: pointName,
                    latitude: lat,
                    longitude: lon
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

// 执行高斯投影正算计算
function performGaussForwardCalculation() {
    console.log('🧮 开始执行高斯投影正算计算...');
    
    const data = collectGaussForwardData();
    if (data.length === 0) {
        console.warn('⚠️ 没有有效数据');
        showMessage('请先输入坐标数据。格式示例：纬度 39°33\'46.8" 经度 116°17\'31.2"', 'warning');
        return;
    }
    
    console.log('📊 开始计算，数据:', data);
    showGaussLoading(true);
    
    const requestData = {
        operation: 'gauss_forward',
        points: data.map(point => ({
            name: point.name,
            lat: point.latitude,
            lon: point.longitude
        })),
        params: {
            ellipsoid: gaussForwardSettings.ellipsoid,
            central_meridian: gaussForwardSettings.centralMeridian,
            projection_height: gaussForwardSettings.projectionHeight,
            add_500km: gaussForwardSettings.enable500km
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
        showGaussLoading(false);
        if (result.success) {
            displayGaussResults(result.data);
            showMessage('高斯投影正算计算完成', 'success');
        } else {
            console.error('❌ 计算失败:', result.error);
            showMessage('计算失败: ' + result.error, 'error');
        }
    })
    .catch(error => {
        showGaussLoading(false);
        console.error('❌ 计算错误:', error);
        showMessage('计算过程中发生错误: ' + error.message, 'error');
    });
}

// 显示计算结果
function displayGaussResults(results) {
    console.log('📊 显示计算结果...');
    
    const tbody = document.getElementById('gaussForwardTableBody');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 显示结果，结果数量: ${results.length}, 表格行数: ${rows.length}`);
    
    results.forEach((result, index) => {
        if (index < rows.length) {
            const row = rows[index];
            
            const xValue = result.output_x || result.x;
            const yValue = result.output_y || result.y;
            
            console.log(`第 ${index + 1} 行结果: X=${xValue}, Y=${yValue}`);
            
            if (xValue !== undefined) {
                const xElement = row.querySelector('.result-x');
                if (xElement) {
                    xElement.textContent = parseFloat(xValue).toFixed(gaussForwardSettings.coordDecimals);
                }
            }
            if (yValue !== undefined) {
                const yElement = row.querySelector('.result-y');
                if (yElement) {
                    yElement.textContent = parseFloat(yValue).toFixed(gaussForwardSettings.coordDecimals);
                }
            }
        }
    });
    
    console.log('✅ 结果显示完成');
}

// 显示加载状态
function showGaussLoading(show) {
    const gaussContent = document.getElementById('gauss_forward-content');
    const calculateBtn = gaussContent?.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        calculateBtn.disabled = show;
        const icon = calculateBtn.querySelector('i');
        const text = show ? '计算中...' : '开始计算';
        calculateBtn.innerHTML = `${icon ? icon.outerHTML : '<i class="fas fa-calculator"></i>'} ${text}`;
    }
}

// 解析多种坐标格式
function parseDMSCoordinate(coordStr) {
    if (!coordStr || coordStr.trim() === '') return NaN;
    
    const str = coordStr.trim();
    console.log(`🔍 解析坐标: "${str}"`);
    
    try {
        if (str.includes('°') || str.includes('′') || str.includes('"')) {
            const degMatch = str.match(/(\d+)°/);
            const minMatch = str.match(/(\d+)[′']/);
            const secMatch = str.match(/([\d.]+)[″"]/);
            
            const degrees = degMatch ? parseFloat(degMatch[1]) : 0;
            const minutes = minMatch ? parseFloat(minMatch[1]) : 0;
            const seconds = secMatch ? parseFloat(secMatch[1]) : 0;
            
            const result = degrees + minutes / 60.0 + seconds / 3600.0;
            console.log(`✓ 度分秒格式: ${degrees}°${minutes}'${seconds}" = ${result}`);
            return result;
        }
        
        const coord = parseFloat(str);
        if (!isNaN(coord)) {
            if (coord > 180) {
                const degrees = Math.floor(coord);
                const decimal = coord - degrees;
                const minutes = Math.floor(decimal * 100);
                const seconds = (decimal * 100 - minutes) * 100;
                
                const result = degrees + minutes / 60.0 + seconds / 3600.0;
                console.log(`✓ d.mmss格式: ${coord} = ${result}`);
                return result;
            } else {
                console.log(`✓ 十进制度格式: ${coord}`);
                return coord;
            }
        }
    } catch (error) {
        console.warn('⚠️ 坐标解析失败:', coordStr, error);
        return NaN;
    }
    
    console.warn('⚠️ 无法识别的坐标格式:', coordStr);
    return NaN;
}

// 打开高斯投影设置
function openGaussSettings() {
    console.log('⚙️ 打开高斯投影设置...');
    
    const modal = document.getElementById('gaussForwardSettingsModal');
    if (modal) {
        console.log('✓ 找到设置模态框');
        modal.style.display = 'block';
        loadGaussSettingsToForm();
    } else {
        console.error('✗ 找不到设置模态框 (gaussForwardSettingsModal)');
        showMessage('设置界面加载失败', 'error');
        return;
    }
}

// 加载设置到表单
function loadGaussSettingsToForm() {
    console.log('📋 加载设置到表单...');
    
    const form = document.getElementById('gaussForwardSettingsModal');
    if (!form) {
        console.error('✗ 找不到设置表单');
        return;
    }
    
    const ellipsoidSelect = document.getElementById('gauss-ellipsoid');
    if (ellipsoidSelect) {
        ellipsoidSelect.value = gaussForwardSettings.ellipsoid;
        console.log(`✓ 设置椭球: ${gaussForwardSettings.ellipsoid}`);
    }
    
    const meridianInput = document.getElementById('gauss-central-meridian');
    if (meridianInput) {
        meridianInput.value = gaussForwardSettings.centralMeridian;
        console.log(`✓ 设置中央子午线: ${gaussForwardSettings.centralMeridian}`);
    }
    
    const heightInput = document.getElementById('gauss-projection-height');
    if (heightInput) {
        heightInput.value = gaussForwardSettings.projectionHeight;
        console.log(`✓ 设置投影面高程: ${gaussForwardSettings.projectionHeight}`);
    }
    
    const enable500kmCheck = document.getElementById('gauss-500km');
    if (enable500kmCheck) {
        enable500kmCheck.checked = gaussForwardSettings.enable500km;
        console.log(`✓ 设置500km偏移: ${gaussForwardSettings.enable500km}`);
    }
}

// 保存高斯投影设置
function saveGaussSettings() {
    console.log('💾 保存高斯投影设置...');
    
    const form = document.getElementById('gaussForwardSettingsModal');
    if (!form) {
        console.error('✗ 找不到设置表单');
        return;
    }
    
    const ellipsoidSelect = document.getElementById('gauss-ellipsoid');
    const meridianInput = document.getElementById('gauss-central-meridian');
    const heightInput = document.getElementById('gauss-projection-height');
    const enable500kmCheck = document.getElementById('gauss-500km');
    
    if (ellipsoidSelect) {
        gaussForwardSettings.ellipsoid = ellipsoidSelect.value;
        console.log(`✓ 保存椭球: ${gaussForwardSettings.ellipsoid}`);
    }
    
    if (meridianInput) {
        gaussForwardSettings.centralMeridian = parseFloat(meridianInput.value) || 114;
        console.log(`✓ 保存中央子午线: ${gaussForwardSettings.centralMeridian}`);
    }
    
    if (heightInput) {
        gaussForwardSettings.projectionHeight = parseFloat(heightInput.value) || 0;
        console.log(`✓ 保存投影面高程: ${gaussForwardSettings.projectionHeight}`);
    }
    
    if (enable500kmCheck) {
        gaussForwardSettings.enable500km = enable500kmCheck.checked;
        console.log(`✓ 保存500km偏移: ${gaussForwardSettings.enable500km}`);
    }
    
    updateGaussParametersDisplay();
    closeModal('gaussForwardSettingsModal');
    showMessage('计算方案设置已保存', 'success');
    
    console.log('✅ 设置保存完成');
}

// 更新参数显示
function updateGaussParametersDisplay() {
    console.log('📊 更新参数显示...');
    
    const ellipsoidElement = document.getElementById('current-ellipsoid');
    if (ellipsoidElement) {
        ellipsoidElement.textContent = gaussForwardSettings.ellipsoid;
    }
    
    const meridianElement = document.getElementById('current-central-meridian');
    if (meridianElement) {
        meridianElement.textContent = gaussForwardSettings.centralMeridian;
    }
    
    const heightElement = document.getElementById('current-projection-height');
    if (heightElement) {
        heightElement.textContent = gaussForwardSettings.projectionHeight;
    }
    
    console.log('✅ 参数显示更新完成');
}

// 打开导入对话框
function openGaussImportDialog() {
    console.log('📥 打开导入对话框...');
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.dat,.csv';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`📁 选择文件: ${file.name}`);
            handleGaussFileImport(file);
        }
        document.body.removeChild(fileInput);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// 处理文件导入
function handleGaussFileImport(file) {
    console.log('📥 处理文件导入...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log('📄 文件内容长度:', content.length);
            
            const data = parseGaussFileContent(content);
            console.log('📊 解析后的数据:', data);
            
            if (data.length === 0) {
                showMessage('文件中没有有效数据。请确保文件格式正确：点名 纬度 经度', 'warning');
                return;
            }
            
            importGaussForwardData(data);
        } catch (error) {
            console.error('❌ 文件解析错误:', error);
            showMessage('文件格式错误: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file, 'utf-8');
}

// 解析文件内容
function parseGaussFileContent(content) {
    console.log('🔍 解析文件内容...');
    
    const lines = content.split('\n').filter(line => line.trim());
    const data = [];
    
    lines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
            const name = parts[0];
            const latStr = parts[1];
            const lonStr = parts[2];
            
            const latitude = parseDMSCoordinate(latStr);
            const longitude = parseDMSCoordinate(lonStr);
            
            if (!isNaN(latitude) && !isNaN(longitude)) {
                data.push({
                    name: name,
                    latitude: latStr,
                    longitude: lonStr
                });
                console.log(`✓ 第 ${index + 1} 行: ${name} ${latStr} ${lonStr}`);
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行格式错误: ${line}`);
            }
        }
    });
    
    console.log(`📊 解析完成，共 ${data.length} 个有效数据点`);
    return data;
}

// 导入数据到表格
function importGaussForwardData(data) {
    console.log('📥 导入数据到表格...');
    
    const tbody = document.getElementById('gaussForwardTableBody');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
        addGaussForwardRow({
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude
        });
    });
    
    while (tbody.children.length < Math.max(5, data.length)) {
        addGaussForwardRow();
    }
    
    showMessage(`✅ 成功导入 ${data.length} 个点的数据`, 'success');
    console.log(`✅ 导入完成，表格共 ${tbody.children.length} 行`);
}

// 删除选中的行
function deleteSelectedGaussRows() {
    const tbody = document.getElementById('gaussForwardTableBody');
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

// 清空高斯投影正算数据
function clearGaussForwardData() {
    if (confirm('确定要清空所有高斯投影正算数据吗？')) {
        const tbody = document.getElementById('gaussForwardTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                addGaussForwardRow();
            }
            console.log('✅ 数据已清空，重新添加5行');
        }
    }
}

// 导出高斯投影结果
function exportGaussResults() {
    console.log('📤 导出高斯投影结果...');
    
    // 检查是否有计算结果
    const tbody = document.getElementById('gaussForwardTableBody');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    
    rows.forEach(row => {
        const xResult = row.querySelector('.result-x')?.textContent;
        const yResult = row.querySelector('.result-y')?.textContent;
        if (xResult && yResult && xResult !== '-' && yResult !== '-') {
            hasResults = true;
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    // 显示导出对话框
    showGaussExportDialog();
}

// 显示高斯投影导出对话框
function showGaussExportDialog() {
    console.log('📤 显示高斯投影导出对话框...');
    
    // 检查是否已存在导出模态框
    let modal = document.getElementById('gaussExportModal');
    if (!modal) {
        createGaussExportModal();
        modal = document.getElementById('gaussExportModal');
    }
    
    // 设置默认文件名
    const projectName = document.getElementById('projectName')?.value || '工程测量';
    const fileName = `${projectName}_高斯投影正算结果`;
    document.getElementById('gaussExportFileName').value = fileName;
    
    // 显示模态框
    modal.style.display = 'block';
}

// 创建高斯投影导出模态框
function createGaussExportModal() {
    const modalHTML = `
        <div class="modal" id="gaussExportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>高斯投影正算结果导出</h3>
                    <span class="close" onclick="closeModal('gaussExportModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="export-section">
                        <h4>导出格式</h4>
                        <div class="format-grid">
                            <label class="format-option">
                                <input type="radio" name="gaussExportFormat" value="txt" checked>
                                <span class="format-label">
                                    <i class="fas fa-file-alt"></i>
                                    <strong>TXT文本</strong>
                                    <small>纯文本格式，通用性强</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussExportFormat" value="dat">
                                <span class="format-label">
                                    <i class="fas fa-database"></i>
                                    <strong>DAT数据</strong>
                                    <small>测量数据标准格式</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussExportFormat" value="csv">
                                <span class="format-label">
                                    <i class="fas fa-table"></i>
                                    <strong>CSV表格</strong>
                                    <small>逗号分隔值格式</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussExportFormat" value="excel">
                                <span class="format-label">
                                    <i class="fas fa-file-excel"></i>
                                    <strong>Excel表格</strong>
                                    <small>Microsoft Excel格式</small>
                                </span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="gaussExportFormat" value="word">
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
                            <label><input type="checkbox" id="gaussIncludeParameters" checked> 计算参数</label>
                            <label><input type="checkbox" id="gaussIncludeInputData" checked> 输入数据</label>
                            <label><input type="checkbox" id="gaussIncludeResults" checked> 计算结果</label>
                            <label><input type="checkbox" id="gaussIncludeProjectInfo" checked> 项目信息</label>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>文件设置</h4>
                        <div class="file-settings">
                            <div class="param-row">
                                <label>文件名:</label>
                                <input type="text" id="gaussExportFileName" placeholder="高斯投影正算结果">
                            </div>
                            <div class="param-row">
                                <label><input type="checkbox" id="gaussIncludeTimestamp" checked> 包含时间戳</label>
                            </div>
                            <div class="param-row">
                                <label>坐标小数位数:</label>
                                <select id="gaussDecimalPlaces">
                                    <option value="2">2位</option>
                                    <option value="3" selected>3位</option>
                                    <option value="4">4位</option>
                                    <option value="5">5位</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="tool-btn" onclick="closeModal('gaussExportModal')">取消</button>
                    <button class="tool-btn primary" onclick="performGaussExport()">导出</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 执行高斯投影导出
function performGaussExport() {
    try {
        // 获取导出设置
        const format = document.querySelector('input[name="gaussExportFormat"]:checked').value;
        const fileName = document.getElementById('gaussExportFileName').value || '高斯投影正算结果';
        const includeTimestamp = document.getElementById('gaussIncludeTimestamp').checked;
        const decimalPlaces = parseInt(document.getElementById('gaussDecimalPlaces').value);

        // 获取导出内容选项
        const contentOptions = {
            parameters: document.getElementById('gaussIncludeParameters').checked,
            inputData: document.getElementById('gaussIncludeInputData').checked,
            results: document.getElementById('gaussIncludeResults').checked,
            projectInfo: document.getElementById('gaussIncludeProjectInfo').checked
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
                exportGaussToTxt(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'dat':
                exportGaussToDat(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'csv':
                exportGaussToCsv(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'excel':
                exportGaussToExcel(finalFileName, contentOptions, decimalPlaces);
                break;
            case 'word':
                exportGaussToWord(finalFileName, contentOptions, decimalPlaces);
                break;
            default:
                throw new Error('不支持的导出格式');
        }

        // 关闭模态框
        closeModal('gaussExportModal');
        showMessage(`成功导出为 ${format.toUpperCase()} 格式`, 'success');

    } catch (error) {
        console.error('导出失败:', error);
        showMessage('导出失败: ' + error.message, 'error');
    }
}

// 收集高斯投影导出数据
function collectGaussExportData(contentOptions, decimalPlaces) {
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
            functionName: '高斯投影正算',
            calcDate: document.getElementById('calcDate')?.value || new Date().toISOString().slice(0, 10),
            calculator: document.getElementById('calculator')?.value || '',
            checker: document.getElementById('checker')?.value || '',
            exportTime: new Date().toLocaleString('zh-CN')
        };
    }

    // 计算参数
    if (contentOptions.parameters) {
        data.parameters = {
            ellipsoid: gaussForwardSettings.ellipsoid,
            centralMeridian: gaussForwardSettings.centralMeridian,
            projectionHeight: gaussForwardSettings.projectionHeight,
            enable500km: gaussForwardSettings.enable500km,
            coordDecimals: gaussForwardSettings.coordDecimals
        };
    }

    // 输入数据和结果
    const tbody = document.getElementById('gaussForwardTableBody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const pointName = row.querySelector('.point-name')?.value.trim();
            const latInput = row.querySelector('.latitude-input')?.value.trim();
            const lonInput = row.querySelector('.longitude-input')?.value.trim();
            const xResult = row.querySelector('.result-x')?.textContent;
            const yResult = row.querySelector('.result-y')?.textContent;
            const remark = row.querySelector('.remark')?.value.trim();

            if (pointName && latInput && lonInput) {
                const inputPoint = {
                    name: pointName,
                    latitude: latInput,
                    longitude: lonInput,
                    remark: remark || ''
                };

                if (contentOptions.inputData) {
                    data.inputData.push(inputPoint);
                }

                if (contentOptions.results && xResult && yResult && xResult !== '-' && yResult !== '-') {
                    data.results.push({
                        ...inputPoint,
                        x: parseFloat(xResult),
                        y: parseFloat(yResult)
                    });
                }
            }
        });
    }

    return data;
}

// 导出为TXT格式
function exportGaussToTxt(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussExportData(contentOptions, decimalPlaces);
    let content = '';

    // 项目信息
    if (contentOptions.projectInfo && data.projectInfo) {
        content += '='.repeat(60) + '\n';
        content += '                高斯投影正算计算结果报告\n';
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
        content += `中央子午线: ${data.parameters.centralMeridian}°\n`;
        content += `投影面高程: ${data.parameters.projectionHeight}m\n`;
        content += `500km偏移: ${data.parameters.enable500km ? '启用' : '禁用'}\n`;
        content += `坐标小数位: ${data.parameters.coordDecimals}位\n\n`;
    }

    // 输入数据
    if (contentOptions.inputData && data.inputData.length > 0) {
        content += '-'.repeat(60) + '\n';
        content += '输入数据\n';
        content += '-'.repeat(60) + '\n';
        content += '点名'.padEnd(12) + '纬度'.padEnd(15) + '经度'.padEnd(15) + '备注\n';
        content += '-'.repeat(60) + '\n';
        
        data.inputData.forEach(point => {
            content += `${point.name.padEnd(12)}${point.latitude.padEnd(15)}${point.longitude.padEnd(15)}${point.remark.padEnd(10)}\n`;
        });
        content += '\n';
    }

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        content += '-'.repeat(60) + '\n';
        content += '计算结果\n';
        content += '-'.repeat(60) + '\n';
        content += '点名'.padEnd(12) + 'X坐标(m)'.padEnd(15) + 'Y坐标(m)'.padEnd(15) + '备注\n';
        content += '-'.repeat(60) + '\n';
        
        data.results.forEach(result => {
            content += `${result.name.padEnd(12)}${result.x.toFixed(decimalPlaces).padEnd(15)}${result.y.toFixed(decimalPlaces).padEnd(15)}${result.remark.padEnd(10)}\n`;
        });
        content += '\n';
    }

    downloadFile(content, `${fileName}.txt`, 'text/plain;charset=utf-8');
}

// 导出为CSV格式
function exportGaussToCsv(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussExportData(contentOptions, decimalPlaces);
    const csvData = [];

    // 项目信息
    if (contentOptions.projectInfo) {
        csvData.push(['高斯投影正算计算结果']);
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
        csvData.push(['点名', '纬度', '经度', 'X坐标(m)', 'Y坐标(m)', '备注']);
        data.results.forEach(result => {
            csvData.push([
                result.name,
                result.latitude,
                result.longitude,
                result.x.toFixed(decimalPlaces),
                result.y.toFixed(decimalPlaces),
                result.remark || ''
            ]);
        });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8');
}

// 导出为Excel格式
function exportGaussToExcel(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussExportData(contentOptions, decimalPlaces);
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
    htmlContent += `<div class="title">高斯投影正算计算结果</div>`;

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
                        <th>点名</th><th>纬度</th><th>经度</th><th>X坐标(m)</th><th>Y坐标(m)</th><th>备注</th>
                    </tr>
        `;
        data.results.forEach(result => {
            htmlContent += `
                <tr>
                    <td>${result.name}</td>
                    <td>${result.latitude}</td>
                    <td>${result.longitude}</td>
                    <td>${result.x.toFixed(decimalPlaces)}</td>
                    <td>${result.y.toFixed(decimalPlaces)}</td>
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
function exportGaussToWord(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussExportData(contentOptions, decimalPlaces);
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
    htmlContent += `<div class="title">高斯投影正算计算结果报告</div>`;

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
                    <th>序号</th><th>点名</th><th>纬度</th><th>经度</th><th>X坐标(m)</th><th>Y坐标(m)</th><th>备注</th>
                </tr>
        `;
        data.results.forEach((result, index) => {
            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${result.name}</td>
                    <td>${result.latitude}</td>
                    <td>${result.longitude}</td>
                    <td>${result.x.toFixed(decimalPlaces)}</td>
                    <td>${result.y.toFixed(decimalPlaces)}</td>
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
function exportGaussToDat(fileName, contentOptions, decimalPlaces) {
    const data = collectGaussExportData(contentOptions, decimalPlaces);
    let content = '';

    // DAT格式头部信息
    content += `# 高斯投影正算数据文件\n`;
    content += `# 项目: ${data.projectInfo?.projectName || ''}\n`;
    content += `# 日期: ${data.projectInfo?.calcDate || ''}\n`;
    content += `# 格式: 点名,纬度,经度,X坐标,Y坐标\n`;
    content += `#\n`;

    // 计算结果
    if (contentOptions.results && data.results.length > 0) {
        content += `# 高斯投影正算结果\n`;
        data.results.forEach(result => {
            content += `${result.name},${result.latitude},${result.longitude},` +
                      `${result.x.toFixed(decimalPlaces)},${result.y.toFixed(decimalPlaces)}\n`;
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

// 导出全局函数
window.initializeGaussForward = initializeGaussForward;
window.initializeGaussForwardTable = initializeGaussForwardTable;
window.bindGaussForwardEvents = bindGaussForwardEvents;
window.performGaussForwardCalculation = performGaussForwardCalculation;
window.openGaussSettings = openGaussSettings;
window.saveGaussSettings = saveGaussSettings;
window.exportGaussResults = exportGaussResults;
window.updateGaussParametersDisplay = updateGaussParametersDisplay;
window.performGaussExport = performGaussExport;

console.log('✅ 高斯投影正算模块加载完成');