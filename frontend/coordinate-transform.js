document.addEventListener('DOMContentLoaded', function () {
    // Global variable to store the currently active coordinate function
    window.currentCoordinateFunction = null;

    /**
     * Switches the visible content within the coordinate transformation module.
     * @param {string} func - The function identifier (e.g., 'gauss_forward').
     */
    window.switchCoordinateFunction = function(func) {
        console.log('Switching to coordinate function:', func);
        // Store the current function globally
        window.currentCoordinateFunction = func;

        // Hide all coordinate function content views
// 显示指定功能的内容
        document.querySelectorAll('#coordinate-work-area .function-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // 同时兼容新的模块结构
        document.querySelectorAll('#coordinate-work-area .module-container').forEach(module => {
            module.style.display = 'none';
        });

        // Show the content view for the selected function
        const contentId = `${func}-content`;
        const targetContent = document.getElementById(contentId);
        if (targetContent) {
            targetContent.style.display = 'block';
            // 同时显示模块容器
            const targetModule = targetContent.querySelector('.module-container');
            if (targetModule) {
                targetModule.style.display = 'block';
            }
        } else {
            console.error('Content view for function not found:', contentId);
            // Optionally, show a default or placeholder view
            const defaultView = document.getElementById('coordinate-default-content');
            if(defaultView) defaultView.style.display = 'block';
        }
    };

    // Set a default view when the module is first loaded but no function is selected
    const defaultView = document.getElementById('coordinate-default-content');
    if(defaultView) {
        // Hide all others first
        document.querySelectorAll('#coordinate-work-area .function-content').forEach(content => {
            content.style.display = 'none';
        });
        defaultView.style.display = 'block';
    }
});