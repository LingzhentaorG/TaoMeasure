// XYZ→BLH转换模块 - 基于高斯投影正算完全照搬
console.log('🔧 加载XYZ→BLH转换模块...');

// 全局设置对象
let xyzToBLHSettings = {
    ellipsoid: 'CGCS2000',
    semiMajor: 6378137,
    flattening: 298.257222101,
    coordDecimals: 6
};

// 椭球参数
const ELLIPSOID_PARAMS_XYZ_BLH = {
    'CGCS2000': { a: 6378137, f: 298.257222101 },
    'WGS84': { a: 6378137, f: 298.257223563 },
    'Xi\'an80': { a: 6378140, f: 298.257 },
    'Beijing54': { a: 6378245, f: 298.3 }
};

// 初始化XYZ→BLH转换功能
function initializeXYZToBLH() {
    console.log('🚀 初始化XYZ→BLH转换功能...');
    
    setTimeout(() => {
        console.log('📋 开始初始化表格...');
        initializeXYZToBLHTable();
        
        console.log('🔗 开始绑定事件...');
        bindXYZToBLHEvents();
        
        console.log('📊 更新参数显示...');
        updateXYZToBLHParametersDisplay();
        
        console.log('✅ XYZ→BLH转换模块初始化完成');
    }, 100);
}

// 绑定XYZ→BLH转换事件
function bindXYZToBLHEvents() {
    console.log('🔗 绑定XYZ→BLH转换事件...');
    
    const xyzContent = document.getElementById('xyz_to_blh-content');
    if (!xyzContent) {
        console.error('✗ 找不到XYZ→BLH转换内容区域');
        return;
    }
    
    // 导入按钮
    const importBtn = xyzContent.querySelector('[data-action="import-data"]');
    if (importBtn) {
        console.log('✓ 找到导入按钮，绑定事件');
        importBtn.removeAttribute('data-action');
        importBtn.setAttribute('data-xyz-blh-action', 'import-data');
        
        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 点击导入数据按钮');
            openXYZToBLHImportDialog();
        });
    } else {
        console.error('✗ 找不到导入按钮');
    }
    
    // 计算方案按钮
    const settingsBtn = xyzContent.querySelector('[data-action="settings"]');
    if (settingsBtn) {
        console.log('✓ 找到计算方案按钮，绑定事件');
        settingsBtn.removeAttribute('data-action');
        settingsBtn.setAttribute('data-xyz-blh-action', 'settings');
        
        // 移除可能存在的onclick属性
        settingsBtn.removeAttribute('onclick');
        
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚙️ 点击计算方案按钮');
            openXYZToBLHSettings();
        });
    } else {
        console.error('✗ 找不到计算方案按钮');
    }
    
    // 计算按钮
    const calculateBtn = xyzContent.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        console.log('✓ 找到计算按钮，绑定事件');
        calculateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🧮 点击开始计算按钮');
            performXYZToBLHCalculation();
        });
    } else {
        console.error('✗ 找不到计算按钮');
    }
    
    // 导出按钮 - 确保完全独立的事件处理
    const exportBtn = xyzContent.querySelector('[data-action="export-result"]');
    if (exportBtn) {
        console.log('✓ 找到导出按钮，绑定事件');
        // 先移除所有现有的事件监听器，防止重复绑定
        exportBtn.replaceWith(exportBtn.cloneNode(true));
        const newExportBtn = xyzContent.querySelector('[data-action="export-result"]');
        
        newExportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation(); // 立即停止事件传播
            e.stopPropagation(); // 阻止事件冒泡
            console.log('📤 点击导出成果按钮');
            exportXYZToBLHResults();
            return false; // 阻止默认行为
        });
    } else {
        console.error('✗ 找不到导出按钮');
    }
    
    // 绑定表格控制按钮
    const addRowBtn = document.getElementById('xyzToBLHAddRowBtn');
    if (addRowBtn) {
        console.log('✓ 找到添加行按钮');
        addRowBtn.addEventListener('click', () => {
            console.log('➕ 添加新行');
            addXYZToBLHRow();
        });
    }
    
    const deleteRowBtn = document.getElementById('xyzToBLHDeleteRowBtn');
    if (deleteRowBtn) {
        console.log('✓ 找到删除行按钮');
        deleteRowBtn.addEventListener('click', () => {
            console.log('➖ 删除选中行');
            deleteSelectedXYZToBLHRows();
        });
    }
    
    const clearBtn = document.getElementById('xyzToBLHClearBtn');
    if (clearBtn) {
        console.log('✓ 找到清空按钮');
        clearBtn.addEventListener('click', () => {
            console.log('🗑️ 清空数据');
            clearXYZToBLHData();
        });
    }
}

