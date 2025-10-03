// BLH→XYZ转换模块 - 基于高斯投影正算完全照搬
console.log('🔧 加载BLH→XYZ转换模块...');

// 全局设置对象
let blhToXYZSettings = {
    ellipsoid: 'CGCS2000',
    semiMajor: 6378137,
    flattening: 298.257222101,
    coordDecimals: 3
};

// 椭球参数
const ELLIPSOID_PARAMS_BLH_XYZ = {
    'CGCS2000': { a: 6378137, f: 298.257222101 },
    'WGS84': { a: 6378137, f: 298.257223563 },
    'Xi\'an80': { a: 6378140, f: 298.257 },
    'Beijing54': { a: 6378245, f: 298.3 }
};

// 初始化BLH→XYZ转换功能
function initializeBLHToXYZ() {
    console.log('🚀 初始化BLH→XYZ转换功能...');
    
    setTimeout(() => {
        console.log('📋 开始初始化表格...');
        initializeBLHToXYZTable();
        
        console.log('🔗 开始绑定事件...');
        bindBLHToXYZEvents();
        
        console.log('📊 更新参数显示...');
        updateBLHToXYZParametersDisplay();
        
        console.log('✅ BLH→XYZ转换模块初始化完成');
    }, 100);
}

// 绑定BLH→XYZ转换事件
function bindBLHToXYZEvents() {
    console.log('🔗 绑定BLH→XYZ转换事件...');
    
    const blhContent = document.getElementById('blh_to_xyz-content');
    if (!blhContent) {
        console.error('✗ 找不到BLH→XYZ转换内容区域');
        return;
    }
    
    // 导入按钮
    const importBtn = blhContent.querySelector('[data-action="import-data"]');
    if (importBtn) {
        console.log('✓ 找到导入按钮，绑定事件');
        importBtn.removeAttribute('data-action');
        importBtn.setAttribute('data-blh-xyz-action', 'import-data');
        
        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入数据按钮');
            openBLHToXYZImportDialog();
        });
    } else {
        console.error('✗ 找不到导入按钮');
    }
    
    // 计算方案按钮
    const settingsBtn = blhContent.querySelector('[data-action="settings"]');
    if (settingsBtn) {
        console.log('✓ 找到计算方案按钮，绑定事件');
        settingsBtn.removeAttribute('data-action');
        settingsBtn.setAttribute('data-blh-xyz-action', 'settings');
        
        // 移除可能存在的onclick属性
        settingsBtn.removeAttribute('onclick');
        
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ 点击计算方案按钮');
            openBLHToXYZSettings();
        });
    } else {
        console.error('✗ 找不到计算方案按钮');
    }
    
    // 计算按钮
    const calculateBtn = blhContent.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        console.log('✓ 找到计算按钮，绑定事件');
        calculateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🧮 点击开始计算按钮');
            performBLHToXYZCalculation();
        });
    } else {
        console.error('✗ 找不到计算按钮');
    }
    
    // 导出按钮 - 移除直接事件绑定，由coordinate-main.js统一处理
    // const exportBtn = blhContent.querySelector('[data-action="export-result"]');
    // if (exportBtn) {
    //     console.log('✓ 找到导出按钮，绑定事件');
    //     exportBtn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         console.log('📤 点击导出成果按钮');
    //         exportBLHToXYZResults();
    //     });
    // } else {
    //     console.error('✗ 找不到导出按钮');
    // }
    
    // 绑定表格控制按钮
    const addRowBtn = document.getElementById('blhToXYZAddRowBtn');
    if (addRowBtn) {
        console.log('✓ 找到添加行按钮');
        addRowBtn.addEventListener('click', () => {
            console.log('➕ 添加新行');
            addBLHToXYZRow();
        });
    }
    
    const deleteRowBtn = document.getElementById('blhToXYZDeleteRowBtn');
    if (deleteRowBtn) {
        console.log('✓ 找到删除行按钮');
        deleteRowBtn.addEventListener('click', () => {
            console.log('➖ 删除选中行');
            deleteSelectedBLHToXYZRows();
        });
    }
    
    const clearBtn = document.getElementById('blhToXYZClearBtn');
    if (clearBtn) {
        console.log('✓ 找到清空按钮');
        clearBtn.addEventListener('click', () => {
            console.log('🗑️ 清空数据');
            clearBLHToXYZData();
        });
    }
}

