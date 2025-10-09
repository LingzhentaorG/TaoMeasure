/**
 * 线性基函数拟合和面基函数拟合专用功能
 */

// 设置线性基函数拟合的表单联动
function setupLinearFittingDependencies() {
    const modal = document.getElementById('linearFittingSettingsModal');
    if (!modal) return;
    
    // 中央子午线类型联动
    const meridianTypeSelect = modal.querySelector('select[name="central_meridian_type"]');
    const manualMeridianRows = modal.querySelectorAll('.manual-meridian');
    
    if (meridianTypeSelect) {
        meridianTypeSelect.addEventListener('change', function() {
            const isManual = this.value === 'manual';
            manualMeridianRows.forEach(row => {
                row.style.display = isManual ? 'flex' : 'none';
            });
        });
        // 触发初始状态
        meridianTypeSelect.dispatchEvent(new Event('change'));
    }
    
    // 抵偿高程面类型联动
    const heightTypeSelect = modal.querySelector('select[name="compensation_height_type"]');
    const manualHeightRows = modal.querySelectorAll('.manual-height');
    
    if (heightTypeSelect) {
        heightTypeSelect.addEventListener('change', function() {
            const isManual = this.value === 'manual';
            manualHeightRows.forEach(row => {
                row.style.display = isManual ? 'flex' : 'none';
            });
        });
        // 触发初始状态
        heightTypeSelect.dispatchEvent(new Event('change'));
    }
    
    // 中线起点类型联动
    const originTypeSelect = modal.querySelector('select[name="centerline_origin_type"]');
    const manualOriginRows = modal.querySelectorAll('.manual-origin');
    
    if (originTypeSelect) {
        originTypeSelect.addEventListener('change', function() {
            const isManual = this.value === 'manual';
            manualOriginRows.forEach(row => {
                row.style.display = isManual ? 'flex' : 'none';
            });
        });
        // 触发初始状态
        originTypeSelect.dispatchEvent(new Event('change'));
    }
    
    // 拟合模型选择联动
    const modelRadios = modal.querySelectorAll('input[name="fitting_model"]');
    modelRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateLinearModelDescription(this.value);
        });
    });
}

// 设置面基函数拟合的表单联动
function setupSurfaceFittingDependencies() {
    const modal = document.getElementById('surfaceFittingSettingsModal');
    if (!modal) return;
    
    // 参考点类型联动
    const refPointTypeSelect = modal.querySelector('select[name="reference_point_type"]');
    const selectRefRows = modal.querySelectorAll('.select-reference');
    const manualRefRows = modal.querySelectorAll('.manual-reference');
    
    if (refPointTypeSelect) {
        refPointTypeSelect.addEventListener('change', function() {
            const value = this.value;
            selectRefRows.forEach(row => {
                row.style.display = value === 'select' ? 'flex' : 'none';
            });
            manualRefRows.forEach(row => {
                row.style.display = value === 'manual' ? 'flex' : 'none';
            });
            
            // 如果选择从已知点中选择，更新选项列表
            if (value === 'select') {
                updateReferencePointOptions();
            }
        });
        // 触发初始状态
        refPointTypeSelect.dispatchEvent(new Event('change'));
    }
    
    // 拟合模型选择联动
    const modelRadios = modal.querySelectorAll('input[name="surface_model"]');
    modelRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateSurfaceModelDescription(this.value);
        });
    });
}

// 更新线性模型描述
function updateLinearModelDescription(modelType) {
    const modal = document.getElementById('linearFittingSettingsModal');
    if (!modal) return;
    
    const description = modal.querySelector('.model-description');
    if (!description) return;
    
    let minPoints = 2;
    let modelDesc = '';
    
    if (modelType === 'linear') {
        minPoints = 2;
        modelDesc = '直线模型适用于高程异常变化较为均匀的线性工程。';
    } else if (modelType === 'quadratic') {
        minPoints = 3;
        modelDesc = '二次曲线模型适用于高程异常有一定变化趋势的线性工程，精度更高。';
    }
    
    description.innerHTML = `
        <p><strong>线性基函数拟合</strong>适用于铁路、公路等线性工程。</p>
        <p><strong>适用场景:</strong> 线性工程，含独立线路坐标系建立</p>
        <p><strong>最少点数:</strong> ${modelDesc.includes('直线') ? '直线' : '二次曲线'}模型≥${minPoints}个点</p>
        <p><strong>模型特点:</strong> ${modelDesc}</p>
    `;
}

// 更新面模型描述
function updateSurfaceModelDescription(modelType) {
    const modal = document.getElementById('surfaceFittingSettingsModal');
    if (!modal) return;
    
    const description = modal.querySelector('.model-description');
    if (!description) return;
    
    let minPoints = 3;
    let modelDesc = '';
    
    if (modelType === 'plane') {
        minPoints = 3;
        modelDesc = '平面模型适用于高程异常变化较为均匀的平坦区域。';
    } else if (modelType === 'quadratic') {
        minPoints = 6;
        modelDesc = '二次曲面模型适用于高程异常有一定变化趋势的区域，精度更高。';
    }
    
    description.innerHTML = `
        <p><strong>面基函数拟合</strong>适用于大面积、地形略有起伏的面状区域。</p>
        <p><strong>适用场景:</strong> 大面积测区，含参考点设置</p>
        <p><strong>最少点数:</strong> ${modelDesc.includes('平面') ? '平面' : '二次曲面'}模型≥${minPoints}个点</p>
        <p><strong>模型特点:</strong> ${modelDesc}</p>
        <p><strong>参考点建议:</strong> 选择靠近测区中心位置的已知点</p>
    `;
}

