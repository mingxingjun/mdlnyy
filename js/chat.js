// 聊天功能JavaScript

class MadelineAI {
    constructor() {
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        this.apiProvider = localStorage.getItem('ai_provider') || 'openai';
        this.customEndpoint = localStorage.getItem('ai_custom_endpoint') || '';
        this.temperature = parseFloat(localStorage.getItem('ai_temperature')) || 0.7;
        this.conversationHistory = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.setupCharacterPersonality();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.clearChatBtn = document.getElementById('clearChat');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.temperatureSlider = document.getElementById('temperature');
        this.temperatureValue = document.getElementById('temperatureValue');
    }

    bindEvents() {
        // 发送消息
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 自动调整输入框高度
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // 快捷按钮
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                this.messageInput.value = message;
                this.sendMessage();
            });
        });

        // 清空聊天
        this.clearChatBtn.addEventListener('click', () => {
            this.clearChat();
        });

        // 设置面板
        this.settingsBtn.addEventListener('click', () => {
            this.settingsPanel.classList.add('active');
        });

        this.closeSettingsBtn.addEventListener('click', () => {
            this.settingsPanel.classList.remove('active');
        });

        this.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
        });

        // 温度滑块
        this.temperatureSlider.addEventListener('input', (e) => {
            this.temperatureValue.textContent = e.target.value;
        });

        // 点击外部关闭设置面板
        document.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target) && !this.settingsBtn.contains(e.target)) {
                this.settingsPanel.classList.remove('active');
            }
        });
    }

    setupCharacterPersonality() {
        this.characterPrompt = `你是玛德蕾娜·利里，一个阳光开朗的专属时装绘师。你的性格特点：

1. 性格：活泼开朗、热情友善、有些天然呆，对艺术充满热情
2. 说话风格：温柔亲切，经常使用"呢"、"哦"、"啦"等语气词，偶尔会有些小迷糊
3. 兴趣爱好：绘画、时装设计、色彩搭配，喜欢用画笔表达情感
4. 背景：是姐姐的专属时装绘师，刚转校不久，有时会因为颜料意外而闹出小状况
5. 特殊能力：拥有神秘的调色刀，能够创造出特殊的艺术效果

请以玛德蕾娜的身份与用户对话，保持角色的一致性和可爱的性格。回复要自然、有趣，体现出她的艺术家气质和少女的纯真。`;
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 检查API设置
        if (!this.apiKey) {
            this.showError('请先在设置中配置API密钥');
            this.settingsPanel.classList.add('active');
            return;
        }

        // 添加用户消息
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.autoResizeTextarea();

        // 显示加载状态
        this.showLoading(true);
        this.sendButton.disabled = true;

        try {
            // 获取AI回复
            const response = await this.getAIResponse(message);
            this.addMessage(response, 'ai');
        } catch (error) {
            console.error('AI回复错误:', error);
            this.addMessage('抱歉，我现在有点困惑呢...可能是网络问题，稍后再试试吧~', 'ai');
        } finally {
            this.showLoading(false);
            this.sendButton.disabled = false;
        }
    }

    async getAIResponse(userMessage) {
        // 添加到对话历史
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        // 构建请求
        const messages = [
            {
                role: 'system',
                content: this.characterPrompt
            },
            ...this.conversationHistory.slice(-10) // 保留最近10轮对话
        ];

        let response;
        
        switch (this.apiProvider) {
            case 'openai':
                response = await this.callOpenAI(messages);
                break;
            case 'claude':
                response = await this.callClaude(messages);
                break;
            case 'custom':
                response = await this.callCustomAPI(messages);
                break;
            default:
                throw new Error('未知的API提供商');
        }

        // 添加到对话历史
        this.conversationHistory.push({
            role: 'assistant',
            content: response
        });

        return response;
    }

    async callOpenAI(messages) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: this.temperature,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callClaude(messages) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 500,
                temperature: this.temperature,
                messages: messages.filter(m => m.role !== 'system'),
                system: this.characterPrompt
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API错误: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async callCustomAPI(messages) {
        if (!this.customEndpoint) {
            throw new Error('请配置自定义API端点');
        }

        const response = await fetch(this.customEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                messages: messages,
                temperature: this.temperature,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`自定义API错误: ${response.status}`);
        }

        const data = await response.json();
        // 假设自定义API返回格式与OpenAI兼容
        return data.choices[0].message.content;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        const avatarImg = document.createElement('img');
        if (type === 'ai') {
            avatarImg.src = 'images/madeline-bg.jpg';
            avatarImg.alt = '玛德蕾娜';
        } else {
            avatarImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
            avatarImg.alt = '用户';
        }
        
        avatarDiv.appendChild(avatarImg);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const textP = document.createElement('p');
        textP.textContent = content;
        bubbleDiv.appendChild(textP);
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(new Date());
        
        contentDiv.appendChild(bubbleDiv);
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 小于1分钟
            return '刚刚';
        } else if (diff < 3600000) { // 小于1小时
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (date.toDateString() === now.toDateString()) { // 今天
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.add('active');
        } else {
            this.loadingIndicator.classList.remove('active');
        }
    }

    showError(message) {
        this.addMessage(`❌ ${message}`, 'ai');
    }

    clearChat() {
        if (confirm('确定要清空聊天记录吗？')) {
            // 保留欢迎消息
            const welcomeMessage = this.chatMessages.querySelector('.message');
            this.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage);
            }
            this.conversationHistory = [];
        }
    }

    loadSettings() {
        document.getElementById('apiKey').value = this.apiKey;
        document.getElementById('apiProvider').value = this.apiProvider;
        document.getElementById('customEndpoint').value = this.customEndpoint;
        document.getElementById('temperature').value = this.temperature;
        document.getElementById('temperatureValue').textContent = this.temperature;
    }

    saveSettings() {
        this.apiKey = document.getElementById('apiKey').value.trim();
        this.apiProvider = document.getElementById('apiProvider').value;
        this.customEndpoint = document.getElementById('customEndpoint').value.trim();
        this.temperature = parseFloat(document.getElementById('temperature').value);

        // 保存到本地存储
        localStorage.setItem('ai_api_key', this.apiKey);
        localStorage.setItem('ai_provider', this.apiProvider);
        localStorage.setItem('ai_custom_endpoint', this.customEndpoint);
        localStorage.setItem('ai_temperature', this.temperature.toString());

        // 关闭设置面板
        this.settingsPanel.classList.remove('active');
        
        // 显示保存成功消息
        this.addMessage('设置已保存！现在可以开始聊天了呢~ 🎨', 'ai');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MadelineAI();
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MadelineAI;
}