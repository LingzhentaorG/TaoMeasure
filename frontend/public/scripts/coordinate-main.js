document.addEventListener('DOMContentLoaded', function () {
    const coordWorkArea = document.getElementById('coordinate-work-area');
    if (!coordWorkArea) return;

    const COORD_FUNC_CONFIG = {
        'gauss_forward': {
            title: '高斯投影正算',
            importFormat: '点名 纬度(B) 经度(L)',
            example: 'P01 23°10′30″ 114°05′20″'
        },
        'gauss_inverse': {
            title: '高斯投影反算',
            importFormat: '点名 x(m) y(m)',
            example: 'P01 2556789.123 512345.678'
        },
        'xyz_to_blh': {
            title: 'XYZ → BLH',
            importFormat: '点名 X(m) Y(m) Z(m)',
            example: 'P01 2188701.234 5033345.567 3234567.890'
        },
        'blh_to_xyz': {
            title: 'BLH → XYZ',
            importFormat: '点名 纬度(B) 经度(L) 大地高(H)',
            example: 'P01 23°10′30″ 114°05′20″ 85.234'
        },
        'zone_transform_1': {
            title: '换带与投影面变换1',
            importFormat: '点名 x(m) y(m)',
            example: 'P01 2556789.123 512345.678'
        },
        'zone_transform_2': {
            title: '换带与投影面变换2',
            importFormat: '点名 x(m) y(m) 大地高(H)',
            example: 'P01 2556789.123 512345.678 85.234'
        },
        'four_param_forward': {
            title: '四参数转换正算',
            importFormat: '点名 X(m) Y(m)',
            example: 'P01 12345.678 23456.789'
        },
        'seven_param': {
            title: '七参数转换',
            importFormat: '点名 X(m) Y(m) Z(m)',
            example: 'P01 2188701.234 5033345.567 3234567.890',
            commonPointsFormat: '点名 源X(m) 源Y(m) 源Z(m) 目标X(m) 目标Y(m) 目标Z(m)',
            commonPointsExample: 'P01 -2148744.123 4426641.456 4044492.789 -2148744.456 4426641.789 4044493.123'
        }
    };

    coordWorkArea.addEventListener('click', function(event) {
        const target = event.target.closest('button.tool-btn');
        if (!target) return;

        const action = target.dataset.action;
        if (!action) return;

        const functionContent = target.closest('.function-content');
        if (!functionContent) return;
        
        const func = functionContent.id.replace('-content', '');

        switch (action) {
            case 'import-data':
                handleCoordImport(func);
                break;
            case 'import-common-points':
                handleCoordImportCommonPoints(func);
                break;
            case 'settings':
                handleCoordSettings(func);
                break;
            case 'calculate':
                handleCoordCalculation(func);
                break;
            case 'table-settings':
                handleCoordTableSettings();
                break;
            case 'export-result':
                handleCoordExport(func);
                break;
        }
    });

    function handleCoordSettings(func) {
        if (window.openCoordSettingsModal) {
            window.openCoordSettingsModal(func);
        } else {
            console.error('openCoordSettingsModal function not found.');
            alert('无法打开计算方案设置。');
        }
    }

    function handleCoordImportCommonPoints(func) {
        const config = COORD_FUNC_CONFIG[func];
        if (!config) {
            showMessage('未知的坐标转换功能', 'error');
            return;
        }

        const modal = document.getElementById('importModal');
        const title = modal.querySelector('.modal-title');
        const formatInfo = modal.querySelector('#formatInfo');
        
        // 设置标题
        title.textContent = `导入公共点 - ${config.title}`;
        
        // 设置格式说明
        formatInfo.innerHTML = `
            <p><strong>数据格式：</strong>${config.commonPointsFormat || '点名 源X 源Y 目标X 目标Y'}</p>
            <p><strong>示例：</strong>${config.commonPointsExample || 'P01 12345.678 23456.789 22345.678 33456.789'}</p>
            <p><strong>说明：</strong>至少需要3个公共点才能解算转换参数</p>
        `;
        
        // 显示手动输入区域（如果存在）
        const manualSection = modal.querySelector('#manualInputSection');
        if (manualSection) {
            manualSection.style.display = 'block';
            
            // 根据功能类型调整手动输入字段
            const coordInputs = manualSection.querySelector('#coordInputs');
            if (coordInputs) {
                if (func === 'seven_param') {
                    coordInputs.innerHTML = `
                        <div class="input-group">
                            <label>点名：</label>
                            <input type="text" id="manualPointName" placeholder="P01">
                        </div>
                        <div class="input-group">
                            <label>源X(m)：</label>
                            <input type="number" id="manualSourceX" placeholder="2188701.234" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>源Y(m)：</label>
                            <input type="number" id="manualSourceY" placeholder="5033345.567" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>源Z(m)：</label>
                            <input type="number" id="manualSourceZ" placeholder="3234567.890" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>目标X(m)：</label>
                            <input type="number" id="manualTargetX" placeholder="2188701.567" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>目标Y(m)：</label>
                            <input type="number" id="manualTargetY" placeholder="5033345.890" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>目标Z(m)：</label>
                            <input type="number" id="manualTargetZ" placeholder="3234568.123" step="0.001">
                        </div>
                    `;
                } else {
                    // 四参数格式
                    coordInputs.innerHTML = `
                        <div class="input-group">
                            <label>点名：</label>
                            <input type="text" id="manualPointName" placeholder="P01">
                        </div>
                        <div class="input-group">
                            <label>源X(m)：</label>
                            <input type="number" id="manualSourceX" placeholder="12345.678" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>源Y(m)：</label>
                            <input type="number" id="manualSourceY" placeholder="23456.789" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>目标X(m)：</label>
                            <input type="number" id="manualTargetX" placeholder="22345.678" step="0.001">
                        </div>
                        <div class="input-group">
                            <label>目标Y(m)：</label>
                            <input type="number" id="manualTargetY" placeholder="33456.789" step="0.001">
                        </div>
                    `;
                }
            }
        }
        
        modal.dataset.importType = func + '_common_points';
        modal.style.display = 'block';
    }

    function handleCoordImport(func) {
        const config = COORD_FUNC_CONFIG[func];
        if (!config) {
            console.error('No config for function:', func);
            return;
        }

        const modal = document.getElementById('importModal');
        const titleEl = document.getElementById('importModalTitle');
        const formatInfoEl = modal.querySelector('.file-format-info');

        if (modal && titleEl && formatInfoEl) {
            titleEl.textContent = `导入数据 - ${config.title}`;
            modal.dataset.importType = func;

            formatInfoEl.innerHTML = `
                <h4>文件格式说明:</h4>
                <p><strong>格式:</strong> ${config.importFormat}</p>
                <p><strong>示例:</strong></p>
                <pre>${config.example}</pre>
            `;
            
            const manualHeightAnomalyRow = document.getElementById('manualHeightAnomalyRow');
            if (manualHeightAnomalyRow) {
                manualHeightAnomalyRow.style.display = 'none';
            }

            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    function handleCoordCalculation(func) {
        const config = COORD_FUNC_CONFIG[func];
        
        switch(func) {
            case 'gauss_forward':
                if (typeof performGaussForwardCalculation === 'function') {
                    performGaussForwardCalculation();
                } else {
                    console.error('performGaussForwardCalculation function not found');
                    alert('高斯投影正算计算功能未找到');
                }
                break;
                
            case 'gauss_inverse':
                if (typeof performGaussInverseCalculation === 'function') {
                    performGaussInverseCalculation();
                } else {
                    console.error('performGaussInverseCalculation function not found');
                    alert('高斯投影反算计算功能未找到');
                }
                break;
                
            case 'xyz_to_blh':
                if (typeof performXYZToBLHCalculation === 'function') {
                    performXYZToBLHCalculation();
                } else {
                    console.error('performXYZToBLHCalculation function not found');
                    alert('XYZ→BLH转换计算功能未找到');
                }
                break;
                
            case 'blh_to_xyz':
                if (typeof performBLHToXYZCalculation === 'function') {
                    performBLHToXYZCalculation();
                } else {
                    console.error('performBLHToXYZCalculation function not found');
                    alert('BLH→XYZ转换计算功能未找到');
                }
                break;
                
            case 'zone_transform_1':
                if (typeof performZoneTransform1Calculation === 'function') {
                    performZoneTransform1Calculation();
                } else {
                    console.error('performZoneTransform1Calculation function not found');
                    alert('换带与投影面变换1计算功能未找到');
                }
                break;
                
            case 'zone_transform_2':
                if (typeof performZoneTransform2Calculation === 'function') {
                    performZoneTransform2Calculation();
                } else {
                    console.error('performZoneTransform2Calculation function not found');
                    alert('换带与投影面变换2计算功能未找到');
                }
                break;
                
            case 'four_param_forward':
                if (typeof performFourParamForwardCalculation === 'function') {
                    performFourParamForwardCalculation();
                } else {
                    console.error('performFourParamForwardCalculation function not found');
                    alert('四参数转换正算计算功能未找到');
                }
                break;
                

            case 'seven_param':
                if (typeof performSevenParamCalculation === 'function') {
                    performSevenParamCalculation();
                } else {
                    console.error('performSevenParamCalculation function not found');
                    alert('七参数转换计算功能未找到');
                }
                break;
                
            default:
                if(config) {
                    alert(`"${config.title}"的计算功能未实现。`);
                }
                break;
        }
    }

    function handleCoordTableSettings() {
        const modal = document.getElementById('tableSettingsModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    function handleCoordExport(func) {
        const config = COORD_FUNC_CONFIG[func];
        
        switch(func) {
            case 'gauss_forward':
                if (typeof showGaussExportDialog === 'function') {
                    showGaussExportDialog();
                } else {
                    console.error('showGaussExportDialog function not found');
                    alert('高斯投影正算导出功能未找到');
                }
                break;
                
            case 'gauss_inverse':
                if (typeof showGaussInverseExportDialog === 'function') {
                    showGaussInverseExportDialog();
                } else {
                    console.error('showGaussInverseExportDialog function not found');
                    alert('高斯投影反算导出功能未找到');
                }
                break;
                
            case 'xyz_to_blh':
                console.log('🔍 检查 exportXYZToBLHResults 函数是否存在:', typeof exportXYZToBLHResults);
                console.log('🔍 检查 window.exportXYZToBLHResults 函数是否存在:', typeof window.exportXYZToBLHResults);
                
                // 使用全局变量确保只执行一次，防止重复调用
                if (typeof window.exportXYZToBLHExecuted === 'undefined') {
                    window.exportXYZToBLHExecuted = false;
                }
                
                if (!window.exportXYZToBLHExecuted) {
                    window.exportXYZToBLHExecuted = true;
                    
                    if (typeof exportXYZToBLHResults === 'function') {
                        console.log('✅ 找到 exportXYZToBLHResults 函数，开始执行导出');
                        exportXYZToBLHResults();
                    } else if (typeof window.exportXYZToBLHResults === 'function') {
                        console.log('✅ 找到 window.exportXYZToBLHResults 函数，开始执行导出');
                        window.exportXYZToBLHResults();
                    } else {
                        console.error('❌ exportXYZToBLHResults function not found');
                        console.error('❌ 可用函数列表:', Object.keys(window).filter(key => key.includes('export')).join(', '));
                        alert('XYZ→BLH转换导出功能未找到');
                    }
                    
                    // 重置标志位，允许下次导出
                    setTimeout(() => {
                        window.exportXYZToBLHExecuted = false;
                    }, 1000);
                } else {
                    console.log('⚠️ XYZ到BLH导出已在执行中，跳过重复调用');
                }
                break;
                
            case 'blh_to_xyz':
                console.log('🔍 检查 exportBLHToXYZResults 函数是否存在:', typeof exportBLHToXYZResults);
                console.log('🔍 检查 window.exportBLHToXYZResults 函数是否存在:', typeof window.exportBLHToXYZResults);
                
                // 使用全局变量确保只执行一次，防止重复调用
                if (typeof window.exportBLHToXYZExecuted === 'undefined') {
                    window.exportBLHToXYZExecuted = false;
                }
                
                if (!window.exportBLHToXYZExecuted) {
                    window.exportBLHToXYZExecuted = true;
                    
                    if (typeof exportBLHToXYZResults === 'function') {
                        console.log('✅ 找到 exportBLHToXYZResults 函数，开始执行导出');
                        exportBLHToXYZResults();
                    } else if (typeof window.exportBLHToXYZResults === 'function') {
                        console.log('✅ 找到 window.exportBLHToXYZResults 函数，开始执行导出');
                        window.exportBLHToXYZResults();
                    } else {
                        console.error('❌ exportBLHToXYZResults function not found');
                        console.error('❌ 可用函数列表:', Object.keys(window).filter(key => key.includes('export')).join(', '));
                        alert('BLH→XYZ转换导出功能未找到');
                    }
                    
                    // 重置标志位，允许下次导出
                    setTimeout(() => {
                        window.exportBLHToXYZExecuted = false;
                    }, 1000);
                } else {
                    console.log('⚠️ BLH到XYZ导出已在执行中，跳过重复调用');
                }
                break;
                
            case 'zone_transform_1':
                if (typeof showZoneTransform1ExportDialog === 'function') {
                    showZoneTransform1ExportDialog();
                } else {
                    console.error('showZoneTransform1ExportDialog function not found');
                    alert('换带与投影面变换1导出功能未找到');
                }
                break;
                
            case 'zone_transform_2':
                if (typeof showZoneTransform2ExportDialog === 'function') {
                    showZoneTransform2ExportDialog();
                } else {
                    console.error('showZoneTransform2ExportDialog function not found');
                    alert('换带与投影面变换2导出功能未找到');
                }
                break;
                
            case 'four_param_forward':
                if (typeof showFourParamForwardExportDialog === 'function') {
                    showFourParamForwardExportDialog();
                } else {
                    console.error('showFourParamForwardExportDialog function not found');
                    alert('四参数转换正算导出功能未找到');
                }
                break;
                

            case 'seven_param':
                if (typeof showSevenParamExportDialog === 'function') {
                    showSevenParamExportDialog();
                } else {
                    console.error('showSevenParamExportDialog function not found');
                    alert('七参数转换导出功能未找到');
                }
                break;
                
            default:
                if(config) {
                    alert(`"${config.title}"的导出功能未实现。`);
                }
                break;
        }
    }
});