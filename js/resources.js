// 应援资源页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initTabNavigation();
    initWallpaperFilters();
    initDownloadFunctions();
    initScrollAnimations();
});

// 标签页导航功能
function initTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const resourceSections = document.querySelectorAll('.resource-section');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            
            // 更新活跃标签
            navTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 切换显示区域
            resourceSections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // 添加切换动画
                targetSection.style.opacity = '0';
                targetSection.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    targetSection.style.opacity = '1';
                    targetSection.style.transform = 'translateY(0)';
                }, 100);
            }
        });
    });
}

// 壁纸筛选功能
function initWallpaperFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const wallpaperItems = document.querySelectorAll('.wallpaper-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // 更新活跃按钮
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选壁纸
            filterWallpapers(filter, wallpaperItems);
        });
    });
}

// 筛选壁纸函数
function filterWallpapers(filter, items) {
    items.forEach((item, index) => {
        const category = item.dataset.category;
        
        if (filter === 'all' || category === filter) {
            item.style.display = 'block';
            // 添加显示动画
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

// 壁纸下载函数
function downloadWallpaper(imagePath, filename) {
    // 创建一个临时的a标签来触发下载
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 显示下载提示
    showToast(`正在下载壁纸：${filename}`);
}

// 图片预览函数
function showImagePreview(imagePath, title) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title} - 预览</h3>
                <button class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="image-container">
                    <img src="${imagePath}" alt="${title}" class="preview-image">
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn download" onclick="downloadWallpaper('${imagePath}', '${imagePath.split('/').pop()}')">
                    <i class="fas fa-download"></i>
                    下载原图
                </button>
                <button class="modal-btn close">关闭</button>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
        background: rgba(0, 0, 0, 0.9);
    `;
    
    // 添加预览模态框样式
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .image-preview-modal .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(5px);
        }
        .image-preview-modal .modal-content {
            position: relative;
            background: white;
            border-radius: 15px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            transform: scale(0.8);
            transition: all 0.3s ease;
        }
        .image-preview-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 2px solid #f8f9fa;
            background: white;
        }
        .image-preview-modal .modal-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.2rem;
        }
        .image-preview-modal .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6c757d;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        .image-preview-modal .close-btn:hover {
            background: #f8f9fa;
            color: #ff6b6b;
        }
        .image-preview-modal .modal-body {
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            max-height: 70vh;
            overflow: hidden;
        }
        .image-preview-modal .image-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f8f9fa;
        }
        .image-preview-modal .preview-image {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 8px;
        }
        .image-preview-modal .modal-footer {
            display: flex;
            gap: 1rem;
            padding: 15px 20px;
            border-top: 2px solid #f8f9fa;
            justify-content: flex-end;
            background: white;
        }
        .image-preview-modal .modal-btn {
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .image-preview-modal .modal-btn.download {
            background: linear-gradient(135deg, #ff6b6b, #ffa500);
            color: white;
            border: none;
        }
        .image-preview-modal .modal-btn.close {
            background: #f8f9fa;
            color: #6c757d;
            border: 2px solid #e9ecef;
        }
        .image-preview-modal .modal-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(modalStyle);
    
    document.body.appendChild(modal);
    
    // 显示动画
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 100);
    
    // 关闭功能
    const closeModal = () => {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            if (document.head.contains(modalStyle)) {
                document.head.removeChild(modalStyle);
            }
        }, 300);
    };
    
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('.modal-btn.close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    // ESC键关闭
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// 下载功能
function initDownloadFunctions() {
    // 壁纸下载
    const wallpaperDownloadBtns = document.querySelectorAll('.wallpaper-item .action-btn.download');
    wallpaperDownloadBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const wallpaperItem = this.closest('.wallpaper-item');
            const title = wallpaperItem.querySelector('h3').textContent;
            
            // 添加点击效果
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // 模拟下载
            simulateDownload(title, 'wallpaper');
        });
    });
    
    // 壁纸预览（只绑定没有onclick属性的按钮）
    const wallpaperPreviewBtns = document.querySelectorAll('.wallpaper-item .action-btn.preview:not([onclick])');
    wallpaperPreviewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const wallpaperItem = this.closest('.wallpaper-item');
            const title = wallpaperItem.querySelector('h3').textContent;
            
            showPreviewModal(title);
        });
    });
    
    // 头像下载
    const avatarDownloadBtns = document.querySelectorAll('.avatar-item .download-btn');
    avatarDownloadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const avatarItem = this.closest('.avatar-item');
            const title = avatarItem.querySelector('h3').textContent;
            
            // 添加点击效果
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            simulateDownload(title, 'avatar');
        });
    });
    
    // 模板下载
    const templateBtns = document.querySelectorAll('.template-btn');
    templateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const templateItem = this.closest('.template-item');
            const title = templateItem.querySelector('h4').textContent;
            
            // 添加点击效果
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            simulateDownload(title, 'template');
        });
    });
}

// 模拟下载功能
function simulateDownload(itemName, type) {
    const typeNames = {
        wallpaper: '壁纸',
        avatar: '头像',
        template: '模板'
    };
    
    const typeName = typeNames[type] || '文件';
    
    // 创建下载进度提示
    const progressToast = createProgressToast(`正在下载${typeName}：${itemName}`);
    document.body.appendChild(progressToast);
    
    // 模拟下载进度
    let progress = 0;
    const progressBar = progressToast.querySelector('.progress-bar');
    const progressText = progressToast.querySelector('.progress-text');
    
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                progressToast.style.opacity = '0';
                progressToast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    document.body.removeChild(progressToast);
                    showToast(`${typeName}下载完成！`);
                }, 300);
            }, 500);
        }
    }, 200);
}

// 创建进度提示
function createProgressToast(message) {
    const toast = document.createElement('div');
    toast.className = 'progress-toast';
    toast.innerHTML = `
        <div class="toast-header">
            <i class="fas fa-download"></i>
            <span>${message}</span>
        </div>
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        <div class="progress-text">0%</div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #ff6b6b;
        border-radius: 10px;
        padding: 15px;
        width: 300px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .toast-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            font-weight: 500;
            color: #2c3e50;
        }
        .toast-header i {
            color: #ff6b6b;
        }
        .progress-container {
            width: 100%;
            height: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 5px;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b, #ffa500);
            width: 0%;
            transition: width 0.3s ease;
        }
        .progress-text {
            text-align: right;
            font-size: 0.8rem;
            color: #6c757d;
        }
    `;
    document.head.appendChild(style);
    
    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    return toast;
}

// 显示预览模态框
function showPreviewModal(title) {
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title} - 预览</h3>
                <button class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="preview-placeholder">
                    <i class="fas fa-image"></i>
                    <p>预览功能开发中</p>
                    <p>实际使用时这里会显示高清预览图</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn download">
                    <i class="fas fa-download"></i>
                    下载原图
                </button>
                <button class="modal-btn close">关闭</button>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    // 添加模态框样式
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
        }
        .modal-content {
            position: relative;
            background: white;
            border-radius: 15px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow: hidden;
            transform: scale(0.8);
            transition: all 0.3s ease;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid #f8f9fa;
        }
        .modal-header h3 {
            margin: 0;
            color: #2c3e50;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6c757d;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        .close-btn:hover {
            background: #f8f9fa;
            color: #ff6b6b;
        }
        .modal-body {
            padding: 20px;
        }
        .preview-placeholder {
            text-align: center;
            padding: 40px;
            background: #f8f9fa;
            border-radius: 10px;
            color: #6c757d;
        }
        .preview-placeholder i {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        .modal-footer {
            display: flex;
            gap: 1rem;
            padding: 20px;
            border-top: 2px solid #f8f9fa;
            justify-content: flex-end;
        }
        .modal-btn {
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        .modal-btn.download {
            background: linear-gradient(135deg, #ff6b6b, #ffa500);
            color: white;
            border: none;
        }
        .modal-btn.close {
            background: #f8f9fa;
            color: #6c757d;
            border: 2px solid #e9ecef;
        }
        .modal-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(modalStyle);
    
    document.body.appendChild(modal);
    
    // 显示动画
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 100);
    
    // 关闭功能
    const closeModal = () => {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.8)';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.head.removeChild(modalStyle);
        }, 300);
    };
    
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('.modal-btn.close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    // 下载功能
    modal.querySelector('.modal-btn.download').addEventListener('click', () => {
        simulateDownload(title, 'wallpaper');
        closeModal();
    });
}

// 滚动动画
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.wallpaper-item, .avatar-item, .template-category, .guide-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// 显示提示信息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b, #ffa500);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 添加CSS动画类
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: slideInUp 0.6s ease forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .wallpaper-item, .avatar-item, .template-category, .guide-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .wallpaper-item.animate-in, .avatar-item.animate-in, .template-category.animate-in, .guide-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// 搜索功能（预留）
function searchResources(keyword) {
    const searchTerm = keyword.toLowerCase();
    const allItems = document.querySelectorAll('.wallpaper-item, .avatar-item, .template-item');
    
    allItems.forEach(item => {
        const title = item.querySelector('h3, h4').textContent.toLowerCase();
        const description = item.querySelector('p')?.textContent.toLowerCase() || '';
        
        const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
        
        if (isMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 批量下载功能（预留）
function batchDownload(category) {
    const items = document.querySelectorAll(`[data-category="${category}"]`);
    const titles = Array.from(items).map(item => item.querySelector('h3').textContent);
    
    showToast(`准备批量下载 ${titles.length} 个${category}文件...`);
    
    // 这里可以实现实际的批量下载逻辑
}