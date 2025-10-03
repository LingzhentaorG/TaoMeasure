/**
 * 曲线测设合并表格功能
 * 将坐标成果表与放样表合并，综合要素显示在底部备注行
 */

// 在curve-design.js中添加的合并表格方法
CurveDesign.prototype.generateCombinedTable = async function() {
    if (!this.stationData || this.stationData.length === 0) {
        this.showNotification('请先生成坐标数据', 'warning');
        return;
    }
    
    try {
        // 获取放样参数
        const stationX = parseFloat(document.getElementById('stationX').value);
        const stationY = parseFloat(document.getElementById('stationY').value);
        const backsightX = parseFloat(document.getElementById('backsightX').value);
        const backsightY = parseFloat(document.getElementById('backsightY').value);
        const leftDist = parseFloat(document.getElementById('leftDistance').value);
        const rightDist = parseFloat(document.getElementById('rightDistance').value);
        
        // 检查设站点和后视点重合
        const stationCoincident = Math.abs(stationX - backsightX) < 0.001 && Math.abs(stationY - backsightY) < 0.001;
        if (stationCoincident) {
            this.showNotification('设站点与后视点重合，放样数据将显示为0', 'warning');
        }
        
        const curveService = new CurveDesignService();
        
        // 计算后视方位角（处理重合情况）
        const backsightAzimuth = stationCoincident ? 0 : curveService.calculateAzimuth(stationX, stationY, backsightX, backsightY);
        
        // 生成合并表格HTML
        const combinedHtml = this.generateCombinedTableHtml(stationX, stationY, backsightAzimuth, leftDist, rightDist, curveService, stationCoincident);
        
        // 更新显示
        const container = document.getElementById('coordinatesTableContainer');
        if (container) {
            container.innerHTML = combinedHtml;
        }
        
        // 更新当前设站信息
        this.updateCurrentLayoutInfo(stationX, stationY, backsightX, backsightY);
        
    } catch (error) {
        console.error('生成合并表格时出错:', error);
        this.showNotification('生成合并表格时出错: ' + error.message, 'error');
    }
};

