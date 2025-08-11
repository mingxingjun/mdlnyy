// 粉丝社区页面交互功能

document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initCategoryFilter();
    initWorkInteractions();
    initSloganAnimations();
    initScrollAnimations();
});

// 作品分类筛选功能
function initCategoryFilter() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const fanworkItems = document.querySelectorAll('.fanwork-item');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // 更新活跃标签
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选作品
            filterWorks(category, fanworkItems);
        });
    });
}

// 筛选作品函数
function filterWorks(category, items) {
    items.forEach(item => {
        const itemCategory = item.dataset.category;
        
        if (category === 'all' || itemCategory === category) {
            item.classList.remove('hidden');
            // 添加显示动画
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100);
        } else {
            item.classList.add('hidden');
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
        }
    });
}

// 作品交互功能
function initWorkInteractions() {
    const likeButtons = document.querySelectorAll('.action-btn.like');
    const viewButtons = document.querySelectorAll('.action-btn.view');
    
    // 点赞功能
    likeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const icon = this.querySelector('i');
            const countSpan = this.querySelector('span');
            let count = parseInt(countSpan.textContent.replace('k', '000').replace('.', ''));
            
            // 切换点赞状态
            if (icon.classList.contains('fas')) {
                icon.classList.remove('fas');
                icon.classList.add('far');
                count -= 1;
                this.style.color = 'white';
            } else {
                icon.classList.remove('far');
                icon.classList.add('fas');
                count += 1;
                this.style.color = '#ff6b6b';
                
                // 添加点赞动画
                this.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
            }
            
            // 更新计数显示
            if (count >= 1000) {
                countSpan.textContent = (count / 1000).toFixed(1) + 'k';
            } else {
                countSpan.textContent = count.toString();
            }
        });
    });
    
    // 查看功能
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 添加点击效果
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // 显示提示信息
            showToast('作品详情页面开发中，敬请期待！');
        });
    });
    
    // 作品卡片点击
    const fanworkItems = document.querySelectorAll('.fanwork-item');
    fanworkItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.work-title').textContent;
            showToast(`正在加载《${title}》详情...`);
        });
    });
}

// 口号动画功能
function initSloganAnimations() {
    // 标签云悬停效果
    const cloudItems = document.querySelectorAll('.cloud-item');
    
    cloudItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            // 随机颜色变化
            const colors = [
                'rgba(255, 107, 107, 0.3)',
                'rgba(54, 162, 235, 0.3)',
                'rgba(255, 206, 84, 0.3)',
                'rgba(75, 192, 192, 0.3)',
                'rgba(153, 102, 255, 0.3)'
            ];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.style.background = randomColor;
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        item.addEventListener('click', function() {
            // 点击复制口号
            const text = this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast(`已复制口号：${text}`);
            }).catch(() => {
                showToast('复制失败，请手动复制');
            });
        });
    });
    
    // 弹幕暂停/继续功能
    const marquee = document.querySelector('.slogan-marquee');
    const track = document.querySelector('.slogan-track');
    
    marquee.addEventListener('mouseenter', function() {
        track.style.animationPlayState = 'paused';
    });
    
    marquee.addEventListener('mouseleave', function() {
        track.style.animationPlayState = 'running';
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
    const animateElements = document.querySelectorAll('.fanwork-item, .event-card, .section-title');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// 显示提示信息
function showToast(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
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
    
    .fanwork-item, .event-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .fanwork-item.animate-in, .event-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// 搜索功能（预留）
function searchWorks(keyword) {
    const fanworkItems = document.querySelectorAll('.fanwork-item');
    const searchTerm = keyword.toLowerCase();
    
    fanworkItems.forEach(item => {
        const title = item.querySelector('.work-title').textContent.toLowerCase();
        const author = item.querySelector('.work-author').textContent.toLowerCase();
        const tags = Array.from(item.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        
        const isMatch = title.includes(searchTerm) || 
                       author.includes(searchTerm) || 
                       tags.some(tag => tag.includes(searchTerm));
        
        if (isMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 统计功能（预留）
function getWorksStats() {
    const fanworkItems = document.querySelectorAll('.fanwork-item');
    const stats = {
        total: fanworkItems.length,
        art: document.querySelectorAll('[data-category="art"]').length,
        video: document.querySelectorAll('[data-category="video"]').length,
        writing: document.querySelectorAll('[data-category="writing"]').length,
        music: document.querySelectorAll('[data-category="music"]').length
    };
    
    return stats;
}