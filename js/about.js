// 关于我们页面JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 数字动画
    animateNumbers();
    
    // 表单提交处理
    handleFormSubmission();
    
    // 滚动动画
    initScrollAnimations();
    
    // 联系方式点击处理
    handleContactClicks();
});

// 数字动画效果
function animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateNumber(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statNumbers.forEach(number => {
        observer.observe(number);
    });
}

function animateNumber(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000; // 2秒
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, stepTime);
}

// 表单提交处理
function handleFormSubmission() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        // 验证表单
        if (!validateForm(data)) {
            return;
        }
        
        // 模拟提交
        submitForm(data);
    });
}

function validateForm(data) {
    if (!data.name.trim()) {
        showMessage('请输入您的姓名', 'error');
        return false;
    }
    
    if (!data.email.trim() || !isValidEmail(data.email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return false;
    }
    
    if (!data.subject) {
        showMessage('请选择反馈类型', 'error');
        return false;
    }
    
    if (!data.message.trim()) {
        showMessage('请输入详细描述', 'error');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function submitForm(data) {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // 显示提交中状态
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
    submitBtn.disabled = true;
    
    // 模拟网络请求
    setTimeout(() => {
        // 重置按钮状态
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // 显示成功消息
        showMessage('感谢您的反馈！我们会尽快回复您。', 'success');
        
        // 清空表单
        document.querySelector('.contact-form').reset();
    }, 2000);
}

// 滚动动画
function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.team-member, .visual-card, .point, .contact-item, .disclaimer-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// 联系方式点击处理
function handleContactClicks() {
    // QQ群联系方式点击
    const qqContact = document.querySelector('.contact-item:nth-child(2) .contact-details p');
    if (qqContact) {
        qqContact.style.cursor = 'pointer';
        qqContact.addEventListener('click', function() {
            showMessage('QQ群功能敬请期待', 'info');
        });
    }
    
    // B站联系方式点击
    const bilibiliContact = document.querySelector('.contact-item:nth-child(3) .contact-details p');
    if (bilibiliContact) {
        bilibiliContact.style.cursor = 'pointer';
        bilibiliContact.addEventListener('click', function() {
            showMessage('B站账号功能敬请期待', 'info');
        });
    }
    
    // 邮箱点击复制
    const emailContact = document.querySelector('.contact-item:nth-child(1) .contact-details p');
    if (emailContact) {
        emailContact.style.cursor = 'pointer';
        emailContact.addEventListener('click', function() {
            copyToClipboard(this.textContent);
            showMessage('邮箱地址已复制到剪贴板', 'success');
        });
    }
    
    // 团队成员联系方式
    const memberContacts = document.querySelectorAll('.member-contact a');
    memberContacts.forEach(contact => {
        contact.addEventListener('click', function(e) {
            e.preventDefault();
            showMessage('联系方式功能暂未开放', 'info');
        });
    });
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // 兼容旧浏览器
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
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

// 页面加载完成后的额外初始化
window.addEventListener('load', function() {
    // 为统计数据添加悬停效果
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // 为团队成员卡片添加点击效果
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('click', function() {
            // 添加点击波纹效果
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(102, 126, 234, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (rect.width / 2 - size / 2) + 'px';
            ripple.style.top = (rect.height / 2 - size / 2) + 'px';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);