// 生成合并表格HTML
CurveDesign.prototype.generateCombinedTableHtml = function(stationX, stationY, backsightAzimuth, leftDist, rightDist, curveService, stationCoincident = false) {
    const { T, L, E, alpha, R, Ls } = this.calculatedElements.elements;
    const alphaDms = this.decimalToDms(Math.abs(alpha) * 180 / Math.PI);
    const projectName = document.getElementById('projectName')?.value || '未命名工程';
    
    let html = `
        <div class="combined-table-wrapper">
            <h1>${projectName} - 对称基本型曲线坐标成果与放样表</h1>
            
            <table class="combined-table">
                <thead>
                    <tr>
                        <th rowspan="3">序号</th>
                        <th rowspan="3">点名</th>
                        <th rowspan="3">桩号</th>
                        <th colspan="3" class="coordinate-header">设计坐标</th>
                        <th colspan="9" class="layout-data-header">极坐标放样数据</th>
                        <th rowspan="3">曲线段</th>
                        <th rowspan="3">备注</th>
                    </tr>
                    <tr>
                        <th rowspan="2">X(m)</th>
                        <th rowspan="2">Y(m)</th>
                        <th rowspan="2">切线方位<br>(d.mmss)</th>
                        <th colspan="3">中桩</th>
                        <th colspan="3">左边桩(${leftDist.toFixed(1)}m)</th>
                        <th colspan="3">右边桩(${rightDist.toFixed(1)}m)</th>
                    </tr>
                    <tr>
                        <th>方位角<br>(d.mmss)</th>
                        <th>角度<br>(d.mmss)</th>
                        <th>距离<br>(m)</th>
                        <th>方位角<br>(d.mmss)</th>
                        <th>角度<br>(d.mmss)</th>
                        <th>距离<br>(m)</th>
                        <th>方位角<br>(d.mmss)</th>
                        <th>角度<br>(d.mmss)</th>
                        <th>距离<br>(m)</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // 初始化放样数据数组
    this.layoutData = [];
    
    // 为每个桩号生成数据行
    this.stationData.forEach(data => {
        let layoutData, leftLayoutData, rightLayoutData;
        let leftCoords, rightCoords;
        
        if (stationCoincident) {
            // 点位重合时，所有放样数据为0
            layoutData = { azimuth: 0, horizontalAngle: 0, distance: 0 };
            leftLayoutData = { azimuth: 0, horizontalAngle: 0, distance: 0 };
            rightLayoutData = { azimuth: 0, horizontalAngle: 0, distance: 0 };
            leftCoords = { x: data.x, y: data.y };
            rightCoords = { x: data.x, y: data.y };
        } else {
            // 检查当前点与设站点是否重合
            const pointCoincident = Math.abs(data.x - stationX) < 0.001 && Math.abs(data.y - stationY) < 0.001;
            
            if (pointCoincident) {
                // 当前点与设站点重合，放样数据为0
                layoutData = { azimuth: 0, horizontalAngle: 0, distance: 0 };
                leftLayoutData = { azimuth: 0, horizontalAngle: 0, distance: 0 };
                rightLayoutData = { azimuth: 0, horizontalAngle: 0, distance: 0 };
                leftCoords = { x: data.x, y: data.y };
                rightCoords = { x: data.x, y: data.y };
            } else {
                // 正常计算极坐标放样元素
                layoutData = curveService.calculatePolarLayoutElements(
                    { x: data.x, y: data.y }, 
                    { x: stationX, y: stationY }, 
                    backsightAzimuth
                );
                
                // 计算边桩坐标和放样数据
                leftCoords = curveService.calculateSideStakeCoordinates(
                    { x: data.x, y: data.y, azimuth: data.azimuth }, 
                    leftDist, 
                    true
                );
                rightCoords = curveService.calculateSideStakeCoordinates(
                    { x: data.x, y: data.y, azimuth: data.azimuth }, 
                    rightDist, 
                    false
                );
                
                leftLayoutData = curveService.calculatePolarLayoutElements(
                    leftCoords, 
                    { x: stationX, y: stationY }, 
                    backsightAzimuth
                );
                rightLayoutData = curveService.calculatePolarLayoutElements(
                    rightCoords, 
                    { x: stationX, y: stationY }, 
                    backsightAzimuth
                );
            }
        }
        
        // 格式化放样数据为dd.mmsss格式（与前端显示一致）
        const formatLayoutDataForExport = (layoutData) => {
            if (layoutData.distance === 0) {
                return {
                    azimuth: '0.00000',
                    angle: '0.00000', 
                    distance: '0.000'
                };
            }
            return {
                azimuth: curveService.radiansToDms(layoutData.azimuth),
                angle: curveService.radiansToDms(layoutData.horizontalAngle),
                distance: layoutData.distance.toFixed(3)
            };
        };
        
        const centerLayoutFormatted = formatLayoutDataForExport(layoutData);
        const leftLayoutFormatted = formatLayoutDataForExport(leftLayoutData);
        const rightLayoutFormatted = formatLayoutDataForExport(rightLayoutData);
        
        // 存储放样数据到this.layoutData（包含格式化后的角度数据）
        this.layoutData.push({
            index: data.index,
            pointName: data.pointName,
            station: data.station,
            x: data.x,
            y: data.y,
            azimuth: data.azimuth,
            azimuthFormatted: curveService.radiansToDms(data.azimuth),
            segment: data.segment,
            remark: data.remark,
            centerLayout: layoutData,
            leftLayout: leftLayoutData,
            rightLayout: rightLayoutData,
            centerLayoutFormatted: centerLayoutFormatted,
            leftLayoutFormatted: leftLayoutFormatted,
            rightLayoutFormatted: rightLayoutFormatted,
            leftDistance: leftDist,
            rightDistance: rightDist,
            leftCoords: leftCoords,
            rightCoords: rightCoords
        });
        
        const azimuthDms = this.decimalToDms(data.azimuth * 180 / Math.PI);
        const rowClass = data.remark === '查找点' ? 'highlight-row' : '';
        
        // 格式化放样数据显示
        const formatLayoutData = (layoutData) => {
            if (layoutData.distance === 0) {
                return {
                    azimuth: '0.00000',
                    angle: '0.00000', 
                    distance: '0.000'
                };
            }
            return {
                azimuth: curveService.radiansToDms(layoutData.azimuth),
                angle: curveService.radiansToDms(layoutData.horizontalAngle),
                distance: layoutData.distance.toFixed(3)
            };
        };
        
        const centerLayout = formatLayoutData(layoutData);
        const leftLayout = formatLayoutData(leftLayoutData);
        const rightLayout = formatLayoutData(rightLayoutData);
        
        html += `
            <tr class="${rowClass}">
                <td>${data.index}</td>
                <td class="point-name">${data.pointName}</td>
                <td class="station">${this.formatStation(data.station)}</td>
                <td class="coordinate">${data.x.toFixed(3)}</td>
                <td class="coordinate">${data.y.toFixed(3)}</td>
                <td>${azimuthDms}</td>
                <td>${centerLayout.azimuth}</td>
                <td>${centerLayout.angle}</td>
                <td class="distance">${centerLayout.distance}</td>
                <td>${leftLayout.azimuth}</td>
                <td>${leftLayout.angle}</td>
                <td class="distance">${leftLayout.distance}</td>
                <td>${rightLayout.azimuth}</td>
                <td>${rightLayout.angle}</td>
                <td class="distance">${rightLayout.distance}</td>
                <td>${data.segment}</td>
                <td>${data.remark}</td>
            </tr>
        `;
    });
    
    // 添加综合要素备注行
    html += `
            <!-- 综合要素备注行 -->
            <tr class="elements-remarks">
                <td colspan="17">
                    <div class="elements-summary">
                        <strong>曲线综合要素:</strong><br>
                        α = ${alphaDms} &nbsp;&nbsp;&nbsp; 
                        Ls = ${Ls.toFixed(3)}m &nbsp;&nbsp;&nbsp; 
                        R = ${R.toFixed(3)}m &nbsp;&nbsp;&nbsp; 
                        T = ${T.toFixed(3)}m &nbsp;&nbsp;&nbsp;
                        L = ${L.toFixed(3)}m &nbsp;&nbsp;&nbsp; 
                        E = ${E.toFixed(3)}m &nbsp;&nbsp;&nbsp;
                        D = ${(2*T-L).toFixed(3)}m<br>
                        <strong>设站信息:</strong> 
                        设站点(${stationX.toFixed(3)}, ${stationY.toFixed(3)}) &nbsp;&nbsp;&nbsp;
                        后视点(${document.getElementById('backsightX').value}, ${document.getElementById('backsightY').value}) &nbsp;&nbsp;&nbsp;
                        <strong>计算:</strong> __________ &nbsp;&nbsp;&nbsp;
                        <strong>复核:</strong> __________ &nbsp;&nbsp;&nbsp;
                        <strong>日期:</strong> ${new Date().toLocaleDateString()}
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
    </div>
    `;
    
    return html;
};

// 更新总点数显示
CurveDesign.prototype.updateTotalPoints = function() {
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl && this.stationData) {
        totalPointsEl.textContent = this.stationData.length;
    }
};