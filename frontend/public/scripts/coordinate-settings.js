document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('coordinateSettingsModal');
    if (!modal) {
        return; // Modal not found on this page, do nothing.
    }
    const closeBtn = modal.querySelector('.modal-close');
    const saveBtn = document.getElementById('saveCoordinateSettingsBtn');

    // 获取所有参数组
    const allParamGroups = modal.querySelectorAll('.param-group');

    // 定义每个功能需要显示的参数组
    const functionParams = {
        'gauss_forward': ['ellipsoid-params', 'projection-params'],
        'gauss_inverse': ['ellipsoid-params', 'projection-params'],
        'xyz_to_blh': ['ellipsoid-params'],
        'blh_to_xyz': ['ellipsoid-params'],
        'zone_transform_1': ['ellipsoid-params', 'source-projection-params', 'target-projection-params'],
        'zone_transform_2': ['ellipsoid-params', 'source-projection-params', 'target-projection-params'],
        'four_param_forward': ['four-param-settings'],
        // 四参数转换反算已删除
        'seven_param': ['seven-param-settings']
    };

    // 打开模态框的函数
    window.openCoordSettingsModal = (func) => {
        // 1. 隐藏所有参数组
        allParamGroups.forEach(group => {
            group.style.display = 'none';
        });

        // 2. 获取当前功能需要显示的参数组
        const requiredGroups = functionParams[func] || [];

        // 3. 显示所需的参数组
        requiredGroups.forEach(groupId => {
            const groupToShow = document.getElementById(groupId);
            if (groupToShow) {
                groupToShow.style.display = 'block';
            }
        });

        // 4. 更新模态框标题
        const modalTitle = modal.querySelector('.modal-header h3');
        const functionButton = document.querySelector(`.sub-module-btn[data-function='${func}']`);
        if (modalTitle && functionButton) {
            modalTitle.textContent = `${functionButton.innerText.trim()} - 计算方案`;
        }

        // 5. 显示模态框
        modal.style.display = 'flex';
    };

    // 关闭模态框
    const closeSettingsModal = () => {
        if (modal) {
            modal.style.display = 'none';
        }
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettingsModal);
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // 在这里添加保存设置的逻辑
            console.log('保存坐标转换设置');
            closeSettingsModal();
        });
    }

    // 点击模态框外部也可以关闭
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeSettingsModal();
        }
    });
});