// 初始化XYZ→BLH转换表格
function initializeXYZToBLHTable() {
    console.log('📋 初始化XYZ→BLH转换表格...');
    
    const tbody = document.getElementById('xyz_to_blh-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素 (xyz_to_blh-table-body)');
        return;
    }
    
    console.log('✓ 找到表格体元素');
    
    // 清空现有内容
    tbody.innerHTML = '';
    
    // 添加5行数据
    console.log('📝 添加5行数据...');
    for (let i = 1; i <= 5; i++) {
        addXYZToBLHRow();
    }
    
    console.log(`✅ 表格初始化完成，共 ${tbody.children.length} 行`);
}

// 添加XYZ→BLH转换行
function addXYZToBLHRow(data = {}) {
    const tbody = document.getElementById('xyz_to_blh-table-body');
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
        <td><input type="number" class="z-input param-input" value="${data.z || ''}" placeholder="Z坐标" step="0.001"></td>
        <td><span class="result-latitude result-value">-</span></td>
        <td><span class="result-longitude result-value">-</span></td>
        <td><span class="result-height result-value">-</span></td>
        <td><input type="text" class="remark param-input" value="${data.remark || ''}" placeholder="备注"></td>
    `;
    
    tbody.appendChild(row);
    console.log(`✓ 添加第 ${rowCount} 行`);
}

// 收集XYZ→BLH转换数据
function collectXYZToBLHData() {
    console.log('📊 收集XYZ→BLH转换数据...');
    
    const tbody = document.getElementById('xyz_to_blh-table-body');
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
        const zInput = row.querySelector('.z-input')?.value.trim();
        
        console.log(`第 ${index + 1} 行: 点名="${pointName}", X="${xInput}", Y="${yInput}", Z="${zInput}"`);
        
        if (pointName && xInput && yInput && zInput) {
            const x = parseFloat(xInput);
            const y = parseFloat(yInput);
            const z = parseFloat(zInput);
            
            console.log(`解析结果: X=${x}, Y=${y}, Z=${z}`);
            
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                data.push({
                    name: pointName,
                    x: x,
                    y: y,
                    z: z
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

// 执行XYZ→BLH转换计算
function performXYZToBLHCalculation() {
    console.log('🧮 开始执行XYZ→BLH转换计算...');
    
    const data = collectXYZToBLHData();
    if (data.length === 0) {
        console.warn('⚠️ 没有有效数据');
        showMessage('请先输入坐标数据。格式示例：X坐标 -2148744.123 Y坐标 4426641.456 Z坐标 4044655.789', 'warning');
        return;
    }
    
    console.log('📊 开始计算，数据:', data);
    console.log('📊 设置参数:', xyzToBLHSettings);
    showXYZToBLHLoading(true);
    
    const requestData = {
        points: data.map(point => ({
            name: point.name,
            x: point.x,
            y: point.y,
            z: point.z
        })),
        ellipsoid: xyzToBLHSettings.ellipsoid
    };
    
    console.log('📤 发送请求数据:', requestData);
    
    console.log('🌐 发送请求到:', '/api/xyz-to-blh');
    console.log('📤 请求方法: POST');
    console.log('📤 请求头:', {'Content-Type': 'application/json'});
    console.log('📤 请求体:', JSON.stringify(requestData, null, 2));
    
    fetch('http://127.0.0.1:5000/api/xyz-to-blh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('📥 响应状态:', response.status);
        console.log('📥 响应头:', response.headers.get('content-type'));
        
        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                console.error('❌ 非JSON响应:', text);
                throw new Error('服务器返回非JSON数据: ' + text.substring(0, 200));
            });
        }
        
        return response.json();
    })
    .then(result => {
        console.log('📊 计算结果:', result);
        showXYZToBLHLoading(false);
        if (result.success) {
            console.log('📊 开始显示结果...');
            displayXYZToBLHResults(result.data || result);
            console.log('📊 结果显示完成');
            showMessage('XYZ→BLH转换计算完成', 'success');
        } else {
            console.error('❌ 计算失败:', result.error);
            showMessage('计算失败: ' + result.error, 'error');
        }
    })
    .catch(error => {
        showXYZToBLHLoading(false);
        console.error('❌ 计算错误:', error);
        console.error('❌ 错误详情:', error.message);
        console.error('❌ 错误堆栈:', error.stack);
        
        let errorMsg = '计算过程中发生错误';
        if (error.message) {
            errorMsg += ': ' + error.message;
        }
        if (error.message && error.message.includes('JSON')) {
            errorMsg += '。请检查服务器响应格式。';
        }
        
        showMessage(errorMsg, 'error');
    });
}

// 显示计算结果
function displayXYZToBLHResults(results) {
    console.log('📊 显示计算结果...');
    console.log('📊 原始结果数据:', results);
    
    const tbody = document.getElementById('xyz_to_blh-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`📋 显示结果，结果数量: ${results.length}, 表格行数: ${rows.length}`);
    
    results.forEach((result, index) => {
        if (index < rows.length) {
            const row = rows[index];
            
            console.log(`处理第 ${index + 1} 行结果:`, result);
            
            // 后端返回的是 output_B, output_L, output_H 格式
            const latValue = result.output_B || result.output_lat || result.lat || result.latitude;
            const lonValue = result.output_L || result.output_lon || result.lon || result.longitude;
            const heightValue = result.output_H || result.output_height || result.height || result.h;
            
            console.log(`第 ${index + 1} 行结果: Lat=${latValue}, Lon=${lonValue}, Height=${heightValue}`);
            
            if (latValue !== undefined) {
                const latElement = row.querySelector('.result-latitude');
                if (latElement) {
                    latElement.textContent = formatDMS(latValue, 'lat');
                    console.log(`✓ 纬度已更新: ${latElement.textContent}`);
                } else {
                    console.error(`✗ 第 ${index + 1} 行找不到纬度元素`);
                }
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行纬度值为undefined`);
            }
            if (lonValue !== undefined) {
                const lonElement = row.querySelector('.result-longitude');
                if (lonElement) {
                    lonElement.textContent = formatDMS(lonValue, 'lon');
                    console.log(`✓ 经度已更新: ${lonElement.textContent}`);
                } else {
                    console.error(`✗ 第 ${index + 1} 行找不到经度元素`);
                }
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行经度值为undefined`);
            }
            if (heightValue !== undefined) {
                const heightElement = row.querySelector('.result-height');
                if (heightElement) {
                    heightElement.textContent = parseFloat(heightValue).toFixed(xyzToBLHSettings.coordDecimals) + 'm';
                    console.log(`✓ 高程已更新: ${heightElement.textContent}`);
                } else {
                    console.error(`✗ 第 ${index + 1} 行找不到高程元素`);
                }
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行高程值为undefined`);
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
function showXYZToBLHLoading(show) {
    const xyzContent = document.getElementById('xyz_to_blh-content');
    const calculateBtn = xyzContent?.querySelector('[data-action="calculate"]');
    if (calculateBtn) {
        calculateBtn.disabled = show;
        const icon = calculateBtn.querySelector('i');
        const text = show ? '计算中...' : '开始计算';
        calculateBtn.innerHTML = `${icon ? icon.outerHTML : '<i class="fas fa-calculator"></i>'} ${text}`;
    }
}

