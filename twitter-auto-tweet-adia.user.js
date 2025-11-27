// ==UserScript==
// @name          Twitter Auto Tweet
// @namespace     http://tampermonkey.net/
// @version       1.0
// @description   Posts random Islamic supplications (Ad'iya) with a unique random stamp to prevent duplication.
// @match         https://twitter.com/*
// @match         https://x.com/*
// @grant         none
// ==/UserScript==

(function() {
    'use strict';

    // 🎯 الإعدادات الرئيسية
    const POST_INTERVAL_MS = 10 * 1000;
    let isAutoPostingActive = false;
    let autoPostIntervalId = null;
    let tweetCount = 0;
    let commandLog = [];

    // 🎯 قائمة الأدعية الإسلامية
    const ADIA_LIST = [
        "اللهم صل وسلم على نبينا محمد وعلى آله وصحبه.",
        "أستغفر الله وأتوب إليه من كل ذنب عظيم.",
        "سبحان الله وبحمده، سبحان الله العظيم.",
        "لا حول ولا قوة إلا بالله العلي العظيم.",
        "لا إله إلا أنت سبحانك إني كنت من الظالمين.",
        "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.",
        "اللهم إنك عفو تحب العفو فاعف عني.",
        "اللهم أحسن عاقبتنا في الأمور كلها وأجرنا من خزي الدنيا وعذاب الآخرة.",
        "رضيت بالله رباً وبالإسلام ديناً وبمحمد صلى الله عليه وسلم نبياً.",
        "اللهم اجعلنا من أهل الفردوس الأعلى بلا سابقة عذاب ولا حساب."
    ];

    const RANDOM_SYMBOLS = "!@#$%^&*()_-+=|\\/{}[]:;\"'<>,.?~";

    // --- وظائف التوليد ---

    function generateUniqueStamp() {
        const length = 10;
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + RANDOM_SYMBOLS;
        const charactersLength = characters.length;

        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return ` [${result}]`;
    }

    function generateRandomTweet() {
        const randomAdia = ADIA_LIST[Math.floor(Math.random() * ADIA_LIST.length)];
        const uniqueStamp = generateUniqueStamp();
        return `${randomAdia} #أدعية_إسلامية ${uniqueStamp}`;
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour12: false });
    }

    function addLog(message, type = 'info') {
        const timestamp = getCurrentTime();
        commandLog.push({ timestamp, message, type });
        if (commandLog.length > 50) commandLog.shift();
        updateLogDisplay();
    }

    // --- وظائف البحث عن العناصر ---

    function findTweetTextArea() {
        return document.querySelector('div[data-testid="tweetTextarea_0"]');
    }

    function findTweetButton() {
        const selectors = [
            'button[data-testid="tweetButtonInline"]',
            'div[data-testid="tweetButtonInline"]',
            'button[data-testid="tweetButton"]',
            'div[data-testid="tweetButton"]',
            'button[role="button"][data-testid*="tweetButton"]'
        ];

        for (const selector of selectors) {
            const btn = document.querySelector(selector);
            if (btn) return btn;
        }
        return null;
    }

    // --- وظيفة النشر الأساسية ---

    function setTextAndPost(textArea, text) {
        textArea.textContent = '';
        textArea.focus();

        try {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', text);
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true,
                cancelable: true
            });
            textArea.dispatchEvent(pasteEvent);
        } catch (e) {}

        if (!textArea.textContent || textArea.textContent.length < text.length / 2) {
             textArea.textContent = text;
        }

        const inputEvent = new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: text });
        textArea.dispatchEvent(inputEvent);
        const changeEvent = new Event('change', { bubbles: true });
        textArea.dispatchEvent(changeEvent);

        setTimeout(() => {
            const tweetButton = findTweetButton();
            if (!tweetButton) {
                addLog('ERROR: Tweet button not found', 'error');
                return;
            }

            tweetButton.click();

            if (tweetButton.hasAttribute('aria-disabled') && tweetButton.getAttribute('aria-disabled') === 'true') {
                 setTimeout(() => {
                     tweetButton.click();
                 }, 1000);
            }
        }, 1500);
    }

    async function postTweet() {
        const TWEET_TEXT = generateRandomTweet();
        const textArea = findTweetTextArea();

        if (textArea) {
             addLog('EXEC: Publishing tweet...', 'command');
             setTextAndPost(textArea, TWEET_TEXT);
             tweetCount++;
             updateStatsDisplay();
             addLog('SUCCESS: Tweet published successfully [ID:' + tweetCount + ']', 'success');
             return true;
        } else {
             addLog('ERROR: Tweet text area not found', 'error');
             return false;
        }
    }

    // --- وظائف التحكم ---

    function startAutoPosting() {
        if (isAutoPostingActive) return;

        isAutoPostingActive = true;
        updateStatusDisplay();
        addLog('SYSTEM: Auto-posting mode activated', 'system');
        addLog('CONFIG: Interval set to 10 seconds', 'info');

        postTweet();

        autoPostIntervalId = setInterval(() => {
            if (isAutoPostingActive) {
                postTweet();
            }
        }, POST_INTERVAL_MS);
    }

    function stopAutoPosting() {
        if (!isAutoPostingActive) return;

        isAutoPostingActive = false;
        updateStatusDisplay();
        clearInterval(autoPostIntervalId);
        autoPostIntervalId = null;
        addLog('SYSTEM: Auto-posting mode deactivated', 'system');
    }

    function toggleAutoPosting() {
        if (isAutoPostingActive) {
            stopAutoPosting();
        } else {
            startAutoPosting();
        }
    }

    function resetCounter() {
        const oldCount = tweetCount;
        tweetCount = 0;
        updateStatsDisplay();
        addLog('RESET: Counter reset from ' + oldCount + ' to 0', 'command');
    }

    function clearLog() {
        commandLog = [];
        updateLogDisplay();
        addLog('SYSTEM: Log cleared', 'system');
    }

    // --- إنشاء واجهة CMD ---

    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'adia-cmd-styles';
        style.textContent = `
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }

            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }

            @keyframes typewriter {
                from { width: 0; }
                to { width: 100%; }
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes glitch {
                0% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
                100% { transform: translate(0); }
            }

            .cmd-cursor {
                display: inline-block;
                width: 8px;
                height: 14px;
                background: #00ff00;
                margin-left: 2px;
                animation: blink 1s infinite;
            }

            .cmd-log-entry {
                animation: fadeIn 0.3s ease;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            }

            .cmd-scanline {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 1px;
                background: linear-gradient(transparent, rgba(0, 255, 0, 0.2), transparent);
                animation: scanline 6s linear infinite;
                pointer-events: none;
                z-index: 1000;
            }

            .cmd-button {
                transition: all 0.2s;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                position: relative;
                overflow: hidden;
            }

            .cmd-button:hover {
                background: #00ff00 !important;
                color: #000000 !important;
                box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
                transform: translateY(-1px);
            }

            .cmd-button:active {
                animation: glitch 0.2s;
                transform: translateY(1px);
            }

            .cmd-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.2), transparent);
                transition: 0.5s;
            }

            .cmd-button:hover::before {
                left: 100%;
            }

            /* Custom scrollbar */
            #cmd-log {
                scrollbar-width: thin;
                scrollbar-color: #00ff00 #0a0a0a;
            }

            #cmd-log::-webkit-scrollbar {
                width: 6px;
            }

            #cmd-log::-webkit-scrollbar-track {
                background: #0a0a0a;
            }

            #cmd-log::-webkit-scrollbar-thumb {
                background-color: #00aa00;
                border-radius: 3px;
            }

            /* Glowing border effect */
            .glow-border {
                position: relative;
            }

            .glow-border::after {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, #00ff00, #00aa00, #00ff00);
                background-size: 200% 200%;
                z-index: -1;
                border-radius: 4px;
                animation: borderGlow 3s ease infinite;
                opacity: 0.7;
            }

            @keyframes borderGlow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            /* Terminal typing effect */
            .typing {
                border-right: 2px solid #00ff00;
                animation: blink 1s step-end infinite;
            }
        `;
        document.head.appendChild(style);
    }

    function createControlPanel() {
        const existingPanel = document.getElementById('adia-cmd-panel');
        if (existingPanel) existingPanel.remove();

        injectStyles();

        const panel = document.createElement('div');
        panel.id = 'adia-cmd-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            width: 650px;
            max-width: 90vw;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
            border-radius: 4px;
            overflow: hidden;
        `;

        // الحاوية الرئيسية - تصميم CMD
        const container = document.createElement('div');
        container.style.cssText = `
            background: #000000;
            border: 1px solid #00aa00;
            position: relative;
            overflow: hidden;
        `;

        // Scanline effect
        const scanline = document.createElement('div');
        scanline.className = 'cmd-scanline';
        container.appendChild(scanline);

        // الهيدر - CMD Style
        const header = document.createElement('div');
        header.style.cssText = `
            background: #0a0a0a;
            border-bottom: 1px solid #00aa00;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #00ff00;
            user-select: none;
        `;

        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #00ff00; font-weight: bold;">C:\\TWITTER\\AUTO_PUBLISHER></span>
                <span class="cmd-cursor"></span>
            </div>
            <div style="display: flex; gap: 6px;">
                <button id="cmd-minimize" style="
                    background: none;
                    border: 1px solid #00aa00;
                    color: #00ff00;
                    width: 22px;
                    height: 22px;
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                    transition: all 0.2s;
                ">_</button>
                <button id="cmd-close" style="
                    background: #ff3333;
                    border: 1px solid #ff0000;
                    color: white;
                    width: 22px;
                    height: 22px;
                    cursor: pointer;
                    font-size: 14px;
                    line-height: 1;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                    transition: all 0.2s;
                ">×</button>
            </div>
        `;

        // المحتوى
        const content = document.createElement('div');
        content.id = 'cmd-content';
        content.style.cssText = `
            padding: 16px;
            color: #00ff00;
            font-size: 13px;
            line-height: 1.6;
            background: rgba(0, 20, 0, 0.1);
            max-height: 60vh;
            overflow-y: auto;
        `;

        // قسم الإحصائيات
        const statsSection = document.createElement('div');
        statsSection.style.cssText = `
            border: 1px solid #00aa00;
            padding: 12px;
            margin-bottom: 16px;
            background: rgba(0, 20, 0, 0.2);
            border-radius: 4px;
            position: relative;
            overflow: hidden;
        `;

        statsSection.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #00ff00, transparent);"></div>
            <div style="margin-bottom: 8px; color: #00ff00; font-weight: bold; text-align: center; text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);">
                ═══════ SYSTEM STATUS ═══════
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div style="display: flex; align-items: center;">
                    <span style="color: #888; margin-right: 8px;">TWEETS:</span>
                    <span id="cmd-tweet-count" style="color: #00ff00; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 1px;">0</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <span style="color: #888; margin-right: 8px;">MODE:</span>
                    <span id="cmd-auto-status" style="color: #ff3333; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">DISABLED</span>
                </div>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #00aa00;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="color: #888;">STATUS:</span>
                    <span id="cmd-system-status" style="color: #00ff00; font-family: 'Courier New', monospace;">[READY]</span>
                </div>
            </div>
        `;

        // قسم الأوامر
        const commandSection = document.createElement('div');
        commandSection.style.cssText = `
            border: 1px solid #00aa00;
            padding: 12px;
            margin-bottom: 16px;
            background: rgba(0, 20, 0, 0.2);
            border-radius: 4px;
            position: relative;
        `;

        commandSection.innerHTML = `
            <div style="margin-bottom: 8px; color: #00ff00; font-weight: bold; text-align: center; text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);">
                ═══════ COMMAND CENTER ═══════
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                <button id="cmd-post" class="cmd-button" style="
                    background: rgba(0, 30, 0, 0.5);
                    border: 1px solid #00aa00;
                    color: #00ff00;
                    padding: 10px 16px;
                    cursor: pointer;
                    text-align: left;
                    font-size: 13px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    transition: all 0.3s;
                ">
                    <span style="margin-right: 8px; font-size: 16px;">▶</span>
                    <span>RUN: publish_tweet.exe</span>
                </button>

                <button id="cmd-auto" class="cmd-button" style="
                    background: rgba(0, 30, 0, 0.5);
                    border: 1px solid #00aa00;
                    color: #00ff00;
                    padding: 10px 16px;
                    cursor: pointer;
                    text-align: left;
                    font-size: 13px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    transition: all 0.3s;
                ">
                    <span style="margin-right: 8px; font-size: 16px;">▶</span>
                    <span>EXEC: auto_mode.bat</span>
                </button>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button id="cmd-reset" class="cmd-button" style="
                        background: rgba(30, 0, 0, 0.5);
                        border: 1px solid #aa0000;
                        color: #ff5555;
                        padding: 8px 12px;
                        cursor: pointer;
                        text-align: left;
                        font-size: 12px;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s;
                    ">
                        <span style="margin-right: 6px;">🔄</span>
                        <span>RESET</span>
                    </button>

                    <button id="cmd-clear-log" class="cmd-button" style="
                        background: rgba(30, 30, 0, 0.5);
                        border: 1px solid #aaaa00;
                        color: #ffff55;
                        padding: 8px 12px;
                        cursor: pointer;
                        text-align: left;
                        font-size: 12px;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s;
                    ">
                        <span style="margin-right: 6px;">🧹</span>
                        <span>CLEAR LOG</span>
                    </button>
                </div>
            </div>
        `;

        // قسم السجل
        const logSection = document.createElement('div');
        logSection.style.cssText = `
            border: 1px solid #00aa00;
            padding: 12px;
            background: rgba(0, 10, 0, 0.3);
            max-height: 250px;
            overflow-y: auto;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
        `;

        logSection.innerHTML = `
            <div style="margin-bottom: 8px; color: #00ff00; font-weight: bold; text-align: center; text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);">
                ═══════ SYSTEM LOG ═══════
            </div>
            <div id="cmd-log" style="min-height: 100px; font-family: 'Courier New', monospace;"></div>
        `;

        // Add subtle grid pattern to log background
        const gridPattern = document.createElement('div');
        gridPattern.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
                linear-gradient(rgba(0, 80, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 80, 0, 0.1) 1px, transparent 1px);
            background-size: 20px 20px;
            pointer-events: none;
            opacity: 0.3;
            z-index: 0;
        `;
        logSection.appendChild(gridPattern);

        // Create log content container
        const logContent = document.createElement('div');
        logContent.id = 'cmd-log-content';
        logContent.style.cssText = 'position: relative; z-index: 1;';
        logContent.innerHTML = '<div id="cmd-log"></div>';
        logSection.appendChild(logContent);

        // Add animated corner decorations
        function createCorner(position) {
            const corner = document.createElement('div');
            corner.style.cssText = `
                position: absolute;
                width: 12px;
                height: 12px;
                ${position.includes('top') ? 'top' : 'bottom'}: -1px;
                ${position.includes('left') ? 'left' : 'right'}: -1px;
                border-${position.includes('top') ? 'top' : 'bottom'}: 2px solid #00ff00;
                border-${position.includes('left') ? 'left' : 'right'}: 2px solid #00ff00;
                ${position.includes('right') ? 'border-top-right-radius: 4px;' : ''}
                ${position.includes('left') && position.includes('top') ? 'border-top-left-radius: 4px;' : ''}
                ${position.includes('right') && position.includes('bottom') ? 'border-bottom-right-radius: 4px;' : ''}
                ${position.includes('left') && position.includes('bottom') ? 'border-bottom-left-radius: 4px;' : ''}
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            `;
            return corner;
        }

        [statsSection, commandSection, logSection].forEach(section => {
            section.style.position = 'relative';
            section.appendChild(createCorner('top-left'));
            section.appendChild(createCorner('top-right'));
            section.appendChild(createCorner('bottom-left'));
            section.appendChild(createCorner('bottom-right'));
        });

        // التجميع
        content.appendChild(statsSection);
        content.appendChild(commandSection);
        content.appendChild(logSection);

        container.appendChild(header);
        container.appendChild(content);
        panel.appendChild(container);

        document.body.appendChild(panel);

        // Make panel draggable
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            panel.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            panel.style.cursor = 'default';
        });

        // إضافة المستمعين
        document.getElementById('cmd-minimize').addEventListener('click', togglePanelMinimize);
        document.getElementById('cmd-close').addEventListener('click', () => {
            panel.style.display = 'none';
            // Show notification that panel can be reopened with Ctrl+Alt+C
            const notification = document.createElement('div');
            notification.textContent = 'Press Ctrl+Alt+C to show Twitter CMD';
            notification.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                padding: 8px 16px;
                border: 1px solid #00aa00;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 9999;
                animation: fadeIn 0.3s;
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.5s';
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        });

        // Add keyboard shortcut to show panel
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 'c') {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Add buttons functionality
        document.getElementById('cmd-post').addEventListener('click', postTweet);
        document.getElementById('cmd-auto').addEventListener('click', toggleAutoPosting);
        document.getElementById('cmd-reset').addEventListener('click', resetCounter);
        document.getElementById('cmd-clear-log').addEventListener('click', clearLog);

        // رسالة بداية
        addLog('SYSTEM: Twitter Auto Publisher v8.1 initialized', 'system');
        addLog('SYSTEM: Type HELP for available commands', 'info');
        addLog('----------------------------------------', 'system');
    }

    function togglePanelMinimize() {
        const content = document.getElementById('cmd-content');
        const minimizeBtn = document.getElementById('cmd-minimize');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            minimizeBtn.textContent = '_';
            minimizeBtn.style.borderColor = '#00aa00';
        } else {
            content.style.display = 'none';
            minimizeBtn.textContent = '+';
            minimizeBtn.style.borderColor = '#aaaa00';
        }
    }

    function updateStatsDisplay() {
        const countEl = document.getElementById('cmd-tweet-count');
        if (countEl) {
            countEl.textContent = tweetCount;
            countEl.style.animation = 'glitch 0.3s';
            setTimeout(() => countEl.style.animation = '', 300);
        }
    }

    function updateStatusDisplay() {
        const autoStatusEl = document.getElementById('cmd-auto-status');
        const systemStatusEl = document.getElementById('cmd-system-status');
        const autoBtn = document.getElementById('cmd-auto');

        if (autoStatusEl && systemStatusEl && autoBtn) {
            if (isAutoPostingActive) {
                autoStatusEl.textContent = 'ACTIVE';
                autoStatusEl.style.color = '#00ff00';
                autoStatusEl.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
                systemStatusEl.textContent = '[AUTO-POSTING] Next in 10s';
                systemStatusEl.style.color = '#00ff00';
                autoBtn.innerHTML = '<span style="margin-right: 8px; font-size: 16px;">⏸</span><span>STOP: auto_mode.bat</span>';
                autoBtn.style.borderColor = '#ff3333';
                autoBtn.style.color = '#ff5555';
                autoBtn.style.background = 'rgba(80, 0, 0, 0.3)';
            } else {
                autoStatusEl.textContent = 'DISABLED';
                autoStatusEl.style.color = '#ff5555';
                autoStatusEl.style.textShadow = 'none';
                systemStatusEl.textContent = '[READY] Awaiting command';
                systemStatusEl.style.color = '#00ff00';
                autoBtn.innerHTML = '<span style="margin-right: 8px; font-size: 16px;">▶</span><span>EXEC: auto_mode.bat</span>';
                autoBtn.style.borderColor = '#00aa00';
                autoBtn.style.color = '#00ff00';
                autoBtn.style.background = 'rgba(0, 30, 0, 0.5)';
            }
        }
    }

    function updateLogDisplay() {
        const logEl = document.getElementById('cmd-log');
        if (!logEl) return;

        const logHTML = commandLog.map(entry => {
            let color = '#00ff00';
            let prefix = '';

            switch(entry.type) {
                case 'error':
                    color = '#ff5555';
                    prefix = '[ERROR] ';
                    break;
                case 'command':
                    color = '#55ffff';
                    prefix = '> ';
                    break;
                case 'system':
                    color = '#ffff55';
                    prefix = '[SYS] ';
                    break;
                case 'success':
                    color = '#55ff55';
                    prefix = '[OK] ';
                    break;
                case 'info':
                default:
                    color = '#aaaaaa';
                    prefix = '• ';
            }

            return `<div class="cmd-log-entry" style="color: ${color}; margin-bottom: 4px; padding: 2px 0; border-bottom: 1px dashed rgba(0, 170, 0, 0.3);">
                <span style="color: #666; font-family: 'Courier New', monospace; margin-right: 8px;">[${entry.timestamp}]</span>
                <span style="color: ${color};">${prefix}${entry.message}</span>
            </div>`;
        }).join('');

        logEl.innerHTML = logHTML;
        logEl.scrollTop = logEl.scrollHeight;
    }

    // Add help command
    function showHelp() {
        const helpText = `
Available Commands:
  ▶ HELP     - Show this help message
  ▶ START    - Start auto-posting tweets
  ▶ STOP     - Stop auto-posting
  ▶ TWEET    - Post a single tweet
  ▶ CLEAR    - Clear the console
  ▶ RESET    - Reset the tweet counter
  ▶ EXIT     - Close the CMD window

Auto-posting will post a new tweet every 10 seconds.
Each tweet contains a random Islamic supplication with a unique ID.
        `;
        addLog(helpText, 'info');
    }

    // Add command processing
    function processCommand(cmd) {
        const command = cmd.toLowerCase().trim();

        switch(command) {
            case 'help':
                showHelp();
                break;
            case 'start':
                startAutoPosting();
                break;
            case 'stop':
                stopAutoPosting();
                break;
            case 'tweet':
                postTweet();
                break;
            case 'clear':
                clearLog();
                break;
            case 'reset':
                resetCounter();
                break;
            case 'exit':
                document.getElementById('cmd-close').click();
                break;
            default:
                addLog(`Command not found: ${cmd}`, 'error');
                addLog('Type HELP for a list of available commands', 'info');
        }
    }

    // Add command input functionality
    function setupCommandInput() {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'cmd-input';
        input.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 8px;
            background: rgba(0, 20, 0, 0.3);
            border: 1px solid #00aa00;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            outline: none;
            border-radius: 4px;
        `;
        input.placeholder = 'Type a command (or click buttons above)...';

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                if (command) {
                    processCommand(command);
                    input.value = '';
                }
            }
        });

        const logSection = document.getElementById('cmd-log');
        if (logSection) {
            logSection.parentNode.insertBefore(input, logSection.nextSibling);
        }
    }

    // Initialize command input after a short delay
    setTimeout(setupCommandInput, 1000);

    // التشغيل
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', createControlPanel);
    } else {
        createControlPanel();
    }

    // Add global function to toggle panel visibility
    window.toggleTwitterCmd = function() {
        const panel = document.getElementById('adia-cmd-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    };

})();