// 初始化BLH→XYZ转换表格
function initializeBLHToXYZTable() {
    console.log('📋 初始化BLH→XYZ转换表格...');
    
    const tbody = document.getElementById('blh_to_xyz-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素 (blh_to_xyz-table-body)');
        return;
    }
    
    console.log('✓ 找到表格体元素');
    
    // 清空现有内容
    tbody.innerHTML = '';
    
    // 添加5行数据
    console.log('📝 添加5行数据...');
    for (let i = 1; i <= 5; i++) {
        addBLHToXYZRow();
    }
    
    console.log(`✅ 表格初始化完成，共 ${tbody.children.length} 行`);
}

// 添加BLH→XYZ转换行
function addBLHToXYZRow(data = {}) {
    const tbody = document.getElementById('blh_to_xyz-table-body');
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
        <td><input type="number" class="height-input param-input" value="${data.height || ''}" placeholder="高程(米)" step="0.001"></td>
        <td><span class="result-x result-value">-</span></td>
        <td><span class="result-y result-value">-</span></td>
        <td><span class="result-z result-value">-</span></td>
        <td><input type="text" class="remark param-input" value="${data.remark || ''}" placeholder="备注"></td>
    `;
    
    tbody.appendChild(row);
    console.log(`✓ 添加第 ${rowCount} 行`);
}

// 收集BLH→XYZ转换数据
function collectBLHToXYZData() {
    console.log('📊 收集BLH→XYZ转换数据...');
    
    const tbody = document.getElementById('blh_to_xyz-table-body');
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
        const heightInput = row.querySelector('.height-input')?.value.trim();
        
        console.log(`第 ${index + 1} 行: 点名="${pointName}", 纬度="${latInput}", 经度="${lonInput}", 高程="${heightInput}"`);
        
        if (pointName && latInput && lonInput && heightInput) {
            const lat = parseDMSCoordinate(latInput);
            const lon = parseDMSCoordinate(lonInput);
            const height = parseFloat(heightInput);
            
            console.log(`解析结果: 纬度=${lat}, 经度=${lon}, 高程=${height}`);
            
            if (!isNaN(lat) && !isNaN(lon) && !isNaN(height)) {
                data.push({
                    name: pointName,
                    latitude: lat,
                    longitude: lon,
                    height: height
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

// 执行BLH→XYZ转换计算
function performBLHToXYZCalculation() {
    console.log('🧮 开始执行BLH→XYZ转换计算...');
    
    const data = collectBLHToXYZData();
    if (data.length === 0) {
        console.warn('⚠️ 没有有效数据');
        showMessage('请先输入坐标数据。格式示例：纬度 39°33\'46.8" 经度 116°17\'31.2" 高程 50.123', 'warning');
        return;
    }
    
    console.log('📊 开始计算，数据:', data);
    showBLHToXYZLoading(true);
    
    const requestData = {
        operation: 'blh_to_xyz',
        points: data.map(point => ({
            name: point.name,
            B: point.latitude,
            L: point.longitude,
            H: point.height
        })),
        params: {
            ellipsoid: blhToXYZSettings.ellipsoid
        }
    };
    
    console.log('📤 发送请求数据:', requestData);
    
    fetch('http://127.0.0.1:5000/api/blh-to-xyz', {
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
        showBLHToXYZLoading(false);
        if (result.success) {
            displayBLHToXYZResults(result.data);
            showMessage('BLH→XYZ转换计算完成', 'success');
        } else {
            console.error('❌ 计算失败:', result.error);
            showMessage('计算失败: ' + result.error, 'error');
        }
    })
    .catch(error => {
        showBLHToXYZLoading(false);
        console.error('❌ 计算错误:', error);
        showMessage('计算过程中发生错误: ' + error.message, 'error');
    });
}

// 显示计算结果
function displayBLHToXYZResults(results) {
    console.log('📊 显示计算结果...');
    
    const tbody = document.getElementById('blh_to_xyz-table-body');
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
            const zValue = result.output_z || result.z;
            
            console.log(`第 ${index + 1} 行结果: X=${xValue}, Y=${yValue}, Z=${zValue}`);
            
            if (xValue !== undefined) {
                const xElement = row.querySelector('.result-x');
                if (xElement) {
                    xElement.textContent = parseFloat(xValue).toFixed(blhToXYZSettings.coordDecimals);
                }
            }
            if (yValue !== undefined) {
                const yElement = row.querySelector('.result-y');
                if (yElement) {
                    yElement.textContent = parseFloat(yValue).toFixed(blhToXYZSettings.coordDecimals);
                }
            }
            if (zValue !== undefined) {
                const zElement = row.querySelector('.result-z');
                if (zElement) {
                    zElement.textContent = parseFloat(zValue).toFixed(blhToXYZSettings.coordDecimals);
                }
            }
        }
    });
    
    console.log('✅ 结果显示完成');
}

// 显示加载状态
function showBLHToXYZLoading(show) {
    const blhContent = document.getElementById('blh_to_xyz-content');
    const calculateBtn = blhContent?.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        calculateBtn.disabled = show;
        const icon = calculateBtn.querySelector('i');
        const text = show ? '计算中...' : '开始计算';
        calculateBtn.innerHTML = `${icon ? icon.outerHTML : '<i class="fas fa-calculator"></i>'} ${text}`;
    }
}

// 打开BLH→XYZ转换设置
function openBLHToXYZSettings() {
    console.log('⚙️ 打开BLH→XYZ转换设置...');
    
    const modal = document.getElementById('blhToXYZSettingsModal');
    if (!modal) {
        console.error('✗ 找不到BLH转XYZ设置模态框');
        return;
    }
    
    // 加载当前设置到表单
    loadBLHToXYZSettingsToForm();
    
    // 显示模态框
    modal.style.display = 'flex';
    console.log('✅ BLH转XYZ设置模态框已显示');
}

// 加载设置到表单
function loadBLHToXYZSettingsToForm() {
    console.log('📋 加载BLH转XYZ设置到表单...');
    
    // 椭球参数
    const ellipsoidSelect = document.getElementById('blh-xyz-ellipsoid');
    const semiMajorInput = document.getElementById('blh-xyz-semi-major');
    const flatteningInput = document.getElementById('blh-xyz-flattening');
    
    // 输出格式
    const coordDecimalsInput = document.getElementById('blh-xyz-coord-decimals');
    const angleFormatSelect = document.getElementById('blh-xyz-angle-format');
    
    if (ellipsoidSelect) ellipsoidSelect.value = blhToXYZSettings.ellipsoid;
    if (semiMajorInput) semiMajorInput.value = blhToXYZSettings.semiMajor;
    if (flatteningInput) flatteningInput.value = blhToXYZSettings.flattening;
    if (coordDecimalsInput) coordDecimalsInput.value = blhToXYZSettings.coordDecimals;
    if (angleFormatSelect) angleFormatSelect.value = blhToXYZSettings.angleFormat || 'dms';
    
    console.log('✅ 设置已加载到表单');
}

// 保存BLH转XYZ设置
function saveBLHToXYZSettings() {
    console.log('💾 保存BLH转XYZ设置...');
    
    // 获取表单值
    const ellipsoid = document.getElementById('blh-xyz-ellipsoid')?.value;
    const semiMajor = parseFloat(document.getElementById('blh-xyz-semi-major')?.value);
    const flattening = parseFloat(document.getElementById('blh-xyz-flattening')?.value);
    const coordDecimals = parseInt(document.getElementById('blh-xyz-coord-decimals')?.value);
    const angleFormat = document.getElementById('blh-xyz-angle-format')?.value;
    
    // 验证输入
    if (!ellipsoid || isNaN(semiMajor) || isNaN(flattening) || isNaN(coordDecimals)) {
        showMessage('请检查输入参数是否正确', 'warning');
        return;
    }
    
    // 更新设置
    blhToXYZSettings.ellipsoid = ellipsoid;
    blhToXYZSettings.semiMajor = semiMajor;
    blhToXYZSettings.flattening = flattening;
    blhToXYZSettings.coordDecimals = coordDecimals;
    blhToXYZSettings.angleFormat = angleFormat;
    
    // 更新椭球参数（如果存在对应的预定义椭球）
    if (ELLIPSOID_PARAMS_BLH_XYZ[ellipsoid]) {
        blhToXYZSettings.semiMajor = ELLIPSOID_PARAMS_BLH_XYZ[ellipsoid].a;
        blhToXYZSettings.flattening = ELLIPSOID_PARAMS_BLH_XYZ[ellipsoid].f;
    }
    
    // 更新显示
    updateBLHToXYZParametersDisplay();
    
    // 关闭模态框
    closeModal('blhToXYZSettingsModal');
    
    showMessage('BLH转XYZ设置已保存', 'success');
    console.log('✅ BLH转XYZ设置已保存:', blhToXYZSettings);
}

// 椭球选择变化处理
function handleBLHToXYZEllipsoidChange() {
    const ellipsoidSelect = document.getElementById('blh-xyz-ellipsoid');
    const semiMajorInput = document.getElementById('blh-xyz-semi-major');
    const flatteningInput = document.getElementById('blh-xyz-flattening');
    
    if (!ellipsoidSelect || !semiMajorInput || !flatteningInput) return;
    
    const selectedEllipsoid = ellipsoidSelect.value;
    console.log('🌍 椭球选择变化:', selectedEllipsoid);
    
    // 如果是预定义椭球，自动填充参数
    if (ELLIPSOID_PARAMS_BLH_XYZ[selectedEllipsoid]) {
        const params = ELLIPSOID_PARAMS_BLH_XYZ[selectedEllipsoid];
        semiMajorInput.value = params.a;
        flatteningInput.value = params.f;
        console.log('✅ 自动填充椭球参数:', params);
    }
}

// 更新参数显示
function updateBLHToXYZParametersDisplay() {
    console.log('📊 更新参数显示...');
    
    const ellipsoidElement = document.getElementById('current-blh-xyz-ellipsoid');
    if (ellipsoidElement) {
        ellipsoidElement.textContent = blhToXYZSettings.ellipsoid;
    }
    
    console.log('✅ 参数显示更新完成');
}

// 打开导入对话框
function openBLHToXYZImportDialog() {
    console.log('📥 打开导入对话框...');
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.dat,.csv';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`📁 选择文件: ${file.name}`);
            handleBLHToXYZFileImport(file);
        }
        document.body.removeChild(fileInput);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// 处理文件导入
function handleBLHToXYZFileImport(file) {
    console.log('📥 处理文件导入...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log('📄 文件内容长度:', content.length);
            
            const data = parseBLHToXYZFileContent(content);
            console.log('📊 解析后的数据:', data);
            
            if (data.length === 0) {
                showMessage('文件中没有有效数据。请确保文件格式正确：点名 纬度 经度 高程', 'warning');
                return;
            }
            
            importBLHToXYZData(data);
        } catch (error) {
            console.error('❌ 文件解析错误:', error);
            showMessage('文件格式错误: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file, 'utf-8');
}

// 解析文件内容
function parseBLHToXYZFileContent(content) {
    console.log('🔍 解析文件内容...');
    
    const lines = content.split('\n').filter(line => line.trim());
    const data = [];
    
    lines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
            const name = parts[0];
            const latStr = parts[1];
            const lonStr = parts[2];
            const heightStr = parts[3];
            
            const latitude = parseDMSCoordinate(latStr);
            const longitude = parseDMSCoordinate(lonStr);
            const height = parseFloat(heightStr);
            
            if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(height)) {
                data.push({
                    name: name,
                    latitude: latStr,
                    longitude: lonStr,
                    height: height
                });
                console.log(`✓ 第 ${index + 1} 行: ${name} ${latStr} ${lonStr} ${height}`);
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行格式错误: ${line}`);
            }
        }
    });
    
    console.log(`📊 解析完成，共 ${data.length} 个有效数据点`);
    return data;
}

