// 小说阅读页面JavaScript功能

document.addEventListener('DOMContentLoaded', function() {
    initializeNovelPage();
    initializeReadingProgress();
    initializeFontControls();
    initializeChapterNavigation();
    initializeScrollAnimations();
    initializeActionButtons();
});

// 初始化小说页面
function initializeNovelPage() {
    // 初始化章节显示状态
    const allChapters = document.querySelectorAll('.chapter-content');
    allChapters.forEach((chapter, index) => {
        if (index === 0) {
            // 显示第一话
            chapter.style.display = 'block';
            setTimeout(() => {
                chapter.classList.add('show');
            }, 300);
        } else {
            // 隐藏其他章节
            chapter.style.display = 'none';
        }
    });
    
    // 设置第一话为激活状态
    const firstChapterItem = document.querySelector('.chapter-item[data-chapter="1"]');
    if (firstChapterItem) {
        firstChapterItem.classList.add('active');
    }
}

// 初始化阅读进度条
function initializeReadingProgress() {
    const progressBar = document.querySelector('.reading-progress-bar');
    if (!progressBar) return;

    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.pageYOffset;
        const progress = (scrollTop / documentHeight) * 100;
        
        progressBar.style.width = Math.min(progress, 100) + '%';
    }

    window.addEventListener('scroll', updateProgress);
    updateProgress(); // 初始化
}

// 初始化字体控制
function initializeFontControls() {
    const fontControls = document.querySelector('.font-controls');
    if (!fontControls) return;

    const chapterText = document.querySelector('.chapter-text');
    if (!chapterText) return;

    let currentFontSize = 1.1; // 默认字体大小 (rem)
    const minFontSize = 0.9;
    const maxFontSize = 1.5;
    const step = 0.1;

    // 创建字体控制按钮
    fontControls.innerHTML = `
        <button class="font-btn" id="font-increase" title="增大字体">
            <i class="fas fa-plus"></i>
        </button>
        <button class="font-btn" id="font-decrease" title="减小字体">
            <i class="fas fa-minus"></i>
        </button>
        <button class="font-btn" id="font-reset" title="重置字体">
            <i class="fas fa-undo"></i>
        </button>
    `;

    // 增大字体
    document.getElementById('font-increase').addEventListener('click', function() {
        if (currentFontSize < maxFontSize) {
            currentFontSize += step;
            updateFontSize();
        }
    });

    // 减小字体
    document.getElementById('font-decrease').addEventListener('click', function() {
        if (currentFontSize > minFontSize) {
            currentFontSize -= step;
            updateFontSize();
        }
    });

    // 重置字体
    document.getElementById('font-reset').addEventListener('click', function() {
        currentFontSize = 1.1;
        updateFontSize();
    });

    function updateFontSize() {
        chapterText.style.fontSize = currentFontSize + 'rem';
        
        // 保存到本地存储
        localStorage.setItem('novel-font-size', currentFontSize);
    }

    // 从本地存储恢复字体大小
    const savedFontSize = localStorage.getItem('novel-font-size');
    if (savedFontSize) {
        currentFontSize = parseFloat(savedFontSize);
        updateFontSize();
    }
}

// 初始化章节导航
function initializeChapterNavigation() {
    const chapterItems = document.querySelectorAll('.chapter-item:not(.coming-soon)');
    
    chapterItems.forEach(item => {
        item.addEventListener('click', function() {
            const chapterNumber = this.querySelector('.chapter-number').textContent;
            scrollToChapter(chapterNumber);
        });
    });

    // 阅读控制按钮
    const prevBtn = document.getElementById('prev-chapter');
    const nextBtn = document.getElementById('next-chapter');

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            showNotification('上一章节敬请期待', 'info');
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            showNotification('下一章节敬请期待', 'info');
        });
    }
}

