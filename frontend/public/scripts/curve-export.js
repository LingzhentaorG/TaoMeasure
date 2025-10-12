/**
 * 曲线测设导出功能
 * 支持导出Excel、DXF等格式
 */

class CurveExportService {
    constructor() {
        const resolvedBase = window.__TAOMEASURE_RESOLVED_API__
            || (typeof window.__resolveTaoMeasureApiBase === 'function'
                ? window.__resolveTaoMeasureApiBase()
                : 'http://127.0.0.1:5000');
        const normalizedBase = (resolvedBase || '').replace(/\/+$/, '');
        this.apiPrefix = window.__TAOMEASURE_API_PREFIX__ || `${normalizedBase}/api`;
        this.init();
    }
    
    init() {
        this.bindExportEvents();
    }
    
    bindExportEvents() {
        // 导出综合要素
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportElementsBtn') {
                this.exportElements();
            }
        });
        
        // 导出坐标成果
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportCoordinatesBtn') {
                this.exportCoordinates();
            }
        });
        
        // 导出放样表
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportLayoutBtn') {
                this.exportLayoutTable();
            }
        });
        
        // 导出DXF
        document.addEventListener('click', (e) => {
            if (e.target.id === 'curveDxfBtn') {
                this.exportDxf();
            }
        });
        
        // 预览打印
        document.addEventListener('click', (e) => {
            if (e.target.id === 'previewLayoutBtn') {
                this.previewPrint();
            }
        });
    }
    
    /**
     * 导出综合要素
     */
    exportElements() {
        if (!window.curveDesign || !window.curveDesign.calculatedElements) {
            this.showNotification('请先计算综合要素', 'warning');
            return;
        }
        
        try {
            const elements = window.curveDesign.calculatedElements.elements;
            const mainPoints = window.curveDesign.mainPoints;
            
            // 创建CSV内容
            let csvContent = '曲线综合要素计算成果\n\n';
            csvContent += '项目,数值,单位\n';
            csvContent += `切线长T,${elements.T.toFixed(4)},m\n`;
            csvContent += `总曲线长L,${elements.L.toFixed(4)},m\n`;
            csvContent += `圆曲线长Ly,${elements.Ly.toFixed(4)},m\n`;
            csvContent += `外矢距E,${elements.E.toFixed(4)},m\n`;
            csvContent += `切曲差D,${elements.D.toFixed(4)},m\n`;
            csvContent += `缓和曲线总偏角β₀,${(elements.beta0 * 180 / Math.PI).toFixed(6)},度\n`;
            csvContent += `内移值p,${elements.p.toFixed(4)},m\n`;
            csvContent += `切线增量q,${elements.q.toFixed(4)},m\n\n`;
            
            csvContent += '主点桩号及坐标\n';
            csvContent += '点名,桩号,X坐标(m),Y坐标(m),切线方位(度)\n';
            
            Object.values(mainPoints).forEach(point => {
                if (point.coordinates) {
                    const azimuthDeg = point.coordinates.azimuth * 180 / Math.PI;
                    csvContent += `${point.name},${window.curveDesign.formatStation(point.station)},${point.coordinates.x.toFixed(3)},${point.coordinates.y.toFixed(3)},${azimuthDeg.toFixed(6)}\n`;
                }
            });
            
            // 下载文件
            this.downloadFile(csvContent, '曲线综合要素.csv', 'text/csv;charset=utf-8;');
            this.showNotification('综合要素导出成功', 'success');
            
        } catch (error) {
            console.error('导出综合要素时出错:', error);
            this.showNotification('导出综合要素时出错: ' + error.message, 'error');
        }
    }
    
    /**
     * 导出坐标成果
     */
    exportCoordinates() {
        if (!window.curveDesign || !window.curveDesign.stationData || window.curveDesign.stationData.length === 0) {
            this.showNotification('请先生成坐标数据', 'warning');
            return;
        }
        
        try {
            const stationData = window.curveDesign.stationData;
            const projectName = document.getElementById('projectName')?.value || '道路曲线工程';
            
            // 创建CSV内容
            let csvContent = `${projectName} - 曲线坐标成果表\n\n`;
            csvContent += '序号,点名,桩号,X坐标(m),Y坐标(m),切线方位(度),曲线段,备注\n';
            
            stationData.forEach(data => {
                const azimuthDeg = data.azimuth * 180 / Math.PI;
                csvContent += `${data.index},${data.pointName},${window.curveDesign.formatStation(data.station)},${data.x.toFixed(3)},${data.y.toFixed(3)},${azimuthDeg.toFixed(6)},${data.segment},${data.remark}\n`;
            });
            
            // 下载文件
            this.downloadFile(csvContent, `${projectName}_坐标成果.csv`, 'text/csv;charset=utf-8;');
            this.showNotification('坐标成果导出成功', 'success');
            
        } catch (error) {
            console.error('导出坐标成果时出错:', error);
            this.showNotification('导出坐标成果时出错: ' + error.message, 'error');
        }
    }
    
    /**
     * 导出放样表
     */
    exportLayoutTable() {
        const layoutContainer = document.getElementById('layoutTableContainer');
        if (!layoutContainer || !layoutContainer.querySelector('.layout-table')) {
            this.showNotification('请先生成放样表', 'warning');
            return;
        }
        
        try {
            // 获取放样表HTML
            const layoutHtml = layoutContainer.innerHTML;
            
            // 创建完整的HTML文档
            const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>曲线放样表</title>
    <style>
        body { font-family: "Microsoft YaHei", sans-serif; margin: 20px; }
        .layout-table-wrapper { width: 100%; }
        .layout-table-wrapper h1 { text-align: center; margin-bottom: 20px; }
        .layout-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .layout-table th, .layout-table td { border: 1px solid #000; padding: 6px 8px; text-align: center; }
        .layout-table th { background-color: #f2f2f2; font-weight: bold; }
        .layout-table .point-name { font-weight: bold; background-color: #f9f9f9; }
        .layout-table .coordinate-header, .layout-table .layout-data-header { background-color: #e6e6e6; }
        .layout-table .remarks { border-top: 2px solid #333; background-color: #f0f0f0; }
        .layout-table .highlight-row { background-color: #fff3cd !important; }
        @media print {
            body { margin: 0; }
            .layout-table { font-size: 10px; }
            .layout-table th, .layout-table td { padding: 4px 6px; }
        }
    </style>
</head>
<body>
    ${layoutHtml}
</body>
</html>
            `;
            
            // 下载文件
            this.downloadFile(fullHtml, '曲线放样表.html', 'text/html;charset=utf-8;');
            this.showNotification('放样表导出成功', 'success');
            
        } catch (error) {
            console.error('导出放样表时出错:', error);
            this.showNotification('导出放样表时出错: ' + error.message, 'error');
        }
    }
    
    /**
     * 导出DXF文件
     */
    async exportDxf() {
        if (!window.curveDesign || !window.curveDesign.stationData || window.curveDesign.stationData.length === 0) {
            this.showNotification('请先生成坐标数据', 'warning');
            return;
        }

        this.showNotification('正在生成DXF文件，请稍候...', 'info');

        try {
            const leftDistance = parseFloat(document.getElementById('leftDistance')?.value) || window.curveDesign?.currentParams?.leftDistance || 0;
            const rightDistance = parseFloat(document.getElementById('rightDistance')?.value) || window.curveDesign?.currentParams?.rightDistance || 0;
            const projectName = document.getElementById('projectName')?.value || '道路曲线工程';

            const curveData = {
                mainPoints: window.curveDesign.mainPoints,
                stationData: window.curveDesign.stationData,
                curveElements: window.curveDesign.calculatedElements,
                layoutData: window.curveDesign.layoutData || [],
                leftDistance,
                rightDistance,
                projectName
            };

            const response = await fetch(`${this.apiPrefix}/export/dxf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(curveData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'DXF导出失败');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'curve_design.dxf';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }

            this.downloadFile(blob, filename, 'application/vnd.dxf');
            this.showNotification('DXF文件导出成功', 'success');

        } catch (error) {
            console.error('导出DXF时出错:', error);
            this.showNotification(`导出DXF时出错: ${error.message}`, 'error');
        }
    }

    /**
     * 预览打印
     */
    previewPrint() {
        const layoutContainer = document.getElementById('layoutTableContainer');
        if (!layoutContainer || !layoutContainer.querySelector('.layout-table')) {
            this.showNotification('请先生成放样表', 'warning');
            return;
        }
        
        try {
            // 创建打印窗口
            const printWindow = window.open('', '_blank');
            const layoutHtml = layoutContainer.innerHTML;
            
            printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>曲线放样表 - 打印预览</title>
    <style>
        body { 
            font-family: "Microsoft YaHei", sans-serif; 
            margin: 0; 
            padding: 20px;
        }
        .layout-table-wrapper { width: 100%; }
        .layout-table-wrapper h1 { 
            text-align: center; 
            margin-bottom: 20px; 
            font-size: 18px;
        }
        .layout-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 11px; 
        }
        .layout-table th, .layout-table td { 
            border: 1px solid #000; 
            padding: 4px 6px; 
            text-align: center; 
        }
        .layout-table th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
        }
        .layout-table .point-name { 
            font-weight: bold; 
            background-color: #f9f9f9; 
        }
        .layout-table .coordinate-header, 
        .layout-table .layout-data-header { 
            background-color: #e6e6e6; 
        }
        .layout-table .remarks { 
            border-top: 2px solid #333; 
            background-color: #f0f0f0; 
        }
        .layout-table .highlight-row { 
            background-color: #fff3cd !important; 
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .layout-table { font-size: 9px; }
            .layout-table th, .layout-table td { padding: 2px 4px; }
        }
        .print-controls {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .print-controls button {
            margin: 0 10px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .print-btn {
            background: #007bff;
            color: white;
        }
        .close-btn {
            background: #6c757d;
            color: white;
        }
        @media print {
            .print-controls { display: none; }
        }
    </style>
</head>
<body>
    <div class="print-controls">
        <button class="print-btn" onclick="window.print()">打印</button>
        <button class="close-btn" onclick="window.close()">关闭</button>
    </div>
    ${layoutHtml}
</body>
</html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            
        } catch (error) {
            console.error('预览打印时出错:', error);
            this.showNotification('预览打印时出错: ' + error.message, 'error');
        }
    }
    
    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        if (window.notificationSystem) {
            window.notificationSystem.show(message, type);
        } else {
            alert(message);
        }
    }
}

// 初始化导出服务
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.curveExportService = new CurveExportService();
        console.log('✅ 曲线导出服务初始化完成');
    }, 200);
});