// 导入数据到表格
function importBLHToXYZData(data) {
    console.log('📥 导入数据到表格...');
    
    const tbody = document.getElementById('blh_to_xyz-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
        addBLHToXYZRow({
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            height: item.height
        });
    });
    
    while (tbody.children.length < Math.max(5, data.length)) {
        addBLHToXYZRow();
    }
    
    showMessage(`✅ 成功导入 ${data.length} 个点的数据`, 'success');
    console.log(`✅ 导入完成，表格共 ${tbody.children.length} 行`);
}

// 删除选中的行
function deleteSelectedBLHToXYZRows() {
    const tbody = document.getElementById('blh_to_xyz-table-body');
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

// 清空BLH→XYZ转换数据
function clearBLHToXYZData() {
    if (confirm('确定要清空所有BLH→XYZ转换数据吗？')) {
        const tbody = document.getElementById('blh_to_xyz-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                addBLHToXYZRow();
            }
            console.log('✅ 数据已清空，重新添加5行');
        }
    }
}

// 导出BLH→XYZ转换结果
function exportBLHToXYZResults() {
    console.log('📤 导出BLH→XYZ转换结果...');
    
    // 检查是否有计算结果
    const tbody = document.getElementById('blh_to_xyz-table-body');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    const results = [];
    
    rows.forEach(row => {
        const name = row.querySelector('.point-name')?.value || '';
        const lat = row.querySelector('.coord-latitude')?.value || '';
        const lon = row.querySelector('.coord-longitude')?.value || '';
        const height = row.querySelector('.coord-height')?.value || '';
        const xResult = row.querySelector('.result-x')?.textContent;
        const yResult = row.querySelector('.result-y')?.textContent;
        const zResult = row.querySelector('.result-z')?.textContent;
        
        if (xResult && yResult && zResult && xResult !== '-' && yResult !== '-' && zResult !== '-') {
            hasResults = true;
            results.push({
                name: name,
                latitude: lat,
                longitude: lon,
                height: height,
                x: xResult,
                y: yResult,
                z: zResult
            });
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    // 生成导出内容
    let content = '点名\t纬度\t经度\t大地高(m)\tX坐标(m)\tY坐标(m)\tZ坐标(m)\n';
    results.forEach(result => {
        content += `${result.name}\t${result.latitude}\t${result.longitude}\t${result.height}\t${result.x}\t${result.y}\t${result.z}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BLH_TO_XYZ_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage(`✅ 成功导出 ${results.length} 个点的转换结果`, 'success');
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
window.initializeBLHToXYZ = initializeBLHToXYZ;
window.initializeBLHToXYZTable = initializeBLHToXYZTable;
window.bindBLHToXYZEvents = bindBLHToXYZEvents;
window.performBLHToXYZCalculation = performBLHToXYZCalculation;
window.openBLHToXYZSettings = openBLHToXYZSettings;
window.exportBLHToXYZResults = exportBLHToXYZResults;
window.updateBLHToXYZParametersDisplay = updateBLHToXYZParametersDisplay;

console.log('✅ BLH→XYZ转换模块加载完成');