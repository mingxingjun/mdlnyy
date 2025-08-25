// 开场动画控制脚本
class OpeningAnimation {
    constructor() {
        this.overlay = null;
        this.isSkipped = false;
        this.hasPlayed = false;
        this.init();
    }

    init() {
        // 检查是否已经播放过（可选功能）
        if (localStorage.getItem('opening-animation-played') === 'true') {
            this.hasPlayed = true;
            return;
        }

        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        if (this.hasPlayed) return;
        
        this.overlay = document.querySelector('.opening-overlay');
        if (!this.overlay) return;

        // 绑定跳过按钮事件
        const skipButton = this.overlay.querySelector('.skip-button');
        if (skipButton) {
            skipButton.addEventListener('click', () => this.skip());
        }

        // 绑定键盘事件（ESC键跳过）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.isSkipped) {
                this.skip();
            }
        });

        // 创建动态粒子效果
        this.createSplashParticles();
        this.createBubbles();
        this.createSparkles();
        this.setupDreamText();

        // 设置自动结束
        setTimeout(() => {
            if (!this.isSkipped) {
                this.end();
            }
        }, 3000);

        // 添加最终震颤效果
        setTimeout(() => {
            if (!this.isSkipped) {
                const symbolStage = this.overlay.querySelector('.symbol-stage');
                if (symbolStage) {
                    symbolStage.classList.add('final-tremor');
                }
            }
        }, 2800);
    }

    createSplashParticles() {
        const paintSplash = this.overlay.querySelector('.paint-splash');
        if (!paintSplash) return;

        // 创建12个飞溅粒子
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'splash-particle';
            
            const angle = (360 / 12) * i;
            const distance = Math.random() * 100 + 80; // 80-180px
            
            particle.style.setProperty('--angle', `${angle}deg`);
            particle.style.setProperty('--distance', `${distance}px`);
            
            paintSplash.appendChild(particle);
        }
    }

    createBubbles() {
        const bubblesContainer = this.overlay.querySelector('.bubbles');
        if (!bubblesContainer) return;

        // 创建4个气泡
        const bubblePositions = [
            { x: '-20px', y: '-30px', delay: '1.1s' },
            { x: '25px', y: '-15px', delay: '1.15s' },
            { x: '-15px', y: '20px', delay: '1.2s' },
            { x: '30px', y: '25px', delay: '1.25s' }
        ];

        bubblePositions.forEach((pos, index) => {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.setProperty('--x', pos.x);
            bubble.style.setProperty('--y', pos.y);
            bubble.style.setProperty('--delay', pos.delay);
            bubblesContainer.appendChild(bubble);
        });
    }

    createSparkles() {
        const sparklesContainer = this.overlay.querySelector('.golden-sparkles');
        if (!sparklesContainer) return;

        // 创建8个金色星点
        const sparklePositions = [
            { x: '-25px', y: '-35px', delay: '1.6s' },
            { x: '30px', y: '-20px', delay: '1.65s' },
            { x: '-20px', y: '25px', delay: '1.7s' },
            { x: '35px', y: '30px', delay: '1.75s' },
            { x: '-40px', y: '10px', delay: '1.8s' },
            { x: '15px', y: '-40px', delay: '1.85s' },
            { x: '-10px', y: '40px', delay: '1.9s' },
            { x: '40px', y: '-10px', delay: '1.95s' }
        ];

        sparklePositions.forEach((pos) => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.setProperty('--x', pos.x);
            sparkle.style.setProperty('--y', pos.y);
            sparkle.style.setProperty('--delay', pos.delay);
            sparklesContainer.appendChild(sparkle);
        });
    }

    setupDreamText() {
        const dreamText = this.overlay.querySelector('.dream-text');
        if (!dreamText) return;

        // 将"绘梦"拆分为单个字符
        const text = '绘梦';
        dreamText.innerHTML = '';
        
        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'dream-char';
            span.textContent = char;
            span.style.setProperty('--delay', `${index * 0.1}s`);
            dreamText.appendChild(span);
        });
    }

    skip() {
        if (this.isSkipped) return;
        
        this.isSkipped = true;
        this.end();
    }

    end() {
        if (!this.overlay) return;

        // 添加淡出动画
        this.overlay.classList.add('hidden');
        
        // 等待淡出动画完成后移除元素
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            
            // 标记为已播放（可选）
            // localStorage.setItem('opening-animation-played', 'true');
        }, 500);

        // 播放"咔"声效果（如果有音频文件）
        this.playClickSound();
    }

    playClickSound() {
        // 如果有音频文件，可以在这里播放
        // const audio = new Audio('sounds/click.mp3');
        // audio.volume = 0.3;
        // audio.play().catch(() => {});
        
        // 或者使用Web Audio API创建简单的点击声
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // 如果Web Audio API不支持，静默失败
        }
    }

    // 重置动画（用于调试）
    reset() {
        localStorage.removeItem('opening-animation-played');
        this.hasPlayed = false;
        location.reload();
    }
}

// 创建动画实例
const openingAnimation = new OpeningAnimation();

// 导出到全局作用域（用于调试）
window.openingAnimation = openingAnimation;