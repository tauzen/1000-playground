        const simulatorConfig = window.WIN_ME_SIMULATOR_CONFIG || {};

        // ══════════════════════════════════════════════
        // Sound System (Web Audio API)
        // ══════════════════════════════════════════════
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        let audioCtx;
        function ensureAudio() {
            if (!audioCtx) audioCtx = new AudioCtx();
            return audioCtx;
        }

        function playBeep(freq, duration, type) {
            try {
                const ctx = ensureAudio();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type || 'square';
                osc.frequency.value = freq;
                gain.gain.value = 0.08;
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            } catch(e) {}
        }

        function playStartupSound() {
            try {
                const ctx = ensureAudio();
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.value = 0;
                    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.3 + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.6);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.3);
                    osc.stop(ctx.currentTime + i * 0.3 + 0.7);
                });
            } catch(e) {}
        }

        function playErrorSound() {
            playBeep(400, 0.15, 'square');
            setTimeout(() => playBeep(300, 0.2, 'square'), 160);
        }

        function playClickSound() {
            playBeep(800, 0.03, 'square');
        }

        // ══════════════════════════════════════════════
        // Boot Sequence
        // ══════════════════════════════════════════════
        const bootBios = document.getElementById('bootBios');
        const bootScreen = document.getElementById('bootScreen');
        const bootProgress = document.getElementById('bootProgress');
        const bootStatus = document.getElementById('bootStatus');
        const biosMemory = document.getElementById('biosMemory');
        const biosStatus = document.getElementById('biosStatus');
        const theDesktop = document.getElementById('theDesktop');
        const theTaskbar = document.getElementById('theTaskbar');

        // Hide desktop & taskbar during boot
        theDesktop.style.display = 'none';
        theTaskbar.style.display = 'none';
        document.getElementById('startMenu').style.display = 'none';

        let bootDone = false;

        function runBootSequence() {
            // Phase 1: BIOS POST
            let memCount = 0;
            const memTarget = 262144; // 256 MB in KB
            const memInterval = setInterval(() => {
                memCount += 32768;
                if (memCount >= memTarget) {
                    memCount = memTarget;
                    clearInterval(memInterval);
                    biosMemory.textContent = memCount.toLocaleString();
                    biosStatus.textContent = 'Press DEL to enter SETUP, ESC to skip memory test';
                    setTimeout(() => {
                        biosStatus.textContent = 'Starting Windows Me...';
                        setTimeout(showSplashScreen, 600);
                    }, 500);
                } else {
                    biosMemory.textContent = memCount.toLocaleString();
                }
            }, 80);
        }

        function showSplashScreen() {
            bootBios.classList.add('hidden');
            bootScreen.classList.remove('hidden');

            const bootMessages = simulatorConfig.bootMessages || [
                'Loading Windows...',
                'Loading system files...',
                'Initializing device drivers...',
                'Loading Registry...',
                'Preparing network connections...',
                'Loading your personal settings...',
                'Applying computer settings...'
            ];

            let progress = 0;
            let msgIdx = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 8 + 2;
                if (progress > 100) progress = 100;
                bootProgress.style.width = progress + '%';

                if (progress > (msgIdx + 1) * 14 && msgIdx < bootMessages.length - 1) {
                    msgIdx++;
                    bootStatus.textContent = bootMessages[msgIdx];
                }

                if (progress >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(finishBoot, 400);
                }
            }, 150);
        }

        function finishBoot() {
            bootScreen.classList.add('hidden');
            theDesktop.style.display = '';
            theTaskbar.style.display = '';
            document.getElementById('startMenu').style.display = '';
            bootDone = true;

            // Trigger startup sound after user interaction enables audio
            playStartupSound();

            // Schedule random events
            scheduleRandomBSOD();
            scheduleRandomError();
        }

        // Start boot on load
        setTimeout(runBootSequence, 300);

        // ══════════════════════════════════════════════
        // BSOD System
        // ══════════════════════════════════════════════
        const bsod = document.getElementById('bsod');
        const bsodText = document.getElementById('bsodText');

        const bsodMessages = simulatorConfig.bsodMessages || [
            'An exception 0E has occurred at 0028:C0011E36 in VxD VMM(01) +\n00010E36. This was called from 0028:C001747B in VxD VMM(01) +\n0001647B. It may be possible to continue normally.\n\n* Press any key to attempt to continue.\n* Press CTRL+ALT+DEL to restart your computer. You will\n  lose any unsaved information in all applications.\n\nPress any key to continue _',
            'A fatal exception 0D has occurred at 0028:C0034B80 in VxD VWIN32(05) +\n00002E80. The current application will be terminated.\n\n* Press any key to terminate the current application.\n* Press CTRL+ALT+DEL to restart your computer. You will\n  lose any unsaved information in all applications.\n\nPress any key to continue _',
            'EXPLORER caused an invalid page fault in\nmodule KERNEL32.DLL at 0177:BFF9DB61.\n\nRegisters:\nEAX=C0045200 CS=0177 EIP=BFF9DB61 EFLGS=00010216\nEBX=007D4E38 SS=017F ESP=006DF3FC EBP=006DF42C\nECX=006DF4B0 DS=017F ESI=816BD210 FS=455F\nEDX=006DF440 ES=017F EDI=006DF4B0 GS=0000\n\nPress any key to continue _',
            'Windows protection error. You need to restart\nyour computer.\n\nSystem halted.',
            'MSGSRV32 caused a General Protection Fault in\nmodule USER.EXE at 0004:00003FFC.\n\n* Press any key to terminate the current application.\n* Press CTRL+ALT+DEL to restart your computer.\n\nPress any key to continue _'
        ];
        let bsodActive = false;

        function triggerBSOD() {
            if (bsodActive) return;
            bsodActive = true;
            bsodText.textContent = bsodMessages[Math.floor(Math.random() * bsodMessages.length)];
            bsod.classList.add('active');
            playBeep(200, 0.5, 'sawtooth');
        }

        function dismissBSOD() {
            bsod.classList.remove('active');
            bsodActive = false;
            scheduleRandomBSOD();
        }

        document.addEventListener('keydown', (e) => {
            if (bsodActive) { dismissBSOD(); }
        });
        bsod.addEventListener('click', dismissBSOD);

        function scheduleRandomBSOD() {
            // Random BSOD every 2-6 minutes
            const delay = (120 + Math.random() * 240) * 1000;
            setTimeout(() => {
                if (bootDone && !bsodActive) triggerBSOD();
            }, delay);
        }

        // ══════════════════════════════════════════════
        // Random Error Dialogs
        // ══════════════════════════════════════════════
        const errorDialog = document.getElementById('errorDialog');
        const errorDialogTitle = document.getElementById('errorDialogTitle');
        const errorDialogText = document.getElementById('errorDialogText');
        const errorDialogIcon = document.getElementById('errorDialogIcon');

        const randomErrors = simulatorConfig.randomErrors || [
            { title: 'Explorer', text: 'This program has performed an illegal operation and will be shut down. If the problem persists, contact the program vendor.', icon: 'error' },
            { title: 'Windows', text: 'Not enough memory to complete this operation. Close some programs and try again.', icon: 'warning' },
            { title: 'RUNDLL32', text: 'Error in MMSYSTEM.DLL. Missing entry: SndPlaySoundA', icon: 'error' },
            { title: 'DrWatson Postmortem Debugger', text: 'An application error has occurred and an application error log is being generated.\n\nException: access violation (0xc0000005), Address: 0x77f9f3d1', icon: 'error' },
            { title: 'Windows Update', text: 'Windows Update has encountered an error and needs to close. We are sorry for the inconvenience. Error code: 0x80072EFD', icon: 'warning' },
            { title: 'System Resources', text: 'Warning: Your system is running low on system resources. To correct this, close some windows.', icon: 'warning' },
            { title: 'Internet Explorer', text: 'Internet Explorer has encountered a problem and needs to close. We are sorry for the inconvenience.', icon: 'error' },
            { title: 'Disk Cleanup', text: 'The disk cleanup utility could not free any space. Your hard drive may be full.', icon: 'info' }
        ];
        function showErrorDialog(err) {
            errorDialogTitle.textContent = err.title;
            errorDialogText.textContent = err.text;
            errorDialogIcon.className = 'dialog-icon dialog-icon-' + err.icon;
            errorDialog.classList.add('active');
            playErrorSound();
        }

        function closeErrorDialog() {
            errorDialog.classList.remove('active');
        }

        document.getElementById('errorOkBtn').addEventListener('click', closeErrorDialog);
        document.getElementById('errorCloseBtn').addEventListener('click', closeErrorDialog);

        function scheduleRandomError() {
            const delay = (60 + Math.random() * 180) * 1000;
            setTimeout(() => {
                if (bootDone && !bsodActive && !errorDialog.classList.contains('active')) {
                    const err = randomErrors[Math.floor(Math.random() * randomErrors.length)];
                    showErrorDialog(err);
                }
                scheduleRandomError();
            }, delay);
        }

        // ══════════════════════════════════════════════
        // Window Management & Z-Order
        // ══════════════════════════════════════════════
        let topZIndex = 10;

        function bringToFront(windowEl) {
            topZIndex++;
            windowEl.style.zIndex = topZIndex;

            // Update titlebars: active/inactive
            document.querySelectorAll('.window:not(.hidden)').forEach(w => {
                const tb = w.querySelector('.titlebar');
                if (tb) {
                    if (w === windowEl) {
                        tb.classList.remove('inactive');
                    } else {
                        tb.classList.add('inactive');
                    }
                }
            });
        }

        // Click any window to bring to front
        document.querySelectorAll('.window').forEach(w => {
            w.addEventListener('mousedown', () => bringToFront(w));
        });

        // ══════════════════════════════════════════════
        // Window Dragging
        // ══════════════════════════════════════════════
        function makeDraggable(titlebarEl, windowEl) {
            let isDragging = false;
            let startX, startY, origLeft, origTop;

            titlebarEl.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('ctrl-btn')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = windowEl.getBoundingClientRect();
                origLeft = rect.left;
                origTop = rect.top;
                bringToFront(windowEl);
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                windowEl.style.left = (origLeft + dx) + 'px';
                windowEl.style.top = (origTop + dy) + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }

        // Make all windows draggable
        makeDraggable(document.getElementById('titlebar'), document.getElementById('ieWindow'));
        makeDraggable(document.getElementById('appTitlebar'), document.getElementById('appWindow'));
        makeDraggable(document.getElementById('myComputerTitlebar'), document.getElementById('myComputerWindow'));
        makeDraggable(document.getElementById('notepadTitlebar'), document.getElementById('notepadWindow'));
        makeDraggable(document.getElementById('recycleBinTitlebar'), document.getElementById('recycleBinWindow'));

        // ══════════════════════════════════════════════
        // IE Window
        // ══════════════════════════════════════════════
        const frame = document.getElementById('browserFrame');
        const ieWindow = document.getElementById('ieWindow');
        const addressInput = document.getElementById('addressInput');
        const statusText = document.getElementById('statusText');
        const windowTitle = document.getElementById('windowTitle');
        const startButton = document.getElementById('startButton');
        const startMenu = document.getElementById('startMenu');
        const clock = document.getElementById('clock');
        const internetExplorerIcon = document.getElementById('internetExplorerIcon');
        const closeWindowBtn = document.getElementById('closeWindowBtn');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const taskButton = document.getElementById('taskButton');
        const taskButtonLabel = taskButton.querySelector('span:last-child');

        const historyStack = [];
        let historyIndex = -1;
        const homePage = 'https://example.com';

        function normalizeUrl(raw) {
            const trimmed = raw.trim();
            if (!trimmed) return homePage;
            if (trimmed === 'about:blank') return trimmed;
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            return 'https://' + trimmed;
        }

        function truncateTitle(url) {
            return url + ' - Microsoft Internet Explorer';
        }

        function navigate(url, pushHistory = true) {
            const finalUrl = normalizeUrl(url);
            statusText.textContent = 'Opening page...';
            body_loading(true);

            if (finalUrl === 'about:blank') {
                frame.src = '';
                frame.removeAttribute('src');
            } else {
                frame.src = finalUrl;
            }

            addressInput.value = finalUrl;
            const title = truncateTitle(finalUrl);
            windowTitle.textContent = title;

            const shortTitle = title.length > 30 ? title.substring(0, 28) + '...' : title;
            taskButtonLabel.textContent = shortTitle;

            if (pushHistory) {
                historyStack.splice(historyIndex + 1);
                historyStack.push(finalUrl);
                historyIndex = historyStack.length - 1;
            }
        }

        function body_loading(on) {
            if (on) {
                document.body.classList.add('loading');
                setTimeout(() => document.body.classList.remove('loading'), 2000);
            } else {
                document.body.classList.remove('loading');
            }
        }

        function openInternetExplorer() {
            ieWindow.classList.remove('hidden');
            taskButton.style.display = 'flex';
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
            bringToFront(ieWindow);
            playClickSound();

            if (!frame.src || frame.src === 'about:blank' || frame.src === '') {
                if (historyStack.length === 0) {
                    navigate('about:blank');
                }
            }
        }

        function closeInternetExplorer() {
            ieWindow.classList.add('hidden');
            taskButton.style.display = 'none';
        }

        function updateClock() {
            const now = new Date();
            clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }

        // Navigation buttons
        document.getElementById('goBtn').addEventListener('click', () => navigate(addressInput.value));
        addressInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(addressInput.value); });

        document.getElementById('homeBtn').addEventListener('click', () => navigate(homePage));
        document.getElementById('refreshBtn').addEventListener('click', () => {
            statusText.textContent = 'Refreshing...';
            if (addressInput.value && addressInput.value !== 'about:blank') {
                frame.src = addressInput.value;
            }
        });
        document.getElementById('stopBtn').addEventListener('click', () => {
            window.stop();
            statusText.textContent = 'Stopped';
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            navigate('https://www.google.com');
        });

        document.getElementById('favoritesBtn').addEventListener('click', () => {
            alert('Favorites\n\n\u2022 https://example.com\n\u2022 https://archive.org\n\u2022 https://wikipedia.org');
        });

        document.getElementById('historyBtn').addEventListener('click', () => {
            if (historyStack.length === 0) {
                alert('History is empty.');
            } else {
                alert('History\n\n' + historyStack.map((u, i) => (i === historyIndex ? '\u25b6 ' : '  ') + u).join('\n'));
            }
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            if (historyIndex > 0) {
                historyIndex -= 1;
                navigate(historyStack[historyIndex], false);
            }
        });

        document.getElementById('forwardBtn').addEventListener('click', () => {
            if (historyIndex < historyStack.length - 1) {
                historyIndex += 1;
                navigate(historyStack[historyIndex], false);
            }
        });

        frame.addEventListener('load', () => {
            statusText.textContent = 'Done';
            body_loading(false);
        });

        // ══════════════════════════════════════════════
        // App Window (experiment apps)
        // ══════════════════════════════════════════════
        const appWindow = document.getElementById('appWindow');
        const appFrame = document.getElementById('appFrame');
        const appWindowTitle = document.getElementById('appWindowTitle');
        const appStatusText = document.getElementById('appStatusText');
        const appMinimizeBtn = document.getElementById('appMinimizeBtn');
        const appCloseBtn = document.getElementById('appCloseBtn');
        const appTaskButton = document.getElementById('appTaskButton');
        const appTaskLabel = document.getElementById('appTaskLabel');

        function openApp(title, url) {
            appWindowTitle.textContent = title;
            appFrame.src = url;
            appStatusText.textContent = 'Opening...';
            appWindow.classList.remove('hidden');
            appTaskButton.style.display = 'flex';
            appTaskLabel.textContent = title.length > 22 ? title.substring(0, 20) + '...' : title;
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
            closeProgramsSubmenu();
            bringToFront(appWindow);
            body_loading(true);
            playClickSound();
        }

        function closeApp() {
            appWindow.classList.add('hidden');
            appTaskButton.style.display = 'none';
            appFrame.src = '';
        }

        appFrame.addEventListener('load', () => {
            appStatusText.textContent = 'Done';
            body_loading(false);
        });

        appMinimizeBtn.addEventListener('click', () => { appWindow.classList.add('hidden'); });
        appCloseBtn.addEventListener('click', closeApp);
        appTaskButton.addEventListener('click', () => {
            if (appWindow.classList.contains('hidden')) {
                appWindow.classList.remove('hidden');
                bringToFront(appWindow);
            } else {
                appWindow.classList.add('hidden');
            }
        });

        // ══════════════════════════════════════════════
        // My Computer Window
        // ══════════════════════════════════════════════
        const myComputerWindow = document.getElementById('myComputerWindow');
        const myComputerTaskBtn = document.getElementById('myComputerTaskBtn');

        function openMyComputer() {
            myComputerWindow.classList.remove('hidden');
            myComputerTaskBtn.style.display = 'flex';
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
            bringToFront(myComputerWindow);
            playClickSound();
        }

        function closeMyComputer() {
            myComputerWindow.classList.add('hidden');
            myComputerTaskBtn.style.display = 'none';
        }

        document.getElementById('myComputerCloseBtn').addEventListener('click', closeMyComputer);
        document.getElementById('myComputerMinBtn').addEventListener('click', () => myComputerWindow.classList.add('hidden'));
        myComputerTaskBtn.addEventListener('click', () => {
            if (myComputerWindow.classList.contains('hidden')) {
                myComputerWindow.classList.remove('hidden');
                bringToFront(myComputerWindow);
            } else {
                myComputerWindow.classList.add('hidden');
            }
        });

        // Drive click actions
        document.getElementById('driveA').addEventListener('dblclick', () => {
            showErrorDialog({ title: 'A:\\', text: 'A:\\ is not accessible.\n\nThe device is not ready.', icon: 'error' });
        });
        document.getElementById('driveC').addEventListener('dblclick', () => {
            showErrorDialog({ title: 'Local Disk (C:)', text: 'Access to C:\\ is restricted by system policy.\n\nContact your system administrator.', icon: 'warning' });
        });
        document.getElementById('driveD').addEventListener('dblclick', () => {
            showErrorDialog({ title: 'D:\\', text: 'D:\\ is not accessible.\n\nPlease insert a disc into drive D:.', icon: 'error' });
        });

        // ══════════════════════════════════════════════
        // Notepad
        // ══════════════════════════════════════════════
        const notepadWindow = document.getElementById('notepadWindow');
        const notepadTaskBtn = document.getElementById('notepadTaskBtn');
        const notepadText = document.getElementById('notepadText');

        function openNotepad() {
            notepadWindow.classList.remove('hidden');
            notepadTaskBtn.style.display = 'flex';
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
            closeProgramsSubmenu();
            bringToFront(notepadWindow);
            playClickSound();
            notepadText.focus();
        }

        function closeNotepad() {
            notepadWindow.classList.add('hidden');
            notepadTaskBtn.style.display = 'none';
        }

        document.getElementById('notepadCloseBtn').addEventListener('click', closeNotepad);
        document.getElementById('notepadMinBtn').addEventListener('click', () => notepadWindow.classList.add('hidden'));
        notepadTaskBtn.addEventListener('click', () => {
            if (notepadWindow.classList.contains('hidden')) {
                notepadWindow.classList.remove('hidden');
                bringToFront(notepadWindow);
            } else {
                notepadWindow.classList.add('hidden');
            }
        });

        // ══════════════════════════════════════════════
        // Recycle Bin
        // ══════════════════════════════════════════════
        const recycleBinWindow = document.getElementById('recycleBinWindow');
        const recycleBinTaskBtn = document.getElementById('recycleBinTaskBtn');

        function openRecycleBin() {
            recycleBinWindow.classList.remove('hidden');
            recycleBinTaskBtn.style.display = 'flex';
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
            bringToFront(recycleBinWindow);
            playClickSound();
        }

        function closeRecycleBin() {
            recycleBinWindow.classList.add('hidden');
            recycleBinTaskBtn.style.display = 'none';
        }

        document.getElementById('recycleBinCloseBtn').addEventListener('click', closeRecycleBin);
        document.getElementById('recycleBinMinBtn').addEventListener('click', () => recycleBinWindow.classList.add('hidden'));
        recycleBinTaskBtn.addEventListener('click', () => {
            if (recycleBinWindow.classList.contains('hidden')) {
                recycleBinWindow.classList.remove('hidden');
                bringToFront(recycleBinWindow);
            } else {
                recycleBinWindow.classList.add('hidden');
            }
        });

        // ══════════════════════════════════════════════
        // Desktop Icons - open on double-click (or tap)
        // ══════════════════════════════════════════════
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const appEventType = isTouchDevice ? 'click' : 'dblclick';

        if (isTouchDevice) {
            internetExplorerIcon.addEventListener('click', openInternetExplorer);
        } else {
            internetExplorerIcon.addEventListener('dblclick', openInternetExplorer);
        }

        document.getElementById('iconMyComputer').addEventListener(appEventType, openMyComputer);
        document.getElementById('iconRecycleBin').addEventListener(appEventType, openRecycleBin);
        document.getElementById('qlIE').addEventListener('click', openInternetExplorer);

        // Experiment app icons
        const experimentApps = simulatorConfig.experimentApps || [
            { id: 'iconAsciiArtPalette', title: 'ASCII Art Palette', url: '../ascii-art-palette/index.html' },
            { id: 'iconAsciiRunner',     title: 'ASCII Runner',      url: '../ascii-runner/index.html' },
            { id: 'iconHelloWorld',      title: 'Hello World',       url: '../hello-world/index.html' },
            { id: 'iconLocalWeather',    title: 'Local Weather',     url: '../local-weather/index.html' },
            { id: 'iconLocationScene',   title: 'Location Scene Generator', url: '../location-scene-generator/index.html' },
            { id: 'iconAIImage',         title: 'AI Image Generation', url: '../openai-image-generation/index.html' },
            { id: 'iconPlatformer',      title: 'Platformer',        url: '../platformer/index.html' },
            { id: 'iconValentines',      title: "Valentine's Card",  url: '../valentines-card/index.html' },
            { id: 'iconWeatherNetlify',  title: 'Weather Image',     url: '../weather-image-netlify/index.html' },
            { id: 'iconWeatherToImage',  title: 'Weather to Image',  url: '../weather-to-image/index.html' },
        ];

        experimentApps.forEach(({ id, title, url }) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(appEventType, () => openApp(title, url));
        });

        // Minimize / close IE
        minimizeBtn.addEventListener('click', () => {
            ieWindow.classList.add('hidden');
        });
        taskButton.addEventListener('click', () => {
            if (ieWindow.classList.contains('hidden')) {
                ieWindow.classList.remove('hidden');
                bringToFront(ieWindow);
            } else {
                ieWindow.classList.add('hidden');
            }
        });
        closeWindowBtn.addEventListener('click', closeInternetExplorer);

        // Desktop icon selection
        document.querySelectorAll('.icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            });
        });

        // Click desktop to deselect
        document.querySelector('.desktop').addEventListener('click', (e) => {
            if (e.target === e.currentTarget || e.target.classList.contains('desktop-icons')) {
                document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
            }
        });

        // ══════════════════════════════════════════════
        // Start Menu & Submenus
        // ══════════════════════════════════════════════
        const programsSubmenu = document.getElementById('programsSubmenu');

        startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('open');
            startButton.classList.toggle('pressed', startMenu.classList.contains('open'));
            if (!startMenu.classList.contains('open')) {
                closeProgramsSubmenu();
            }
            playClickSound();
        });

        document.addEventListener('click', (e) => {
            if (!startButton.contains(e.target) && !startMenu.contains(e.target) && !programsSubmenu.contains(e.target)) {
                startMenu.classList.remove('open');
                startButton.classList.remove('pressed');
                closeProgramsSubmenu();
            }
        });

        // Programs submenu
        const menuPrograms = document.getElementById('menuPrograms');
        menuPrograms.addEventListener('mouseenter', () => {
            const rect = menuPrograms.getBoundingClientRect();
            programsSubmenu.style.bottom = (window.innerHeight - rect.top - rect.height) + 'px';
            programsSubmenu.classList.add('open');
        });

        function closeProgramsSubmenu() {
            programsSubmenu.classList.remove('open');
        }

        // Close submenu when leaving the Programs area
        startMenu.addEventListener('mouseleave', (e) => {
            if (!programsSubmenu.contains(e.relatedTarget)) {
                closeProgramsSubmenu();
            }
        });

        programsSubmenu.addEventListener('mouseleave', (e) => {
            if (!startMenu.contains(e.relatedTarget)) {
                closeProgramsSubmenu();
            }
        });

        // Submenu items
        document.getElementById('subIE').addEventListener('click', () => {
            openInternetExplorer();
            closeProgramsSubmenu();
        });

        document.getElementById('subNotepad').addEventListener('click', () => {
            openNotepad();
            closeProgramsSubmenu();
        });

        document.getElementById('subOutlook').addEventListener('click', () => {
            showErrorDialog({ title: 'Outlook Express', text: 'Outlook Express could not be started. MSOE.DLL could not be loaded.', icon: 'error' });
            closeProgramsSubmenu();
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
        });

        document.getElementById('subWMP').addEventListener('click', () => {
            showErrorDialog({ title: 'Windows Media Player', text: 'Windows Media Player encountered a problem while playing the file.\nError code: C00D11B1', icon: 'error' });
            closeProgramsSubmenu();
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
        });

        document.getElementById('subAccessories').addEventListener('click', () => {
            openNotepad();
        });

        document.getElementById('subGames').addEventListener('click', () => {
            showErrorDialog({ title: 'Games', text: 'Solitaire has encountered an error and needs to close.\n\nWould you like to send an error report?', icon: 'error' });
            closeProgramsSubmenu();
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
        });

        // Help menu item
        document.getElementById('menuHelp').addEventListener('click', () => {
            showErrorDialog({ title: 'Windows Help', text: 'Help is not available for this program.\n\nTry searching online at microsoft.com for help topics.', icon: 'info' });
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
        });

        // ══════════════════════════════════════════════
        // Run Dialog
        // ══════════════════════════════════════════════
        const runDialog = document.getElementById('runDialog');
        const runInput = document.getElementById('runInput');

        document.getElementById('menuRun').addEventListener('click', () => {
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
            runDialog.classList.add('active');
            runInput.value = '';
            runInput.focus();
            playClickSound();
        });

        document.getElementById('runCancelBtn').addEventListener('click', () => {
            runDialog.classList.remove('active');
        });
        document.getElementById('runCloseBtn').addEventListener('click', () => {
            runDialog.classList.remove('active');
        });

        const runActionHandlers = {
            openNotepad,
            openMyComputer,
            openInternetExplorer
        };

        document.getElementById('runOkBtn').addEventListener('click', () => {
            const rawCommand = runInput.value.trim();
            const cmd = rawCommand.toLowerCase();
            runDialog.classList.remove('active');

            if (!cmd) return;

            const actionName = (simulatorConfig.runActions || {})[cmd];
            if (actionName && runActionHandlers[actionName]) {
                runActionHandlers[actionName]();
            } else if (cmd === 'calc' || cmd === 'calc.exe') {
                showErrorDialog({ title: 'Calculator', text: 'Windows cannot find \'calc.exe\'. Make sure you typed the name correctly, and then try again.', icon: 'error' });
            } else if (cmd.startsWith('http://') || cmd.startsWith('https://') || cmd.startsWith('www.')) {
                openInternetExplorer();
                navigate(cmd);
            } else {
                showErrorDialog({ title: 'Run', text: 'Windows cannot find \'' + rawCommand + '\'. Make sure you typed the name correctly, and then try again. To search for a file, click the Start button, and then click Search.', icon: 'error' });
            }
        });
        runInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('runOkBtn').click();
            if (e.key === 'Escape') runDialog.classList.remove('active');
        });

        // ══════════════════════════════════════════════
        // Right-click Context Menu
        // ══════════════════════════════════════════════
        const contextMenu = document.getElementById('contextMenu');

        document.getElementById('theDesktop').addEventListener('contextmenu', (e) => {
            if (e.target.closest('.window') || e.target.closest('.icon')) return;
            e.preventDefault();
            contextMenu.style.left = e.clientX + 'px';
            contextMenu.style.top = e.clientY + 'px';
            contextMenu.classList.add('open');
        });

        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.classList.remove('open');
            }
        });

        contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            contextMenu.classList.remove('open');
            if (action === 'refresh') {
                body_loading(true);
            } else if (action === 'properties') {
                showErrorDialog({
                    title: 'Display Properties',
                    text: 'Windows Me\nMillennium Edition\n\nVersion 4.90.3000\n\nCopyright \u00A9 Microsoft Corp. 1981-2000\n\nRegistered to: User\nProduct ID: 55274-OEM-0011903-00102',
                    icon: 'info'
                });
            } else if (action === 'new') {
                openNotepad();
            } else if (action === 'arrange') {
                playClickSound();
            }
        });

        // ══════════════════════════════════════════════
        // Shutdown
        // ══════════════════════════════════════════════
        document.getElementById('menuShutdown').addEventListener('click', () => {
            startMenu.classList.remove('open');
            startButton.classList.remove('pressed');
            document.body.style.background = '#000';
            theDesktop.style.display = 'none';
            theTaskbar.style.display = 'none';
            startMenu.style.display = 'none';

            const shutdownMsg = document.createElement('div');
            shutdownMsg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#FF8000;font-size:24px;font-family:"MS Sans Serif",sans-serif;background:#000;z-index:99998;';
            shutdownMsg.innerHTML = 'It\'s now safe to turn off<br>your computer.';
            shutdownMsg.style.textAlign = 'center';
            document.body.appendChild(shutdownMsg);

            shutdownMsg.addEventListener('click', () => {
                shutdownMsg.remove();
                document.body.style.background = '#008080';
                theDesktop.style.display = '';
                theTaskbar.style.display = '';
            });
        });

        // ══════════════════════════════════════════════
        // Show Desktop quick launch
        // ══════════════════════════════════════════════
        document.querySelector('.ql-desktop').addEventListener('click', () => {
            document.querySelectorAll('.window:not(.hidden)').forEach(w => w.classList.add('hidden'));
        });

        // ══════════════════════════════════════════════
        // Clock + Tooltip
        // ══════════════════════════════════════════════
        const clockEl = document.getElementById('clock');
        const clockTooltip = document.getElementById('clockTooltip');

        clockEl.addEventListener('mouseenter', (e) => {
            const now = new Date();
            clockTooltip.textContent = now.toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            clockTooltip.style.display = 'block';
            clockTooltip.style.left = (e.clientX - 80) + 'px';
            clockTooltip.style.top = (e.clientY - 24) + 'px';
        });
        clockEl.addEventListener('mouseleave', () => {
            clockTooltip.style.display = 'none';
        });

        // Volume icon click
        document.getElementById('trayVolume').addEventListener('click', () => {
            showErrorDialog({ title: 'Volume Control', text: 'There are no active mixer devices available. To install mixer devices, go to Control Panel, click Printers and Other Hardware, and then click Add Hardware.\n\nThis program will now close.', icon: 'error' });
        });

        setInterval(updateClock, 1000);
        updateClock();
    
