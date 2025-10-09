/**
 * 增强的导出功能模块
 * 支持多种格式：TXT、DAT、Excel、Word
 */

class ExportManager {
    constructor() {
        this.supportedFormats = ['txt', 'dat', 'csv', 'excel', 'word'];
        this.initializeExportModal();
    }

    /**
     * 初始化导出模态框
     */
    initializeExportModal() {
        // 检查是否已存在导出模态框
        if (document.getElementById('exportModal')) {
            return;
        }

        const modalHTML = `
            <div class="modal" id="exportModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>结果导出</h3>
                        <span class="close" onclick="closeModal('exportModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="export-section">
                            <h4>导出格式</h4>
                            <div class="format-grid">
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="txt" checked>
                                    <span class="format-label">
                                        <i class="fas fa-file-alt"></i>
                                        <strong>TXT文本</strong>
                                        <small>纯文本格式，通用性强</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="dat">
                                    <span class="format-label">
                                        <i class="fas fa-database"></i>
                                        <strong>DAT数据</strong>
                                        <small>测量数据标准格式</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="csv">
                                    <span class="format-label">
                                        <i class="fas fa-table"></i>
                                        <strong>CSV表格</strong>
                                        <small>逗号分隔值格式</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="excel">
                                    <span class="format-label">
                                        <i class="fas fa-file-excel"></i>
                                        <strong>Excel表格</strong>
                                        <small>Microsoft Excel格式</small>
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="word">
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
                                <label><input type="checkbox" id="includeParameters" checked> 基础参数</label>
                                <label><input type="checkbox" id="includeKnownPoints" checked> 已知点数据</label>
                                <label><input type="checkbox" id="includeUnknownPoints" checked> 未知点结果</label>
                                <label><input type="checkbox" id="includeAccuracy" checked> 精度评定</label>
                                <label><input type="checkbox" id="includeFittingParams" checked> 拟合参数</label>
                                <label><input type="checkbox" id="includeIntermediate"> 中间计算过程</label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4>文件设置</h4>
                            <div class="file-settings">
                                <div class="param-row">
                                    <label>文件名:</label>
                                    <input type="text" id="exportFileName" placeholder="GPS高程转换结果">
                                </div>
                                <div class="param-row">
                                    <label><input type="checkbox" id="includeTimestamp" checked> 包含时间戳</label>
                                </div>
                                <div class="param-row">
                                    <label>小数位数:</label>
                                    <select id="decimalPlaces">
                                        <option value="2">2位</option>
                                        <option value="3">3位</option>
                                        <option value="4">4位</option>
                                        <option value="5" selected>5位</option>
                                    </select>
                                </div>
                                <div class="param-row">
                                    <label>拟合系数小数位:</label>
                                    <select id="fittingCoefficientDecimalPlaces">
                                        <option value="6">6位</option>
                                        <option value="8">8位</option>
                                        <option value="10">10位</option>
                                        <option value="12" selected>12位</option>
                                        <option value="15">15位</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="tool-btn" onclick="closeModal('exportModal')">取消</button>
                        <button class="tool-btn primary" onclick="exportManager.performExport()">导出</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * 显示导出对话框
     */
    showExportDialog() {
        // 检查是否有计算结果
        if (!window.calculationResults || Object.keys(window.calculationResults).length === 0) {
            showMessage('没有可导出的计算结果，请先进行计算', 'error');
            return;
        }

        // 设置默认文件名
        const projectName = document.getElementById('projectName')?.value || '工程测量';
        const functionName = window.FUNCTION_CONFIG?.[window.currentFunction]?.title?.split(' - ')[1] || 'GPS高程转换';
        document.getElementById('exportFileName').value = `${projectName}_${functionName}`;

        // 显示模态框
        document.getElementById('exportModal').style.display = 'block';
    }

    /**
     * 执行导出
     */
    performExport() {
        try {
            // 获取导出设置
            const format = document.querySelector('input[name="exportFormat"]:checked').value;
            const fileName = document.getElementById('exportFileName').value || 'GPS高程转换结果';
            const includeTimestamp = document.getElementById('includeTimestamp').checked;
            const decimalPlaces = parseInt(document.getElementById('decimalPlaces').value);
            const fittingCoefficientDecimalPlaces = parseInt(document.getElementById('fittingCoefficientDecimalPlaces').value);

            // 获取导出内容选项
            const contentOptions = {
                parameters: document.getElementById('includeParameters').checked,
                knownPoints: document.getElementById('includeKnownPoints').checked,
                unknownPoints: document.getElementById('includeUnknownPoints').checked,
                accuracy: document.getElementById('includeAccuracy').checked,
                fittingParams: document.getElementById('includeFittingParams').checked,
                intermediate: document.getElementById('includeIntermediate').checked
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
                    this.exportToTxt(finalFileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
                    break;
                case 'dat':
                    this.exportToDat(finalFileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
                    break;
                case 'csv':
                    this.exportToCsv(finalFileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
                    break;
                case 'excel':
                    this.exportToExcel(finalFileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
                    break;
                case 'word':
                    this.exportToWord(finalFileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
                    break;
                default:
                    throw new Error('不支持的导出格式');
            }

            // 关闭模态框
            closeModal('exportModal');
            showMessage(`成功导出为 ${format.toUpperCase()} 格式`, 'success');

        } catch (error) {
            console.error('导出失败:', error);
            showMessage('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 收集导出数据
     */
    collectExportData(contentOptions, decimalPlaces) {
        const data = {
            projectInfo: {},
            knownPoints: [],
            unknownPoints: [],
            calculationResults: {},
            accuracy: {},
            parameters: {}
        };

        // 项目信息
        if (contentOptions.parameters) {
            data.projectInfo = {
                projectName: document.getElementById('projectName')?.value || '',
                functionName: window.FUNCTION_CONFIG?.[window.currentFunction]?.title || '',
                calcDate: document.getElementById('calcDate')?.value || new Date().toISOString().slice(0, 10),
                calculator: document.getElementById('calculator')?.value || '',
                checker: document.getElementById('checker')?.value || '',
                exportTime: new Date().toLocaleString('zh-CN')
            };
        }

        // 已知点数据
        if (contentOptions.knownPoints) {
            data.knownPoints = collectTableData('known');
        }

        // 未知点数据
        if (contentOptions.unknownPoints) {
            data.unknownPoints = collectTableData('unknown');
        }

        // 计算结果
        if (window.calculationResults) {
            data.calculationResults = window.calculationResults;
        }

        return data;
    }

    /**
     * 导出为TXT格式
     */
    exportToTxt(fileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces);
        let content = '';

        // 项目信息
        if (contentOptions.parameters && data.projectInfo) {
            content += '='.repeat(60) + '\n';
            content += '                GPS高程转换计算结果报告\n';
            content += '='.repeat(60) + '\n\n';
            content += `项目名称: ${data.projectInfo.projectName}\n`;
            content += `计算功能: ${data.projectInfo.functionName}\n`;
            content += `计算日期: ${data.projectInfo.calcDate}\n`;
            content += `计算员: ${data.projectInfo.calculator}\n`;
            content += `复核员: ${data.projectInfo.checker}\n`;
            content += `导出时间: ${data.projectInfo.exportTime}\n\n`;
        }

        // 已知点数据
        if (contentOptions.knownPoints && data.knownPoints.length > 0) {
            content += '-'.repeat(60) + '\n';
            content += '已知GPS水准点数据\n';
            content += '-'.repeat(60) + '\n';
            content += '点名'.padEnd(12) + '纬度'.padEnd(15) + '经度'.padEnd(15) + 
                      '大地高(m)'.padEnd(12) + '高程异常(m)'.padEnd(12) + '正常高(m)'.padEnd(12) + '备注\n';
            content += '-'.repeat(60) + '\n';
            
            data.knownPoints.forEach(point => {
                const normalHeight = point.H - point.anomaly;
                content += `${point.name.padEnd(12)}${point.lat.toFixed(6).padEnd(15)}${point.lon.toFixed(6).padEnd(15)}` +
                          `${point.H.toFixed(decimalPlaces).padEnd(12)}${point.anomaly.toFixed(5).padEnd(12)}` +
                          `${normalHeight.toFixed(5).padEnd(12)}${(point.remark || '').padEnd(10)}\n`;
            });
            content += '\n';
        }

        // 未知点结果
        if (contentOptions.unknownPoints && data.unknownPoints.length > 0 && data.calculationResults.data) {
            content += '-'.repeat(60) + '\n';
            content += '未知点计算结果\n';
            content += '-'.repeat(60) + '\n';
            content += '点名'.padEnd(12) + '纬度'.padEnd(15) + '经度'.padEnd(15) + 
                      '大地高(m)'.padEnd(12) + '计算高程异常(m)'.padEnd(15) + '正常高(m)'.padEnd(12) + '\n';
            content += '-'.repeat(60) + '\n';
            
            data.calculationResults.data.forEach(result => {
                content += `${result.name.padEnd(12)}${result.lat.toFixed(6).padEnd(15)}${result.lon.toFixed(6).padEnd(15)}` +
                          `${result.H.toFixed(decimalPlaces).padEnd(12)}${result.calculated_anomaly.toFixed(5).padEnd(15)}` +
                          `${result.normal_height.toFixed(decimalPlaces).padEnd(12)}\n`;
            });
            content += '\n';
        }

        // 精度评定
        if (contentOptions.accuracy && data.calculationResults) {
            content += '-'.repeat(60) + '\n';
            content += '精度评定结果\n';
            content += '-'.repeat(60) + '\n';
            content += `单位权中误差: ±${(data.calculationResults.unit_weight_error || 0).toFixed(decimalPlaces)}m\n`;
            content += `最大残差: ${(data.calculationResults.max_residual || 0).toFixed(decimalPlaces)}m\n`;
            content += `最小残差: ${(data.calculationResults.min_residual || 0).toFixed(decimalPlaces)}m\n`;
            content += `已知点数量: ${data.calculationResults.known_points_count || 0}个\n`;
            content += `未知点数量: ${data.calculationResults.unknown_points_count || 0}个\n\n`;
        }

        // 拟合参数
        if (contentOptions.fittingParams && data.calculationResults.parameters) {
            content += '-'.repeat(60) + '\n';
            content += '拟合参数\n';
            content += '-'.repeat(60) + '\n';
            
            const parameters = data.calculationResults.parameters;
            
            // 模型类型
            if (parameters['模型类型']) {
                content += `模型类型: ${parameters['模型类型']}\n`;
            }
            
            // 拟合系数
            if (parameters['拟合系数']) {
                content += '拟合系数:\n';
                Object.entries(parameters['拟合系数']).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        content += `  ${key}: ${typeof value === 'number' ? value.toFixed(fittingCoefficientDecimalPlaces) : value}\n`;
                    }
                });
            }
            
            // 其他参数
            if (parameters['平均高程异常'] !== undefined) {
                content += `平均高程异常: ${parameters['平均高程异常'].toFixed(5)}m\n`;
            }
            if (parameters['线路方位角'] !== undefined) {
                content += `线路方位角: ${parameters['线路方位角'].toFixed(decimalPlaces)}°\n`;
            }
            if (parameters['参考点坐标'] !== undefined) {
                const coords = parameters['参考点坐标'];
                // 检查是否包含"纬度 B₀"和"经度 L₀"（新格式）
                if (coords['纬度 B₀'] !== undefined && coords['经度 L₀'] !== undefined) {
                    content += `参考点坐标: 纬度 B₀: ${coords['纬度 B₀']?.toFixed(6)}°, 经度 L₀: ${coords['经度 L₀']?.toFixed(6)}°\n`;
                } else {
                    // 使用旧格式
                    content += `参考点坐标: 纬度 ${coords.纬度?.toFixed(6) || coords.lat?.toFixed(6)}°, 经度 ${coords.经度?.toFixed(6) || coords.lon?.toFixed(6)}°\n`;
                }
            }
            if (parameters['已知点数量'] !== undefined) {
                content += `已知点数量: ${parameters['已知点数量']}个\n`;
            }
            if (parameters['未知点数量'] !== undefined) {
                content += `未知点数量: ${parameters['未知点数量']}个\n`;
            }
            
            content += '\n';
        }

        this.downloadFile(content, `${fileName}.txt`, 'text/plain;charset=utf-8');
    }

    /**
     * 导出为DAT格式
     */
    exportToDat(fileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces);
        let content = '';

        // DAT格式头部信息
        content += `# GPS高程转换数据文件\n`;
        content += `# 项目: ${data.projectInfo?.projectName || ''}\n`;
        content += `# 日期: ${data.projectInfo?.calcDate || ''}\n`;
        content += `# 格式: 点名,纬度,经度,大地高,高程异常,正常高\n`;
        content += `#\n`;

        // 已知点数据
        if (contentOptions.knownPoints && data.knownPoints.length > 0) {
            content += `# 已知GPS水准点\n`;
            data.knownPoints.forEach(point => {
                const normalHeight = point.H - point.anomaly;
                content += `${point.name},${point.lat.toFixed(6)},${point.lon.toFixed(6)},` +
                          `${point.H.toFixed(decimalPlaces)},${point.anomaly.toFixed(5)},` +
                          `${normalHeight.toFixed(5)},KNOWN\n`;
            });
        }

        // 未知点结果
        if (contentOptions.unknownPoints && data.calculationResults.data) {
            content += `# 未知点计算结果\n`;
            data.calculationResults.data.forEach(result => {
                content += `${result.name},${result.lat.toFixed(6)},${result.lon.toFixed(6)},` +
                          `${result.H.toFixed(decimalPlaces)},${result.calculated_anomaly.toFixed(5)},` +
                          `${result.normal_height.toFixed(decimalPlaces)},UNKNOWN\n`;
            });
        }

        this.downloadFile(content, `${fileName}.dat`, 'text/plain;charset=utf-8');
    }

