// 全局变量
let currentSlide = 1;
const totalSlides = 3;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeScrollEffects();
    initializeCarousel();
    initializeBackToTop();
    initializeSmoothScroll();
    initializeSocialLinks();
    initializeHeroButtons();
});

// 导航栏功能
function initializeNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    // 滚动时导航栏样式变化
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 移动端菜单切换
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        
        // 点击菜单项时关闭移动端菜单
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
}

// 滚动效果
function initializeScrollEffects() {
    // 滚动指示器点击事件
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const highlightsSection = document.querySelector('.highlights');
            if (highlightsSection) {
                highlightsSection.scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }
        });
    }
    
    // 滚动动画观察器
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
    
    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.highlight-card, .timeline-item, .voice-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// 轮播图功能
function initializeCarousel() {
    // 自动轮播
    setInterval(function() {
        nextSlide();
    }, 5000);
    
    // 初始显示第一张
    showSlide(currentSlide);
}

function showSlide(n) {
    const slides = document.querySelectorAll('.voice-card');
    const dots = document.querySelectorAll('.dot');
    
    if (n > totalSlides) currentSlide = 1;
    if (n < 1) currentSlide = totalSlides;
    
    // 隐藏所有卡片
    slides.forEach(slide => {
        slide.classList.remove('active');
    });
    
    // 移除所有点的激活状态
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    
    // 显示当前卡片和点
    if (slides[currentSlide - 1]) {
        slides[currentSlide - 1].classList.add('active');
    }
    if (dots[currentSlide - 1]) {
        dots[currentSlide - 1].classList.add('active');
    }
}

function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

function currentSlideFunc(n) {
    currentSlide = n;
    showSlide(currentSlide);
}

// 将函数绑定到全局作用域，以便HTML中的onclick可以访问
window.currentSlide = currentSlideFunc;

// 返回顶部按钮
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// 平滑滚动
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // 如果href只是#或者为空，则不处理
            if (targetId === '#' || targetId === '' || targetId.length <= 1) {
                return;
            }
            
            e.preventDefault();
            
            try {
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 70; // 考虑导航栏高度
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            } catch (error) {
                console.warn('Invalid selector:', targetId);
            }
        });
    });
}

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 工具函数：防抖
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// 添加一些交互效果
document.addEventListener('DOMContentLoaded', function() {
    // 卡片悬停效果增强
    const cards = document.querySelectorAll('.highlight-card, .voice-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // 按钮点击效果
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 创建波纹效果
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 进度条动画
    const progressBars = document.querySelectorAll('.progress-fill');
    const progressObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const width = progressBar.style.width;
                progressBar.style.width = '0%';
                setTimeout(() => {
                    progressBar.style.width = width;
                }, 100);
            }
        });
    });
    
    progressBars.forEach(bar => {
        progressObserver.observe(bar);
    });
});

// 添加波纹效果的CSS（动态添加）
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// 首页按钮处理
function initializeHeroButtons() {
    // 处理首页的"加入应援群"按钮
    const heroButtons = document.querySelectorAll('.hero-buttons .btn-primary');
    
    heroButtons.forEach(button => {
        // 检查按钮文本是否包含"应援群"或有QQ图标
        const buttonText = button.textContent.trim();
        const hasQQIcon = button.querySelector('.fa-qq');
        
        if (buttonText.includes('应援群') || buttonText.includes('QQ群') || hasQQIcon) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showMessage('应援群功能敬请期待', 'info');
            });
        }
    });
}

// 社交链接处理
function initializeSocialLinks() {
    // 查找所有指向#的链接
    const socialLinks = document.querySelectorAll('a[href="#"]');
    
    socialLinks.forEach(link => {
        const text = link.textContent.trim();
        const hasQQIcon = link.querySelector('.fa-qq');
        const hasBilibiliIcon = link.querySelector('.fa-bilibili');
        
        // 处理QQ群链接
        if (text.includes('QQ群') || hasQQIcon) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showMessage('QQ群功能敬请期待', 'info');
            });
        }
        // 处理B站链接
        else if (text.includes('B站') || text.includes('bilibili') || hasBilibiliIcon) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showMessage('B站账号功能敬请期待', 'info');
            });
        }
    });
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 移除已存在的消息
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message-toast message-${type}`;
    messageElement.innerHTML = `
        <i class="fas ${getMessageIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // 添加样式
    Object.assign(messageElement.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: getMessageColor(type),
        color: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: '500',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(messageElement);
    
    // 显示动画
    setTimeout(() => {
        messageElement.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        messageElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 300);
    }, 3000);
}

function getMessageIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getMessageColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    return colors[type] || colors.info;
}