// 滚动到指定章节
function scrollToChapter(chapterNumber) {
    // 解析章节号
    const chapterNum = chapterNumber.replace('第', '').replace('话', '');
    const targetChapter = document.querySelector(`#chapter-${chapterNum}`);
    
    if (targetChapter) {
        // 隐藏所有章节
        document.querySelectorAll('.chapter-content').forEach(chapter => {
            chapter.style.display = 'none';
            chapter.classList.remove('show');
            chapter.style.opacity = '0';
            chapter.style.transform = 'translateY(30px)';
        });
        
        // 显示目标章节
        targetChapter.style.display = 'block';
        
        // 滚动到章节
        targetChapter.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // 高亮当前章节
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`.chapter-item[data-chapter="${chapterNum}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // 触发显示动画
        setTimeout(() => {
            targetChapter.style.opacity = '1';
            targetChapter.style.transform = 'translateY(0)';
            targetChapter.classList.add('show');
        }, 100);
    }
}

// 初始化滚动动画
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.style.display !== 'none') {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 观察章节内容
    const chapterSections = document.querySelectorAll('.chapter-content');
    chapterSections.forEach(section => {
        // 只对隐藏的章节设置初始动画状态
        if (section.style.display === 'none' || !section.classList.contains('show')) {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
        }
        section.style.transition = 'all 0.6s ease';
        observer.observe(section);
    });
}

// 初始化操作按钮
function initializeActionButtons() {
    // 开始阅读按钮
    const startReadingBtn = document.querySelector('.action-btn.primary');
    if (startReadingBtn) {
        startReadingBtn.addEventListener('click', function() {
            const firstChapter = document.querySelector('.chapter-content');
            if (firstChapter) {
                firstChapter.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // 返回名场面按钮
    const backToMomentsBtn = document.querySelector('#backToMoments');
    if (backToMomentsBtn) {
        backToMomentsBtn.addEventListener('click', function() {
            window.location.href = 'moments.html';
        });
    }
}

// 切换收藏状态
function toggleFavorite(button) {
    const icon = button.querySelector('i');
    const text = button.querySelector('span') || button;
    
    const isFavorited = button.classList.contains('favorited');
    
    if (isFavorited) {
        button.classList.remove('favorited');
        if (icon) icon.className = 'far fa-heart';
        if (text) text.textContent = '收藏小说';
        showNotification('已取消收藏', 'info');
    } else {
        button.classList.add('favorited');
        if (icon) icon.className = 'fas fa-heart';
        if (text) text.textContent = '已收藏';
        showNotification('收藏成功！', 'success');
        
        // 添加收藏动画
        button.style.transform = 'scale(1.1)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
    
    // 保存收藏状态到本地存储
    localStorage.setItem('novel-favorited', !isFavorited);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
    `;

    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// 获取通知颜色
function getNotificationColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    return colors[type] || colors.info;
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // 只在小说页面启用快捷键
    if (!document.querySelector('.novel-content')) return;
    
    switch(e.key) {
        case 'ArrowUp':
            if (e.ctrlKey) {
                e.preventDefault();
                window.scrollBy(0, -200);
            }
            break;
        case 'ArrowDown':
            if (e.ctrlKey) {
                e.preventDefault();
                window.scrollBy(0, 200);
            }
            break;
        case '+':
            if (e.ctrlKey) {
                e.preventDefault();
                document.getElementById('font-increase')?.click();
            }
            break;
        case '-':
            if (e.ctrlKey) {
                e.preventDefault();
                document.getElementById('font-decrease')?.click();
            }
            break;
        case '0':
            if (e.ctrlKey) {
                e.preventDefault();
                document.getElementById('font-reset')?.click();
            }
            break;
    }
});

// 页面加载完成后恢复收藏状态
window.addEventListener('load', function() {
    const favoriteBtn = document.querySelector('.action-btn.secondary');
    if (favoriteBtn) {
        const isFavorited = localStorage.getItem('novel-favorited') === 'true';
        if (isFavorited) {
            favoriteBtn.classList.add('favorited');
            const icon = favoriteBtn.querySelector('i');
            const text = favoriteBtn.querySelector('span') || favoriteBtn;
            if (icon) icon.className = 'fas fa-heart';
            if (text) text.textContent = '已收藏';
        }
    }
});

// 平滑滚动到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 导出函数供其他脚本使用
window.novelPageFunctions = {
    scrollToChapter,
    toggleFavorite,
    showNotification,
    scrollToTop
};