    /**
     * 导出为CSV格式
     */
    exportToCsv(fileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
        const csvData = [];

        // 项目信息
        if (contentOptions.parameters) {
            csvData.push(['GPS高程转换计算结果']);
            csvData.push(['项目名称', data.projectInfo?.projectName || '']);
            csvData.push(['计算功能', data.projectInfo?.functionName || '']);
            csvData.push(['计算日期', data.projectInfo?.calcDate || '']);
            csvData.push(['计算员', data.projectInfo?.calculator || '']);
            csvData.push(['复核员', data.projectInfo?.checker || '']);
            csvData.push([]);
        }

        // 已知点数据
        if (contentOptions.knownPoints && data.knownPoints.length > 0) {
            csvData.push(['已知GPS水准点数据']);
            csvData.push(['点名', '纬度', '经度', '大地高(m)', '高程异常(m)', '正常高(m)', '备注']);
            data.knownPoints.forEach(point => {
                const normalHeight = point.H - point.anomaly;
                csvData.push([
                    point.name,
                    point.lat.toFixed(6),
                    point.lon.toFixed(6),
                    point.H.toFixed(decimalPlaces),
                    point.anomaly.toFixed(5),
                     normalHeight.toFixed(5),
                    point.remark || ''
                ]);
            });
            csvData.push([]);
        }

        // 未知点结果
        if (contentOptions.unknownPoints && data.calculationResults.data) {
            csvData.push(['未知点计算结果']);
            csvData.push(['点名', '纬度', '经度', '大地高(m)', '计算高程异常(m)', '正常高(m)']);
            data.calculationResults.data.forEach(result => {
                csvData.push([
                    result.name,
                    result.lat.toFixed(6),
                    result.lon.toFixed(6),
                    result.H.toFixed(decimalPlaces),
                    result.calculated_anomaly.toFixed(5),
                    result.normal_height.toFixed(decimalPlaces)
                ]);
            });
        }

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        this.downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8');
    }