// 打开XYZ→BLH转换设置
function openXYZToBLHSettings() {
    console.log('⚙️ 打开XYZ→BLH转换设置...');
    
    const modal = document.getElementById('xyzToBLHSettingsModal');
    if (!modal) {
        console.error('✗ 找不到XYZ转BLH设置模态框');
        return;
    }
    
    // 加载当前设置到表单
    loadXYZToBLHSettingsToForm();
    
    // 显示模态框
    modal.style.display = 'flex';
    console.log('✅ XYZ转BLH设置模态框已显示');
}

// 加载设置到表单
function loadXYZToBLHSettingsToForm() {
    console.log('📋 加载XYZ转BLH设置到表单...');
    
    // 椭球参数
    const ellipsoidSelect = document.getElementById('xyz-blh-ellipsoid');
    const semiMajorInput = document.getElementById('xyz-blh-semi-major');
    const flatteningInput = document.getElementById('xyz-blh-flattening');
    
    // 输出格式
    const coordDecimalsInput = document.getElementById('xyz-blh-coord-decimals');
    const angleFormatSelect = document.getElementById('xyz-blh-angle-format');
    
    if (ellipsoidSelect) ellipsoidSelect.value = xyzToBLHSettings.ellipsoid;
    if (semiMajorInput) semiMajorInput.value = xyzToBLHSettings.semiMajor;
    if (flatteningInput) flatteningInput.value = xyzToBLHSettings.flattening;
    if (coordDecimalsInput) coordDecimalsInput.value = xyzToBLHSettings.coordDecimals;
    if (angleFormatSelect) angleFormatSelect.value = xyzToBLHSettings.angleFormat || 'dms';
    
    console.log('✅ 设置已加载到表单');
}