// 更新参考点选项
function updateReferencePointOptions() {
    const modal = document.getElementById('surfaceFittingSettingsModal');
    if (!modal) return;
    
    const select = modal.querySelector('select[name="reference_point_name"]');
    if (!select) return;
    
    // 清空现有选项
    select.innerHTML = '<option value="">请选择参考点</option>';
    
    // 获取已知点数据
    const knownPoints = collectTableData('known');
    
    if (knownPoints.length === 0) {
        select.innerHTML = '<option value="">请先添加已知点数据</option>';
        return;
    }
    
    // 添加已知点选项
    knownPoints.forEach(point => {
        if (point.name) {
            const option = document.createElement('option');
            option.value = point.name;
            option.textContent = `${point.name} (${point.lat.toFixed(6)}, ${point.lon.toFixed(6)})`;
            select.appendChild(option);
        }
    });
}

// 收集线性基函数拟合设置
function collectLinearFittingSettings(modal) {
    const settings = {};
    
    // 线性模型专属参数
    settings.central_meridian_type = modal.querySelector('select[name="central_meridian_type"]')?.value || 'auto';
    if (settings.central_meridian_type === 'manual') {
        settings.central_meridian_manual = modal.querySelector('input[name="central_meridian_manual"]')?.value || '114°00′00″';
    }
    
    settings.compensation_height_type = modal.querySelector('select[name="compensation_height_type"]')?.value || 'auto';
    if (settings.compensation_height_type === 'manual') {
        settings.compensation_height_manual = parseFloat(modal.querySelector('input[name="compensation_height_manual"]')?.value) || 0;
    }
    
    settings.centerline_origin_type = modal.querySelector('select[name="centerline_origin_type"]')?.value || 'auto';
    if (settings.centerline_origin_type === 'manual') {
        settings.origin_latitude = modal.querySelector('input[name="origin_latitude"]')?.value || '';
        settings.origin_longitude = modal.querySelector('input[name="origin_longitude"]')?.value || '';
    }
    
    // 拟合模型
    const fittingModelRadio = modal.querySelector('input[name="fitting_model"]:checked');
    settings.model_type = fittingModelRadio?.value || 'quadratic';
    
    return settings;
}

// 收集面基函数拟合设置
function collectSurfaceFittingSettings(modal) {
    const settings = {};
    
    // 面拟合专属参数
    settings.reference_point_type = modal.querySelector('select[name="reference_point_type"]')?.value || 'auto';
    if (settings.reference_point_type === 'select') {
        settings.reference_point_name = modal.querySelector('select[name="reference_point_name"]')?.value || '';
    } else if (settings.reference_point_type === 'manual') {
        settings.reference_latitude = modal.querySelector('input[name="reference_latitude"]')?.value || '';
        settings.reference_longitude = modal.querySelector('input[name="reference_longitude"]')?.value || '';
    }
    
    // 拟合模型
    const surfaceModelRadio = modal.querySelector('input[name="surface_model"]:checked');
    settings.model_type = surfaceModelRadio?.value || 'quadratic';
    
    return settings;
}

// 验证线性基函数拟合设置
function validateLinearFittingSettings(settings, knownPointsCount) {
    const errors = [];
    
    // 检查点数要求
    const minPoints = settings.model_type === 'linear' ? 2 : 3;
    if (knownPointsCount < minPoints) {
        errors.push(`${settings.model_type === 'linear' ? '直线' : '二次曲线'}模型至少需要 ${minPoints} 个已知点，当前只有 ${knownPointsCount} 个`);
    }
    
    // 检查手动输入的参数
    if (settings.central_meridian_type === 'manual' && !settings.central_meridian_manual) {
        errors.push('请输入中央子午线');
    }
    
    if (settings.centerline_origin_type === 'manual') {
        if (!settings.origin_latitude || !settings.origin_longitude) {
            errors.push('请输入中线起点坐标');
        }
    }
    
    return errors;
}

// 验证面基函数拟合设置
function validateSurfaceFittingSettings(settings, knownPointsCount) {
    const errors = [];
    
    // 检查点数要求
    const minPoints = settings.model_type === 'plane' ? 3 : 6;
    if (knownPointsCount < minPoints) {
        errors.push(`${settings.model_type === 'plane' ? '平面' : '二次曲面'}模型至少需要 ${minPoints} 个已知点，当前只有 ${knownPointsCount} 个`);
    }
    
    // 检查参考点设置
    if (settings.reference_point_type === 'select' && !settings.reference_point_name) {
        errors.push('请选择参考点');
    }
    
    if (settings.reference_point_type === 'manual') {
        if (!settings.reference_latitude || !settings.reference_longitude) {
            errors.push('请输入参考点坐标');
        }
    }
    
    return errors;
}

// 将这些函数添加到全局作用域
window.setupLinearFittingDependencies = setupLinearFittingDependencies;
window.setupSurfaceFittingDependencies = setupSurfaceFittingDependencies;
window.updateLinearModelDescription = updateLinearModelDescription;
window.updateSurfaceModelDescription = updateSurfaceModelDescription;
window.updateReferencePointOptions = updateReferencePointOptions;
window.collectLinearFittingSettings = collectLinearFittingSettings;
window.collectSurfaceFittingSettings = collectSurfaceFittingSettings;
window.validateLinearFittingSettings = validateLinearFittingSettings;
window.validateSurfaceFittingSettings = validateSurfaceFittingSettings;