    /**
     * 导出为Excel格式（HTML表格格式）
     */
    exportToExcel(fileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
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

        // 项目信息
        if (contentOptions.parameters) {
            htmlContent += `
                <div class="title">GPS高程转换计算结果</div>
                <table>
                    <tr><td>项目名称</td><td>${data.projectInfo?.projectName || ''}</td></tr>
                    <tr><td>计算功能</td><td>${data.projectInfo?.functionName || ''}</td></tr>
                    <tr><td>计算日期</td><td>${data.projectInfo?.calcDate || ''}</td></tr>
                    <tr><td>计算员</td><td>${data.projectInfo?.calculator || ''}</td></tr>
                    <tr><td>复核员</td><td>${data.projectInfo?.checker || ''}</td></tr>
                </table>
            `;
        }

        // 已知点数据
        if (contentOptions.knownPoints && data.knownPoints.length > 0) {
            htmlContent += `
                <div class="section">
                    <h3>已知GPS水准点数据</h3>
                    <table>
                        <tr>
                            <th>点名</th><th>纬度</th><th>经度</th><th>大地高(m)</th>
                            <th>高程异常(m)</th><th>正常高(m)</th><th>备注</th>
                        </tr>
            `;
            data.knownPoints.forEach(point => {
                const normalHeight = point.H - point.anomaly;
                htmlContent += `
                    <tr>
                        <td>${point.name}</td>
                        <td>${point.lat.toFixed(6)}</td>
                        <td>${point.lon.toFixed(6)}</td>
                        <td>${point.H.toFixed(decimalPlaces)}</td>
                        <td>${point.anomaly.toFixed(5)}</td>
                        <td>${normalHeight.toFixed(5)}</td>
                        <td>${point.remark || ''}</td>
                    </tr>
                `;
            });
            htmlContent += '</table></div>';
        }

        // 未知点结果
        if (contentOptions.unknownPoints && data.calculationResults.data) {
            htmlContent += `
                <div class="section">
                    <h3>未知点计算结果</h3>
                    <table>
                        <tr>
                            <th>点名</th><th>纬度</th><th>经度</th><th>大地高(m)</th>
                            <th>计算高程异常(m)</th><th>正常高(m)</th>
                        </tr>
            `;
            data.calculationResults.data.forEach(result => {
                htmlContent += `
                    <tr>
                        <td>${result.name}</td>
                        <td>${result.lat.toFixed(6)}</td>
                        <td>${result.lon.toFixed(6)}</td>
                        <td>${result.H.toFixed(decimalPlaces)}</td>
                        <td>${result.calculated_anomaly.toFixed(5)}</td>
                        <td>${result.normal_height.toFixed(decimalPlaces)}</td>
                    </tr>
                `;
            });
            htmlContent += '</table></div>';
        }

        htmlContent += '</body></html>';
        this.downloadFile(htmlContent, `${fileName}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    }

    /**
     * 导出为Word格式（HTML格式）
     */
    exportToWord(fileName, contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces, fittingCoefficientDecimalPlaces);
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
        htmlContent += `<div class="title">GPS高程转换计算结果报告</div>`;

        // 项目信息
        if (contentOptions.parameters) {
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

        // 已知点数据
        if (contentOptions.knownPoints && data.knownPoints.length > 0) {
            htmlContent += `
                <div class="subtitle">二、已知GPS水准点数据</div>
                <table>
                    <tr>
                        <th>序号</th><th>点名</th><th>纬度</th><th>经度</th>
                        <th>大地高(m)</th><th>高程异常(m)</th><th>正常高(m)</th><th>备注</th>
                    </tr>
            `;
            data.knownPoints.forEach((point, index) => {
                const normalHeight = point.H - point.anomaly;
                htmlContent += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${point.name}</td>
                        <td>${point.lat.toFixed(6)}</td>
                        <td>${point.lon.toFixed(6)}</td>
                        <td>${point.H.toFixed(decimalPlaces)}</td>
                        <td>${point.anomaly.toFixed(5)}</td>
                        <td>${normalHeight.toFixed(5)}</td>
                        <td>${point.remark || ''}</td>
                    </tr>
                `;
            });
            htmlContent += '</table>';
        }

        // 未知点结果
        if (contentOptions.unknownPoints && data.calculationResults.data) {
            htmlContent += `
                <div class="subtitle">三、未知点计算结果</div>
                <table>
                    <tr>
                        <th>序号</th><th>点名</th><th>纬度</th><th>经度</th>
                        <th>大地高(m)</th><th>计算高程异常(m)</th><th>正常高(m)</th>
                    </tr>
            `;
            data.calculationResults.data.forEach((result, index) => {
                htmlContent += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${result.name}</td>
                        <td>${result.lat.toFixed(6)}</td>
                        <td>${result.lon.toFixed(6)}</td>
                        <td>${result.H.toFixed(decimalPlaces)}</td>
                        <td>${result.calculated_anomaly.toFixed(5)}</td>
                        <td>${result.normal_height.toFixed(decimalPlaces)}</td>
                    </tr>
                `;
            });
            htmlContent += '</table>';
        }

        // 精度评定
        if (contentOptions.accuracy && data.calculationResults) {
            htmlContent += `
                <div class="subtitle">四、精度评定结果</div>
                <table class="info-table">
                    <tr><td>单位权中误差：</td><td>±${(data.calculationResults.unit_weight_error || 0).toFixed(decimalPlaces)}m</td></tr>
                    <tr><td>最大残差：</td><td>${(data.calculationResults.max_residual || 0).toFixed(decimalPlaces)}m</td></tr>
                    <tr><td>最小残差：</td><td>${(data.calculationResults.min_residual || 0).toFixed(decimalPlaces)}m</td></tr>
                    <tr><td>已知点数量：</td><td>${data.calculationResults.known_points_count || 0}个</td></tr>
                    <tr><td>未知点数量：</td><td>${data.calculationResults.unknown_points_count || 0}个</td></tr>
                </table>
            `;
        }

        // 拟合参数
        if (contentOptions.fittingParams && data.calculationResults.parameters) {
            htmlContent += `
                <div class="subtitle">五、拟合参数</div>
                <table class="info-table">
            `;
            
            const parameters = data.calculationResults.parameters;
            
            // 模型类型
            if (parameters['模型类型']) {
                htmlContent += `<tr><td>模型类型：</td><td>${parameters['模型类型']}</td></tr>`;
            }
            
            // 拟合系数
            if (parameters['拟合系数']) {
                Object.entries(parameters['拟合系数']).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        htmlContent += `<tr><td>${key}：</td><td>${typeof value === 'number' ? value.toFixed(fittingCoefficientDecimalPlaces) : value}</td></tr>`;
                    }
                });
            }
            
            // 其他参数
            if (parameters['平均高程异常'] !== undefined) {
                htmlContent += `<tr><td>平均高程异常：</td><td>${parameters['平均高程异常'].toFixed(5)}m</td></tr>`;
            }
            if (parameters['线路方位角'] !== undefined) {
                htmlContent += `<tr><td>线路方位角：</td><td>${parameters['线路方位角'].toFixed(decimalPlaces)}°</td></tr>`;
            }
            if (parameters['参考点坐标'] !== undefined) {
                const coords = parameters['参考点坐标'];
                // 检查是否包含"纬度 B₀"和"经度 L₀"（新格式）
                if (coords['纬度 B₀'] !== undefined && coords['经度 L₀'] !== undefined) {
                    htmlContent += `<tr><td>参考点坐标：</td><td>纬度 B₀: ${coords['纬度 B₀']?.toFixed(6)}°, 经度 L₀: ${coords['经度 L₀']?.toFixed(6)}°</td></tr>`;
                } else {
                    // 使用旧格式
                    htmlContent += `<tr><td>参考点坐标：</td><td>纬度 ${(coords.纬度 || coords.lat)?.toFixed(6)}°, 经度 ${(coords.经度 || coords.lon)?.toFixed(6)}°</td></tr>`;
                }
            }
            if (parameters['已知点数量'] !== undefined) {
                htmlContent += `<tr><td>已知点数量：</td><td>${parameters['已知点数量']}个</td></tr>`;
            }
            if (parameters['未知点数量'] !== undefined) {
                htmlContent += `<tr><td>未知点数量：</td><td>${parameters['未知点数量']}个</td></tr>`;
            }
            
            htmlContent += '</table>';
        }

        htmlContent += '</body></html>';
        this.downloadFile(htmlContent, `${fileName}.doc`, 'application/msword;charset=utf-8');
    }



    /**
     * 下载文件
     */
    downloadFile(content, fileName, mimeType) {
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
}

// 创建全局导出管理器实例
window.exportManager = new ExportManager();

// 重写原有的导出函数
function exportResults() {
    window.exportManager.showExportDialog();
}

// 关闭模态框函数
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 点击模态框外部关闭
window.addEventListener('click', function(event) {
    const modal = document.getElementById('exportModal');
    if (event.target === modal) {
        closeModal('exportModal');
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal('exportModal');
    }
});