// 保存XYZ转BLH设置
function saveXYZToBLHSettings() {
    console.log('💾 保存XYZ转BLH设置...');
    
    // 获取表单值
    const ellipsoid = document.getElementById('xyz-blh-ellipsoid')?.value;
    const semiMajor = parseFloat(document.getElementById('xyz-blh-semi-major')?.value);
    const flattening = parseFloat(document.getElementById('xyz-blh-flattening')?.value);
    const coordDecimals = parseInt(document.getElementById('xyz-blh-coord-decimals')?.value);
    const angleFormat = document.getElementById('xyz-blh-angle-format')?.value;
    
    // 验证输入
    if (!ellipsoid || isNaN(semiMajor) || isNaN(flattening) || isNaN(coordDecimals)) {
        showMessage('请检查输入参数是否正确', 'warning');
        return;
    }
    
    // 更新设置
    xyzToBLHSettings.ellipsoid = ellipsoid;
    xyzToBLHSettings.semiMajor = semiMajor;
    xyzToBLHSettings.flattening = flattening;
    xyzToBLHSettings.coordDecimals = coordDecimals;
    xyzToBLHSettings.angleFormat = angleFormat;
    
    // 更新椭球参数（如果存在对应的预定义椭球）
    if (ELLIPSOID_PARAMS_XYZ_BLH[ellipsoid]) {
        xyzToBLHSettings.semiMajor = ELLIPSOID_PARAMS_XYZ_BLH[ellipsoid].a;
        xyzToBLHSettings.flattening = ELLIPSOID_PARAMS_XYZ_BLH[ellipsoid].f;
    }
    
    // 更新显示
    updateXYZToBLHParametersDisplay();
    
    // 关闭模态框
    closeModal('xyzToBLHSettingsModal');
    
    showMessage('XYZ转BLH设置已保存', 'success');
    console.log('✅ XYZ转BLH设置已保存:', xyzToBLHSettings);
}

// 椭球选择变化处理
function handleXYZToBLHEllipsoidChange() {
    const ellipsoidSelect = document.getElementById('xyz-blh-ellipsoid');
    const semiMajorInput = document.getElementById('xyz-blh-semi-major');
    const flatteningInput = document.getElementById('xyz-blh-flattening');
    
    if (!ellipsoidSelect || !semiMajorInput || !flatteningInput) return;
    
    const selectedEllipsoid = ellipsoidSelect.value;
    console.log('🌍 椭球选择变化:', selectedEllipsoid);
    
    // 如果是预定义椭球，自动填充参数
    if (ELLIPSOID_PARAMS_XYZ_BLH[selectedEllipsoid]) {
        const params = ELLIPSOID_PARAMS_XYZ_BLH[selectedEllipsoid];
        semiMajorInput.value = params.a;
        flatteningInput.value = params.f;
        console.log('✅ 自动填充椭球参数:', params);
    }
}

// 更新参数显示
function updateXYZToBLHParametersDisplay() {
    console.log('📊 更新参数显示...');
    
    const ellipsoidElement = document.getElementById('current-xyz-blh-ellipsoid');
    if (ellipsoidElement) {
        ellipsoidElement.textContent = xyzToBLHSettings.ellipsoid;
    }
    
    console.log('✅ 参数显示更新完成');
}

// 打开导入对话框
function openXYZToBLHImportDialog() {
    console.log('📥 打开导入对话框...');
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.dat,.csv';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`📁 选择文件: ${file.name}`);
            handleXYZToBLHFileImport(file);
        }
        document.body.removeChild(fileInput);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// 处理文件导入
function handleXYZToBLHFileImport(file) {
    console.log('📥 处理文件导入...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log('📄 文件内容长度:', content.length);
            
            const data = parseXYZToBLHFileContent(content);
            console.log('📊 解析后的数据:', data);
            
            if (data.length === 0) {
                showMessage('文件中没有有效数据。请确保文件格式正确：点名 X坐标 Y坐标 Z坐标', 'warning');
                return;
            }
            
            importXYZToBLHData(data);
        } catch (error) {
            console.error('❌ 文件解析错误:', error);
            showMessage('文件格式错误: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file, 'utf-8');
}

// 解析文件内容
function parseXYZToBLHFileContent(content) {
    console.log('🔍 解析文件内容...');
    
    const lines = content.split('\n').filter(line => line.trim());
    const data = [];
    
    lines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
            const name = parts[0];
            const xStr = parts[1];
            const yStr = parts[2];
            const zStr = parts[3];
            
            const x = parseFloat(xStr);
            const y = parseFloat(yStr);
            const z = parseFloat(zStr);
            
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                data.push({
                    name: name,
                    x: x,
                    y: y,
                    z: z
                });
                console.log(`✓ 第 ${index + 1} 行: ${name} ${x} ${y} ${z}`);
            } else {
                console.warn(`⚠️ 第 ${index + 1} 行格式错误: ${line}`);
            }
        }
    });
    
    console.log(`📊 解析完成，共 ${data.length} 个有效数据点`);
    return data;
}

