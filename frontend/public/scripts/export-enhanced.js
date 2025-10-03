/**
 * 增强的导出功能模块
 * 支持多种格式：TXT、DAT、Excel、Word、DXF
 */

class ExportManager {
    constructor() {
        this.supportedFormats = ['txt', 'dat', 'csv', 'excel', 'word', 'dxf'];
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
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="dxf">
                                    <span class="format-label">
                                        <i class="fas fa-drafting-compass"></i>
                                        <strong>DXF图形</strong>
                                        <small>AutoCAD交换格式</small>
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
                                        <option value="3" selected>3位</option>
                                        <option value="4">4位</option>
                                        <option value="5">5位</option>
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
                    this.exportToTxt(finalFileName, contentOptions, decimalPlaces);
                    break;
                case 'dat':
                    this.exportToDat(finalFileName, contentOptions, decimalPlaces);
                    break;
                case 'csv':
                    this.exportToCsv(finalFileName, contentOptions, decimalPlaces);
                    break;
                case 'excel':
                    this.exportToExcel(finalFileName, contentOptions, decimalPlaces);
                    break;
                case 'word':
                    this.exportToWord(finalFileName, contentOptions, decimalPlaces);
                    break;
                case 'dxf':
                    this.exportToDxf(finalFileName, contentOptions, decimalPlaces);
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
    exportToTxt(fileName, contentOptions, decimalPlaces) {
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
                          `${point.H.toFixed(decimalPlaces).padEnd(12)}${point.anomaly.toFixed(decimalPlaces).padEnd(12)}` +
                          `${normalHeight.toFixed(decimalPlaces).padEnd(12)}${(point.remark || '').padEnd(10)}\n`;
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
                          `${result.H.toFixed(decimalPlaces).padEnd(12)}${result.calculated_anomaly.toFixed(decimalPlaces).padEnd(15)}` +
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
            Object.entries(data.calculationResults.parameters).forEach(([key, value]) => {
                content += `${key}: ${typeof value === 'number' ? value.toFixed(decimalPlaces) : value}\n`;
            });
            content += '\n';
        }

        this.downloadFile(content, `${fileName}.txt`, 'text/plain;charset=utf-8');
    }

    /**
     * 导出为DAT格式
     */
    exportToDat(fileName, contentOptions, decimalPlaces) {
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
                          `${point.H.toFixed(decimalPlaces)},${point.anomaly.toFixed(decimalPlaces)},` +
                          `${normalHeight.toFixed(decimalPlaces)},KNOWN\n`;
            });
        }

        // 未知点结果
        if (contentOptions.unknownPoints && data.calculationResults.data) {
            content += `# 未知点计算结果\n`;
            data.calculationResults.data.forEach(result => {
                content += `${result.name},${result.lat.toFixed(6)},${result.lon.toFixed(6)},` +
                          `${result.H.toFixed(decimalPlaces)},${result.calculated_anomaly.toFixed(decimalPlaces)},` +
                          `${result.normal_height.toFixed(decimalPlaces)},UNKNOWN\n`;
            });
        }

        this.downloadFile(content, `${fileName}.dat`, 'text/plain;charset=utf-8');
    }

    /**
     * 导出为CSV格式
     */
    exportToCsv(fileName, contentOptions, decimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces);
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
                    point.anomaly.toFixed(decimalPlaces),
                    normalHeight.toFixed(decimalPlaces),
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
                    result.calculated_anomaly.toFixed(decimalPlaces),
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
    exportToExcel(fileName, contentOptions, decimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces);
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
                        <td>${point.anomaly.toFixed(decimalPlaces)}</td>
                        <td>${normalHeight.toFixed(decimalPlaces)}</td>
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
                        <td>${result.calculated_anomaly.toFixed(decimalPlaces)}</td>
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
    exportToWord(fileName, contentOptions, decimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces);
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
                        <td>${point.anomaly.toFixed(decimalPlaces)}</td>
                        <td>${normalHeight.toFixed(decimalPlaces)}</td>
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
                        <td>${result.calculated_anomaly.toFixed(decimalPlaces)}</td>
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

        htmlContent += '</body></html>';
        this.downloadFile(htmlContent, `${fileName}.doc`, 'application/msword;charset=utf-8');
    }

    /**
     * 导出为DXF格式
     */
    exportToDxf(fileName, contentOptions, decimalPlaces) {
        const data = this.collectExportData(contentOptions, decimalPlaces);
        
        // DXF文件头部
        let dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
GPS_KNOWN
70
0
62
1
6
CONTINUOUS
0
LAYER
2
GPS_UNKNOWN
70
0
62
2
6
CONTINUOUS
0
LAYER
2
TEXT
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

        // 添加已知点
        if (contentOptions.knownPoints && data.knownPoints.length > 0) {
            data.knownPoints.forEach(point => {
                // 转换经纬度为近似的平面坐标（简化处理）
                const x = point.lon * 111000; // 近似转换
                const y = point.lat * 111000;
                
                // 添加点
                dxfContent += `0
POINT
8
GPS_KNOWN
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
${point.H.toFixed(decimalPlaces)}
`;
                
                // 添加点名标注
                dxfContent += `0
TEXT
8
TEXT
10
${(x + 100).toFixed(3)}
20
${(y + 100).toFixed(3)}
30
${point.H.toFixed(decimalPlaces)}
40
200
1
${point.name}
`;
            });
        }

        // 添加未知点
        if (contentOptions.unknownPoints && data.calculationResults.data) {
            data.calculationResults.data.forEach(result => {
                const x = result.lon * 111000;
                const y = result.lat * 111000;
                
                // 添加点
                dxfContent += `0
POINT
8
GPS_UNKNOWN
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
${result.H.toFixed(decimalPlaces)}
`;
                
                // 添加点名标注
                dxfContent += `0
TEXT
8
TEXT
10
${(x + 100).toFixed(3)}
20
${(y + 100).toFixed(3)}
30
${result.H.toFixed(decimalPlaces)}
40
200
1
${result.name}
`;
            });
        }

        // DXF文件尾部
        dxfContent += `0
ENDSEC
0
EOF
`;

        this.downloadFile(dxfContent, `${fileName}.dxf`, 'application/dxf');
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