/**
 * 统一通知系统
 * 提供全局的toast通知功能
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    /**
     * 初始化通知容器
     */
    init() {
        // 创建通知容器
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);

        // 添加全局样式
        this.addGlobalStyles();
    }

    /**
     * 添加全局样式
     */
    addGlobalStyles() {
        if (document.querySelector('style[data-notification-system]')) {
            return; // 样式已存在
        }

        const style = document.createElement('style');
        style.setAttribute('data-notification-system', 'true');
        style.textContent = `
            /* Toast通知样式 */
            .notification-toast {
                position: relative;
                padding: 12px 20px;
                margin-bottom: 10px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                font-size: 14px;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                pointer-events: auto;
                max-width: 100%;
                word-wrap: break-word;
                animation: slideInRight 0.3s ease-out;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .notification-toast.notification-success {
                background: linear-gradient(135deg, #28a745, #20c997);
            }

            .notification-toast.notification-error {
                background: linear-gradient(135deg, #dc3545, #e74c3c);
            }

            .notification-toast.notification-warning {
                background: linear-gradient(135deg, #ffc107, #fd7e14);
                color: #212529;
            }

            .notification-toast.notification-info {
                background: linear-gradient(135deg, #17a2b8, #3498db);
            }

            .notification-icon {
                margin-right: 10px;
                font-size: 16px;
                vertical-align: middle;
            }

            .notification-close {
                position: absolute;
                top: 8px;
                right: 12px;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.8);
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }

            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0 0 8px 8px;
                transition: width 0.1s linear;
            }

            /* 动画定义 */
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                #notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .notification-toast {
                    margin-bottom: 8px;
                    padding: 14px 18px;
                    font-size: 15px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 显示通知
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型: success, error, warning, info
     * @param {number} duration - 显示时长(毫秒), 默认3000
     * @param {boolean} showClose - 是否显示关闭按钮, 默认true
     * @param {boolean} showProgress - 是否显示进度条, 默认true
     */
    show(message, type = 'info', duration = 3000, showClose = true, showProgress = true) {
        // 验证参数
        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            type = 'info';
        }

        // 创建通知元素
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${type}`;

        // 图标映射
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };

        // 构建内容
        let content = `<span class="notification-icon">${icons[type]}</span>${message}`;
        
        if (showClose) {
            content += '<button class="notification-close" onclick="this.parentElement.remove()">×</button>';
        }

        if (showProgress) {
            content += '<div class="notification-progress"></div>';
        }

        toast.innerHTML = content;

        // 添加到容器
        this.container.appendChild(toast);

        // 进度条动画
        if (showProgress) {
            const progressBar = toast.querySelector('.notification-progress');
            let progress = 100;
            const interval = 100; // 更新间隔
            const decrement = (100 * interval) / duration;
            
            const progressTimer = setInterval(() => {
                progress -= decrement;
                if (progress <= 0) {
                    progress = 0;
                    clearInterval(progressTimer);
                }
                progressBar.style.width = progress + '%';
            }, interval);
        }

        // 自动移除
        const timer = setTimeout(() => {
            this.remove(toast);
        }, duration);

        // 鼠标悬停时暂停计时
        if (showProgress) {
            toast.addEventListener('mouseenter', () => {
                clearTimeout(timer);
            });

            toast.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    this.remove(toast);
                }, 1000); // 离开后1秒消失
            });
        }

        // 控制台日志
        console.log(`💬 ${type.toUpperCase()}: ${message}`);
    }

    /**
     * 移除通知
     * @param {HTMLElement} toast - 要移除的通知元素
     */
    remove(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * 清除所有通知
     */
    clearAll() {
        const toasts = this.container.querySelectorAll('.notification-toast');
        toasts.forEach(toast => this.remove(toast));
    }

    /**
     * 快捷方法
     */
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 3000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

// 创建全局实例
window.notificationSystem = new NotificationSystem();

/**
 * 全局showMessage函数
 * 向后兼容，所有模块统一使用
 */
window.showMessage = function(message, type = 'info', duration = 3000) {
    if (window.notificationSystem) {
        window.notificationSystem.show(message, type, duration);
    } else {
        // 降级到alert
        alert(message);
    }
};

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationSystem, showMessage: window.showMessage };
}

console.log('✅ 统一通知系统已加载');