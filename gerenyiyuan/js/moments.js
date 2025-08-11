// 名场面页面专用JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeFilter();
    initializeWatchButtons();
    initializeCardAnimations();
});

// 初始化筛选功能
function initializeFilter() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const momentCards = document.querySelectorAll('.moment-card');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // 更新活跃标签
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选卡片
            filterCards(category, momentCards);
        });
    });
}

// 筛选卡片函数
function filterCards(category, cards) {
    cards.forEach((card, index) => {
        const cardCategory = card.getAttribute('data-category');
        
        // 添加筛选动画类
        card.classList.add('filtering');
        
        setTimeout(() => {
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.classList.remove('filtering');
                    card.classList.add('show');
                }, 50);
            } else {
                card.style.display = 'none';
                card.classList.remove('show');
            }
        }, index * 50); // 错开动画时间
        
        // 清理动画类
        setTimeout(() => {
            card.classList.remove('filtering');
        }, 500);
    });
}

// 初始化观看按钮
function initializeWatchButtons() {
    const watchButtons = document.querySelectorAll('.watch-btn');
    
    watchButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 添加点击效果
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // 显示提示信息
            showWatchNotification();
        });
    });
    
    // 播放覆盖层点击事件
    const playOverlays = document.querySelectorAll('.play-overlay');
    playOverlays.forEach(overlay => {
        overlay.addEventListener('click', function() {
            // 添加播放动画
            this.style.transform = 'translate(-50%, -50%) scale(1.3)';
            this.style.opacity = '0';
            
            setTimeout(() => {
                this.style.transform = 'translate(-50%, -50%) scale(1.1)';
                this.style.opacity = '1';
            }, 200);
            
            showWatchNotification();
        });
    });
}

// 显示观看提示
function showWatchNotification() {
    // 创建提示框
    const notification = document.createElement('div');
    notification.className = 'watch-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>点击跳转到视频播放页面</span>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(notification);
    
    // 2秒后移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
}

// 初始化卡片动画
function initializeCardAnimations() {
    // 滚动时的动画观察器
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 观察所有卡片
    const cards = document.querySelectorAll('.moment-card');
    cards.forEach((card, index) => {
        // 初始状态
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        
        observer.observe(card);
    });
    
    // 卡片悬停效果增强
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const image = this.querySelector('.moment-image');
            if (image) {
                image.style.transform = 'scale(1.05)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const image = this.querySelector('.moment-image');
            if (image) {
                image.style.transform = 'scale(1)';
            }
        });
    });
}

// 添加CSS动画
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes fadeInOut {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        20%, 80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    }
    
    .moment-image {
        transition: transform 0.3s ease;
    }
    
    .filter-tab {
        position: relative;
        overflow: hidden;
    }
    
    .filter-tab::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: all 0.3s ease;
    }
    
    .filter-tab:hover::before {
        width: 100%;
        height: 100%;
    }
    
    .moment-card {
        position: relative;
        overflow: hidden;
    }
    
    .moment-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s ease;
    }
    
    .moment-card:hover::after {
        left: 100%;
    }
`;

document.head.appendChild(animationStyles);

// 搜索功能（可选扩展）
function addSearchFunctionality() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索名场面...';
    searchInput.className = 'moment-search';
    
    // 添加搜索样式
    searchInput.style.cssText = `
        width: 300px;
        padding: 12px 20px;
        border: 2px solid #e0e0e0;
        border-radius: 25px;
        font-size: 0.9rem;
        outline: none;
        transition: all 0.3s ease;
        margin: 0 20px;
    `;
    
    // 将搜索框添加到筛选栏
    const filterTabs = document.querySelector('.filter-tabs');
    if (filterTabs) {
        filterTabs.appendChild(searchInput);
    }
    
    // 搜索功能
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const cards = document.querySelectorAll('.moment-card');
        
        cards.forEach(card => {
            const title = card.querySelector('.moment-title').textContent.toLowerCase();
            const description = card.querySelector('.moment-description').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
                card.classList.add('show');
            } else {
                card.style.display = 'none';
                card.classList.remove('show');
            }
        });
    });
    
    // 搜索框焦点效果
    searchInput.addEventListener('focus', function() {
        this.style.borderColor = 'var(--primary-color)';
        this.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
    });
    
    searchInput.addEventListener('blur', function() {
        this.style.borderColor = '#e0e0e0';
        this.style.boxShadow = 'none';
    });
}

// 可选：启用搜索功能
// addSearchFunctionality();

// 统计功能
function addStatistics() {
    const categories = ['action', 'emotional', 'touching', 'highlight'];
    const stats = {};
    
    categories.forEach(category => {
        const count = document.querySelectorAll(`[data-category="${category}"]`).length;
        stats[category] = count;
    });
    
    console.log('名场面统计:', stats);
    return stats;
}

// 页面加载完成后显示统计
window.addEventListener('load', function() {
    const stats = addStatistics();
    
    // 可以在控制台查看统计信息
    console.log('页面加载完成，名场面总数:', Object.values(stats).reduce((a, b) => a + b, 0));
});