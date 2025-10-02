/**
 * 坐标转换表格生成模块
 * 为不同的坐标转换功能生成专用表格
 */

/**
 * 生成高斯投影正算表格
 */
function generateGaussForwardTable() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="2" class="input-section">大地坐标</th>
                    <th colspan="2" class="output-section">高斯平面坐标</th>
                </tr>
                <tr>
                    <th class="input-field">纬度(°′″)</th>
                    <th class="input-field">经度(°′″)</th>
                    <th class="output-field">x(m)</th>
                    <th class="output-field">y(m)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="纬度" class="input-lat"></td>
                    <td><input type="text" placeholder="经度" class="input-lon"></td>
                    <td class="output-field"><span class="result-x">-</span></td>
                    <td class="output-field"><span class="result-y">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}

/**
 * 生成高斯投影反算表格
 */
function generateGaussInverseTable() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="2" class="input-section">高斯平面坐标</th>
                    <th colspan="2" class="output-section">大地坐标</th>
                </tr>
                <tr>
                    <th class="input-field">x(m)</th>
                    <th class="input-field">y(m)</th>
                    <th class="output-field">纬度(°′″)</th>
                    <th class="output-field">经度(°′″)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="x坐标" class="input-x"></td>
                    <td><input type="text" placeholder="y坐标" class="input-y"></td>
                    <td class="output-field"><span class="result-lat">-</span></td>
                    <td class="output-field"><span class="result-lon">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}

/**
 * 生成空间直角坐标转大地坐标表格
 */
function generateXyzToBlhTable() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="3" class="input-section">空间直角坐标</th>
                    <th colspan="3" class="output-section">大地坐标</th>
                </tr>
                <tr>
                    <th class="input-field">X(m)</th>
                    <th class="input-field">Y(m)</th>
                    <th class="input-field">Z(m)</th>
                    <th class="output-field">纬度(°′″)</th>
                    <th class="output-field">经度(°′″)</th>
                    <th class="output-field">大地高(m)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="X坐标" class="input-X"></td>
                    <td><input type="text" placeholder="Y坐标" class="input-Y"></td>
                    <td><input type="text" placeholder="Z坐标" class="input-Z"></td>
                    <td class="output-field"><span class="result-lat">-</span></td>
                    <td class="output-field"><span class="result-lon">-</span></td>
                    <td class="output-field"><span class="result-height">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}

/**
 * 生成大地坐标转空间直角坐标表格
 */
function generateBlhToXyzTable() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="3" class="input-section">大地坐标</th>
                    <th colspan="3" class="output-section">空间直角坐标</th>
                </tr>
                <tr>
                    <th class="input-field">纬度(°′″)</th>
                    <th class="input-field">经度(°′″)</th>
                    <th class="input-field">大地高(m)</th>
                    <th class="output-field">X(m)</th>
                    <th class="output-field">Y(m)</th>
                    <th class="output-field">Z(m)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="纬度" class="input-lat"></td>
                    <td><input type="text" placeholder="经度" class="input-lon"></td>
                    <td><input type="text" placeholder="大地高" class="input-height"></td>
                    <td class="output-field"><span class="result-X">-</span></td>
                    <td class="output-field"><span class="result-Y">-</span></td>
                    <td class="output-field"><span class="result-Z">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}

/**
 * 生成换带与投影面变换1表格
 */
function generateZoneTransform1Table() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="2" class="input-section">换带前</th>
                    <th colspan="2" class="output-section">换带后</th>
                </tr>
                <tr>
                    <th class="input-field">x(m)</th>
                    <th class="input-field">y(m)</th>
                    <th class="output-field">x(m)</th>
                    <th class="output-field">y(m)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="x坐标" class="input-x"></td>
                    <td><input type="text" placeholder="y坐标" class="input-y"></td>
                    <td class="output-field"><span class="result-x">-</span></td>
                    <td class="output-field"><span class="result-y">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}

/**
 * 生成换带与投影面变换2表格
 */
function generateZoneTransform2Table() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="3" class="input-section">换带前</th>
                    <th colspan="3" class="output-section">换带后</th>
                </tr>
                <tr>
                    <th class="input-field">x(m)</th>
                    <th class="input-field">y(m)</th>
                    <th class="input-field">大地高(m)</th>
                    <th class="output-field">x(m)</th>
                    <th class="output-field">y(m)</th>
                    <th class="output-field">大地高(m)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="x坐标" class="input-x"></td>
                    <td><input type="text" placeholder="y坐标" class="input-y"></td>
                    <td><input type="text" placeholder="大地高" class="input-height"></td>
                    <td class="output-field"><span class="result-x">-</span></td>
                    <td class="output-field"><span class="result-y">-</span></td>
                    <td class="output-field"><span class="result-height">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}

/**
 * 生成四参数坐标转换正算表格
 */
function generateFourParamForwardTable() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="2" class="input-section">转换前坐标</th>
                    <th colspan="2" class="output-section">转换后坐标</th>
                </tr>
                <tr>
                    <th class="input-field">X(m)</th>
                    <th class="input-field">Y(m)</th>
                    <th class="output-field">X(m)</th>
                    <th class="output-field">Y(m)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="X坐标" class="input-X"></td>
                    <td><input type="text" placeholder="Y坐标" class="input-Y"></td>
                    <td class="output-field"><span class="result-X">-</span></td>
                    <td class="output-field"><span class="result-Y">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}

// 四参数转换反算表格已删除

/**
 * 生成七参数坐标转换表格
 */
function generateSevenParamTable() {
    return `
        <div class="coordinate-form-header">
            <div class="form-row">
                <label>工程名称：</label>
                <input type="text" id="projectName" placeholder="可填">
                <span class="ml-200">第 <span id="currentPage">1</span> 页 共 <span id="totalPages">1</span> 页</span>
            </div>
        </div>
        
        <table class="coordinate-table" id="coordinateDataTable">
            <thead>
                <tr>
                    <th rowspan="2" class="point-name-col">点名</th>
                    <th colspan="3" class="input-section">转换前坐标</th>
                    <th colspan="3" class="output-section">转换后坐标</th>
                </tr>
                <tr>
                    <th class="input-field">X(m)</th>
                    <th class="input-field">Y(m)</th>
                    <th class="input-field">Z(m)</th>
                    <th class="output-field">X(m)</th>
                    <th class="output-field">Y(m)</th>
                    <th class="output-field">Z(m)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input type="text" placeholder="点名" class="point-name"></td>
                    <td><input type="text" placeholder="X坐标" class="input-X"></td>
                    <td><input type="text" placeholder="Y坐标" class="input-Y"></td>
                    <td><input type="text" placeholder="Z坐标" class="input-Z"></td>
                    <td class="output-field"><span class="result-X">-</span></td>
                    <td class="output-field"><span class="result-Y">-</span></td>
                    <td class="output-field"><span class="result-Z">-</span></td>
                </tr>
            </tbody>
        </table>
        
        <div class="coordinate-form-footer">
            <div class="form-row">
                <label>计算：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">复核：</label>
                <input type="text" placeholder="可填">
                <label class="ml-100">日期：</label>
                <input type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
}