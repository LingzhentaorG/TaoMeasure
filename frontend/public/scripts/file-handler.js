/**
 * 文件处理器类 - 处理各种格式的坐标数据文件导入导出
 */
class FileHandler {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:5000/api';
        this.supportedFormats = ['.txt', '.csv', '.dat'];
        this.initFileUploadModal();
    }

    /**
     * 初始化文件上传模态框
     */
    initFileUploadModal() {
        if (document.getElementById('fileUploadModal')) {
            return;
        }

        const modalHTML = `
            <div class="modal" id="fileUploadModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>文件导入</h3>
                        <span class="close" onclick="this.closeModal('fileUploadModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="upload-section">
                            <h4>选择文件类型</h4>
                            <div class="file-type-grid">
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="geodetic_to_cartesian">
                                    <span class="type-label">
                                        <i class="fas fa-globe"></i>
                                        <strong>大地坐标转空间直角坐标</strong>
                                        <small>格式：点名 纬度 经度 大地高</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="cartesian_to_geodetic">
                                    <span class="type-label">
                                        <i class="fas fa-cube"></i>
                                        <strong>空间直角坐标转大地坐标</strong>
                                        <small>格式：点名 X Y Z</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="gauss_forward">
                                    <span class="type-label">
                                        <i class="fas fa-arrow-right"></i>
                                        <strong>高斯投影正算</strong>
                                        <small>格式：点名 纬度 经度</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="gauss_inverse">
                                    <span class="type-label">
                                        <i class="fas fa-arrow-left"></i>
                                        <strong>高斯投影反算</strong>
                                        <small>格式：点名 X Y</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="four_param_control">
                                    <span class="type-label">
                                        <i class="fas fa-exchange-alt"></i>
                                        <strong>四参数控制点</strong>
                                        <small>格式：点号 源X 源Y 目标X 目标Y</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="four_param_unknown">
                                    <span class="type-label">
                                        <i class="fas fa-question"></i>
                                        <strong>四参数未知点</strong>
                                        <small>格式：点号 X Y</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="seven_param_control">
                                    <span class="type-label">
                                        <i class="fas fa-exchange-alt"></i>
                                        <strong>七参数控制点</strong>
                                        <small>格式：点号 源X 源Y 源Z 目标X 目标Y 目标Z</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="seven_param_unknown">
                                    <span class="type-label">
                                        <i class="fas fa-question"></i>
                                        <strong>七参数未知点</strong>
                                        <small>格式：点号 X Y Z</small>
                                    </span>
                                </label>
                                <label class="file-type-option">
                                    <input type="radio" name="fileType" value="zone_transform">
                                    <span class="type-label">
                                        <i class="fas fa-map"></i>
                                        <strong>换带变换</strong>
                                        <small>格式：点名 X Y 或 点名,X,Y,H</small>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="upload-section">
                            <h4>上传文件</h4>
                            <div class="file-upload-area" id="fileUploadArea">
                                <div class="upload-placeholder">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>拖拽文件到此处或点击选择文件</p>
                                    <p class="file-hint">支持 .txt, .csv, .dat 格式</p>
                                </div>
                                <input type="file" id="fileInput" accept=".txt,.csv,.dat" style="display: none;">
                            </div>
                            <div class="file-info" id="fileInfo" style="display: none;">
                                <div class="file-details">
                                    <span class="file-name"></span>
                                    <span class="file-size"></span>
                                </div>
                                <div class="file-preview" id="filePreview"></div>
                            </div>
                        </div>

                        <div class="upload-section" id="parametersSection" style="display: none;">
                            <h4>转换参数</h4>
                            <div class="param-grid" id="paramGrid">
                                <!-- 动态生成参数输入框 -->
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="tool-btn" onclick="this.closeModal('fileUploadModal')">取消</button>
                        <button class="tool-btn primary" id="processFileBtn" onclick="fileHandler.processFile()" disabled>处理文件</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.initFileUploadEvents();
    }

    /**
     * 初始化文件上传事件
     */
    initFileUploadEvents() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('fileUploadArea');
        const processBtn = document.getElementById('processFileBtn');

        // 文件选择
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFileSelect(e.dataTransfer.files[0]);
        });

        // 文件类型选择
        document.querySelectorAll('input[name="fileType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateParametersSection();
                this.validateForm();
            });
        });
    }

    /**
     * 处理文件选择
     */
    async handleFileSelect(file) {
        if (!file) return;

        // 验证文件类型
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            this.showMessage('不支持的文件格式，请选择 .txt, .csv 或 .dat 文件', 'error');
            return;
        }

        // 读取文件内容
        try {
            const content = await this.readFileContent(file);
            this.currentFileContent = content;
            this.currentFileName = file.name;

            // 显示文件信息
            this.displayFileInfo(file, content);
            this.validateForm();

        } catch (error) {
            console.error('读取文件失败:', error);
            this.showMessage('读取文件失败：' + error.message, 'error');
        }
    }

    /**
     * 读取文件内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    /**
     * 显示文件信息
     */
    async displayFileInfo(file, content) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = fileInfo.querySelector('.file-name');
        const fileSize = fileInfo.querySelector('.file-size');
        const filePreview = document.getElementById('filePreview');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        // 获取文件信息
        try {
            const response = await fetch(`${this.apiUrl}/file/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            const result = await response.json();
            if (result.success) {
                const info = result.data;
                filePreview.innerHTML = `
                    <div class="file-stats">
                        <span>总行数: ${info.total_lines}</span>
                        <span>有效行数: ${info.valid_lines}</span>
                        <span>检测格式: ${info.detected_format}</span>
                    </div>
                    <div class="file-sample">
                        <strong>示例行:</strong>
                        <code>${info.sample_line}</code>
                    </div>
                `;
            }
        } catch (error) {
            console.error('获取文件信息失败:', error);
        }

        fileInfo.style.display = 'block';
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 更新参数设置区域
     */
    updateParametersSection() {
        const selectedType = document.querySelector('input[name="fileType"]:checked')?.value;
        const parametersSection = document.getElementById('parametersSection');
        const paramGrid = document.getElementById('paramGrid');

        if (!selectedType) {
            parametersSection.style.display = 'none';
            return;
        }

        let paramHTML = '';

        if (selectedType.includes('gauss')) {
            paramHTML = `
                <div class="param-row">
                    <label>中央子午线(°):</label>
                    <input type="number" id="centralMeridian" value="0" step="0.000001">
                </div>
                <div class="param-row">
                    <label>投影面大地高(m):</label>
                    <input type="number" id="projectionHeight" value="0" step="0.001">
                </div>
                <div class="param-row">
                    <label><input type="checkbox" id="add500km" checked> 加500km</label>
                </div>
                <div class="param-row">
                    <label>椭球参数:</label>
                    <select id="ellipsoid">
                        <option value="WGS84">WGS84</option>
                        <option value="CGCS2000">CGCS2000</option>
                        <option value="Beijing54">Beijing54</option>
                        <option value="Xian80">Xian80</option>
                    </select>
                </div>
            `;
        } else if (selectedType.includes('cartesian') || selectedType.includes('geodetic')) {
            paramHTML = `
                <div class="param-row">
                    <label>椭球参数:</label>
                    <select id="ellipsoid">
                        <option value="WGS84">WGS84</option>
                        <option value="CGCS2000">CGCS2000</option>
                        <option value="Beijing54">Beijing54</option>
                        <option value="Xian80">Xian80</option>
                    </select>
                </div>
            `;
        } else if (selectedType.includes('zone_transform')) {
            paramHTML = `
                <div class="param-row">
                    <label>源带号:</label>
                    <input type="number" id="sourceZone" value="38" min="1" max="60">
                </div>
                <div class="param-row">
                    <label>目标带号:</label>
                    <input type="number" id="targetZone" value="19" min="1" max="30">
                </div>
                <div class="param-row">
                    <label>带型:</label>
                    <select id="zoneType">
                        <option value="3_to_6">3度带转6度带</option>
                        <option value="6_to_3">6度带转3度带</option>
                    </select>
                </div>
            `;
        }

        if (paramHTML) {
            paramGrid.innerHTML = paramHTML;
            parametersSection.style.display = 'block';
        } else {
            parametersSection.style.display = 'none';
        }
    }

    /**
     * 验证表单
     */
    validateForm() {
        const fileType = document.querySelector('input[name="fileType"]:checked');
        const hasFile = this.currentFileContent;
        const processBtn = document.getElementById('processFileBtn');

        processBtn.disabled = !(fileType && hasFile);
    }

    /**
     * 处理文件
     */
    async processFile() {
        const selectedType = document.querySelector('input[name="fileType"]:checked')?.value;
        if (!selectedType || !this.currentFileContent) {
            this.showMessage('请选择文件类型并上传文件', 'error');
            return;
        }

        try {
            // 显示加载状态
            const processBtn = document.getElementById('processFileBtn');
            const originalText = processBtn.textContent;
            processBtn.textContent = '处理中...';
            processBtn.disabled = true;

            // 解析文件
            const parseResponse = await fetch(`${this.apiUrl}/file/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: this.currentFileContent,
                    type: selectedType
                })
            });

            const parseResult = await parseResponse.json();
            if (!parseResult.success) {
                throw new Error(parseResult.error);
            }

            // 获取转换参数
            const params = this.getConversionParameters(selectedType);

            // 执行批量转换
            const conversionResult = await this.performBatchConversion(selectedType, parseResult.data.points, params);

            // 显示结果
            this.displayResults(conversionResult, selectedType);

            // 关闭模态框
            this.closeModal('fileUploadModal');

            this.showMessage(`成功处理 ${parseResult.data.count} 个点的数据`, 'success');

        } catch (error) {
            console.error('处理文件失败:', error);
            this.showMessage('处理文件失败：' + error.message, 'error');
        } finally {
            // 恢复按钮状态
            const processBtn = document.getElementById('processFileBtn');
            processBtn.textContent = originalText;
            processBtn.disabled = false;
        }
    }

    /**
     * 获取转换参数
     */
    getConversionParameters(fileType) {
        const params = {};

        if (fileType.includes('gauss')) {
            params.central_meridian = parseFloat(document.getElementById('centralMeridian')?.value || 0);
            params.projection_height = parseFloat(document.getElementById('projectionHeight')?.value || 0);
            params.add_500km = document.getElementById('add500km')?.checked || true;
            params.ellipsoid = document.getElementById('ellipsoid')?.value || 'WGS84';
        } else if (fileType.includes('cartesian') || fileType.includes('geodetic')) {
            params.ellipsoid = document.getElementById('ellipsoid')?.value || 'WGS84';
        } else if (fileType.includes('zone_transform')) {
            params.source_zone = parseInt(document.getElementById('sourceZone')?.value || 38);
            params.target_zone = parseInt(document.getElementById('targetZone')?.value || 19);
            params.zone_type = document.getElementById('zoneType')?.value || '3_to_6';
        }

        return params;
    }

    /**
     * 执行批量转换
     */
    async performBatchConversion(fileType, points, params) {
        let apiEndpoint = '';
        let requestData = { points, ...params };

        switch (fileType) {
            case 'geodetic_to_cartesian':
                apiEndpoint = '/coordinate/batch/geodetic-to-cartesian';
                break;
            case 'cartesian_to_geodetic':
                apiEndpoint = '/coordinate/batch/cartesian-to-geodetic';
                break;
            case 'gauss_forward':
                apiEndpoint = '/coordinate/batch/gauss-forward';
                break;
            case 'gauss_inverse':
                apiEndpoint = '/coordinate/batch/gauss-inverse';
                break;
            case 'four_param_control':
            case 'four_param_unknown':
                apiEndpoint = '/four-parameter-transform';
                requestData = {
                    control_points: fileType === 'four_param_control' ? points : [],
                    unknown_points: fileType === 'four_param_unknown' ? points : []
                };
                break;
            case 'seven_param_control':
            case 'seven_param_unknown':
                apiEndpoint = '/seven-parameter-transform';
                requestData = {
                    control_points: fileType === 'seven_param_control' ? points : [],
                    unknown_points: fileType === 'seven_param_unknown' ? points : []
                };
                break;
            case 'zone_transform':
                apiEndpoint = '/zone-transform';
                break;
            default:
                throw new Error('不支持的转换类型');
        }

        const response = await fetch(`${this.apiUrl}${apiEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    }

    /**
     * 显示结果
     */
    displayResults(results, fileType) {
        // 根据文件类型显示相应的结果表格
        const resultContainer = document.getElementById('results-container');
        if (!resultContainer) return;

        let tableHTML = '';

        if (fileType === 'geodetic_to_cartesian') {
            tableHTML = this.generateCartesianResultTable(results.results);
        } else if (fileType === 'cartesian_to_geodetic') {
            tableHTML = this.generateGeodeticResultTable(results.results);
        } else if (fileType.includes('gauss')) {
            tableHTML = this.generateGaussResultTable(results.results, fileType);
        }

        resultContainer.innerHTML = `
            <div class="result-section">
                <h3>批量转换结果</h3>
                <div class="result-stats">
                    <span>处理点数: ${results.count}</span>
                    <span>椭球参数: ${results.ellipsoid || 'N/A'}</span>
                </div>
                ${tableHTML}
                <div class="result-actions">
                    <button class="tool-btn" onclick="fileHandler.exportBatchResults('${fileType}')">
                        <i class="fas fa-download"></i> 导出结果
                    </button>
                </div>
            </div>
        `;

        // 保存结果用于导出
        this.lastBatchResults = { results: results.results, type: fileType };
    }

    /**
     * 生成空间直角坐标结果表格
     */
    generateCartesianResultTable(results) {
        let tableHTML = `
            <table class="result-table">
                <thead>
                    <tr>
                        <th>点名</th>
                        <th>纬度(°)</th>
                        <th>经度(°)</th>
                        <th>大地高(m)</th>
                        <th>X(m)</th>
                        <th>Y(m)</th>
                        <th>Z(m)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        results.forEach(result => {
            if (result.error) {
                tableHTML += `
                    <tr class="error-row">
                        <td>${result.name}</td>
                        <td colspan="6" class="error-cell">${result.error}</td>
                    </tr>
                `;
            } else {
                tableHTML += `
                    <tr>
                        <td>${result.name}</td>
                        <td>${result.lat.toFixed(8)}</td>
                        <td>${result.lon.toFixed(8)}</td>
                        <td>${result.height.toFixed(3)}</td>
                        <td>${result.x.toFixed(3)}</td>
                        <td>${result.y.toFixed(3)}</td>
                        <td>${result.z.toFixed(3)}</td>
                    </tr>
                `;
            }
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    /**
     * 生成大地坐标结果表格
     */
    generateGeodeticResultTable(results) {
        let tableHTML = `
            <table class="result-table">
                <thead>
                    <tr>
                        <th>点名</th>
                        <th>X(m)</th>
                        <th>Y(m)</th>
                        <th>Z(m)</th>
                        <th>纬度(°)</th>
                        <th>经度(°)</th>
                        <th>大地高(m)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        results.forEach(result => {
            if (result.error) {
                tableHTML += `
                    <tr class="error-row">
                        <td>${result.name}</td>
                        <td colspan="6" class="error-cell">${result.error}</td>
                    </tr>
                `;
            } else {
                tableHTML += `
                    <tr>
                        <td>${result.name}</td>
                        <td>${result.x.toFixed(3)}</td>
                        <td>${result.y.toFixed(3)}</td>
                        <td>${result.z.toFixed(3)}</td>
                        <td>${result.lat.toFixed(8)}</td>
                        <td>${result.lon.toFixed(8)}</td>
                        <td>${result.height.toFixed(3)}</td>
                    </tr>
                `;
            }
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    /**
     * 生成高斯投影结果表格
     */
    generateGaussResultTable(results, fileType) {
        let tableHTML = '';

        if (fileType === 'gauss_forward') {
            tableHTML = `
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>点名</th>
                            <th>纬度(°)</th>
                            <th>经度(°)</th>
                            <th>X(m)</th>
                            <th>Y(m)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            results.forEach(result => {
                if (result.error) {
                    tableHTML += `
                        <tr class="error-row">
                            <td>${result.name}</td>
                            <td colspan="4" class="error-cell">${result.error}</td>
                        </tr>
                    `;
                } else {
                    tableHTML += `
                        <tr>
                            <td>${result.name}</td>
                            <td>${result.lat.toFixed(8)}</td>
                            <td>${result.lon.toFixed(8)}</td>
                            <td>${result.x.toFixed(3)}</td>
                            <td>${result.y.toFixed(3)}</td>
                        </tr>
                    `;
                }
            });
        } else {
            tableHTML = `
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>点名</th>
                            <th>X(m)</th>
                            <th>Y(m)</th>
                            <th>纬度(°)</th>
                            <th>经度(°)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            results.forEach(result => {
                if (result.error) {
                    tableHTML += `
                        <tr class="error-row">
                            <td>${result.name}</td>
                            <td colspan="4" class="error-cell">${result.error}</td>
                        </tr>
                    `;
                } else {
                    tableHTML += `
                        <tr>
                            <td>${result.name}</td>
                            <td>${result.x.toFixed(3)}</td>
                            <td>${result.y.toFixed(3)}</td>
                            <td>${result.lat.toFixed(8)}</td>
                            <td>${result.lon.toFixed(8)}</td>
                        </tr>
                    `;
                }
            });
        }

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    /**
     * 导出批量结果
     */
    async exportBatchResults(fileType) {
        if (!this.lastBatchResults) {
            this.showMessage('没有可导出的结果', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/export/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    results: [this.lastBatchResults.results],
                    format: 'txt',
                    type: fileType
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }

            // 下载文件
            const blob = new Blob([result.data.content], { type: result.data.content_type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showMessage('结果导出成功', 'success');

        } catch (error) {
            console.error('导出失败:', error);
            this.showMessage('导出失败：' + error.message, 'error');
        }
    }

    /**
     * 显示文件上传对话框
     */
    showFileUploadDialog() {
        document.getElementById('fileUploadModal').style.display = 'block';
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 显示消息 - 使用统一通知系统
     */
    showMessage(message, type = 'info') {
        if (window.notificationSystem) {
            window.notificationSystem.show(message, type);
        } else if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    // 静态方法保持向后兼容
    static parseAndFillKnownPoints(data) {
        console.log('Parsing and filling known points:', data);
        // 移除重复调用，避免弹窗重复
        // window.fileHandler.showFileUploadDialog();
    }

    static parseAndFillUnknownPoints(data) {
        console.log('Parsing and filling unknown points:', data);
        // 实际的数据解析和填充逻辑应该在这里
        // 不再调用弹窗，避免重复
    }

    static exportResultsToFile() {
        console.log('Exporting results to file...');
        if (window.exportManager) {
            window.exportManager.showExportDialog();
        }
    }
}

// 创建全局文件处理器实例
window.fileHandler = new FileHandler();