// 导入数据到表格
function importXYZToBLHData(data) {
    console.log('📥 导入数据到表格...');
    
    const tbody = document.getElementById('xyz_to_blh-table-body');
    if (!tbody) {
        console.error('✗ 找不到表格体元素');
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
        addXYZToBLHRow({
            name: item.name,
            x: item.x,
            y: item.y,
            z: item.z
        });
    });
    
    while (tbody.children.length < Math.max(5, data.length)) {
        addXYZToBLHRow();
    }
    
    showMessage(`✅ 成功导入 ${data.length} 个点的数据`, 'success');
    console.log(`✅ 导入完成，表格共 ${tbody.children.length} 行`);
}

// 删除选中的行
function deleteSelectedXYZToBLHRows() {
    const tbody = document.getElementById('xyz_to_blh-table-body');
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

// 清空XYZ→BLH转换数据
function clearXYZToBLHData() {
    if (confirm('确定要清空所有XYZ→BLH转换数据吗？')) {
        const tbody = document.getElementById('xyz_to_blh-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                addXYZToBLHRow();
            }
            console.log('✅ 数据已清空，重新添加5行');
        }
    }
}

// 导出XYZ→BLH转换结果
function exportXYZToBLHResults() {
    console.log('📤 导出XYZ→BLH转换结果...');
    console.log('🔍 exportXYZToBLHResults 函数被调用');
    console.log('🔍 函数定义位置:', exportXYZToBLHResults.toString().substring(0, 100) + '...');
    
    // 检查是否有计算结果
    const tbody = document.getElementById('xyz_to_blh-table-body');
    if (!tbody) {
        showMessage('找不到表格数据', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let hasResults = false;
    const results = [];
    
    rows.forEach(row => {
        const name = row.querySelector('.point-name')?.value || '';
        const x = row.querySelector('.coord-x')?.value || '';
        const y = row.querySelector('.coord-y')?.value || '';
        const z = row.querySelector('.coord-z')?.value || '';
        const latResult = row.querySelector('.result-latitude')?.textContent;
        const lonResult = row.querySelector('.result-longitude')?.textContent;
        const heightResult = row.querySelector('.result-height')?.textContent;
        
        if (latResult && lonResult && heightResult && latResult !== '-' && lonResult !== '-' && heightResult !== '-') {
            hasResults = true;
            results.push({
                name: name,
                x: x,
                y: y,
                z: z,
                latitude: latResult,
                longitude: lonResult,
                height: heightResult
            });
        }
    });
    
    if (!hasResults) {
        showMessage('没有可导出的计算结果，请先进行计算', 'warning');
        return;
    }
    
    // 生成导出内容
    let content = '点名\tX坐标(m)\tY坐标(m)\tZ坐标(m)\t纬度(°)\t经度(°)\t大地高(m)\n';
    results.forEach(result => {
        content += `${result.name}\t${result.x}\t${result.y}\t${result.z}\t${result.latitude}\t${result.longitude}\t${result.height}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `XYZ_TO_BLH_${new Date().toISOString().slice(0, 10)}.txt`;
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
window.initializeXYZToBLH = initializeXYZToBLH;
window.initializeXYZToBLHTable = initializeXYZToBLHTable;
window.bindXYZToBLHEvents = bindXYZToBLHEvents;
window.performXYZToBLHCalculation = performXYZToBLHCalculation;
window.openXYZToBLHSettings = openXYZToBLHSettings;
window.exportXYZToBLHResults = exportXYZToBLHResults;
window.updateXYZToBLHParametersDisplay = updateXYZToBLHParametersDisplay;

console.log('✅ XYZ→BLH转换模块加载完成');
console.log('🔍 导出的全局函数:', {
    'exportXYZToBLHResults': typeof window.exportXYZToBLHResults,
    'initializeXYZToBLH': typeof window.initializeXYZToBLH,
    'performXYZToBLHCalculation': typeof window.performXYZToBLHCalculation
});