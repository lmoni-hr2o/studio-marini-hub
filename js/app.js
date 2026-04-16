let user = { uid: 'local-user' };

const STORAGE_KEYS = {
    checklist: 'studio_marini_checklist',
    history: 'studio_marini_history'
};

export function initAuth(callback) {
    document.getElementById('loadingOverlay').style.display = 'none';
    callback();
}

export function getUser() {
    return user;
}

export function getAppId() {
    return 'local';
}

let currentSlide = 0;
const slides = document.querySelectorAll('.slide-content');
const counter = document.getElementById('slideCounter');
let presenterMode = false;

export function changeSlide(dir) {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    counter.innerText = `Slide ${currentSlide + 1} / ${slides.length}`;
}

export function toggleFullscreen() {
    const viewer = document.getElementById('viewer');
    const btn = viewer.querySelector('.fullscreen-btn');
    
    if (!document.fullscreenElement) {
        viewer.requestFullscreen().then(() => {
            viewer.classList.add('fullscreen');
            btn.innerHTML = '<i class="fas fa-compress"></i>';
        });
    } else {
        document.exitFullscreen().then(() => {
            viewer.classList.remove('fullscreen');
            btn.innerHTML = '<i class="fas fa-expand"></i>';
        });
    }
}

document.addEventListener('fullscreenchange', () => {
    const viewer = document.getElementById('viewer');
    const btn = viewer?.querySelector('.fullscreen-btn');
    if (!document.fullscreenElement && btn) {
        viewer.classList.remove('fullscreen');
        btn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === ' ') changeSlide(1);
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 'p' || e.key === 'P') togglePresenterMode();
    if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
});

export function togglePresenterMode() {
    if (window.presenterWindow && !window.presenterWindow.closed) {
        window.presenterWindow.close();
        window.presenterWindow = null;
        if (window.presentationWin) {
            window.presentationWin.close();
            window.presentationWin = null;
        }
        document.getElementById('presenterMode').textContent = 'Modalità Presentatore';
        document.getElementById('presenterMode').style.background = 'var(--g-blue)';
        return;
    }
    
    const slideContents = Array.from(slides).map(slide => {
        const h2 = slide.querySelector('h2')?.textContent || '';
        const p = slide.querySelector('p')?.textContent || '';
        const html = slide.innerHTML;
        return { h2, p, html };
    });
    
    const channel = new BroadcastChannel('studio_marini_presenter');
    
    window.presentationWin = window.open('', 'Presentation', 'width=1024,height=768');
    
    const presentationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Presentazione</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #202124; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .slide { width: 100%; height: 100%; padding: 80px; display: none; flex-direction: column; justify-content: center; color: white; }
            .slide.active { display: flex; }
            h2 { font-size: 72px; color: #4285f4; margin-bottom: 40px; font-family: 'Poppins', sans-serif; }
            p { font-size: 36px; color: #9aa0a6; }
            ul { font-size: 32px; color: #bdc1c6; margin-top: 30px; }
            .logo { position: absolute; bottom: 40px; right: 40px; color: #4285f4; font-size: 28px; font-family: 'Poppins', sans-serif; }
            .controls { position: absolute; bottom: 20px; left: 20px; opacity: 0; transition: opacity 0.3s; }
            body:hover .controls { opacity: 1; }
            .controls button { background: rgba(255,255,255,0.1); border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        </style>
    </head>
    <body>
        ${slideContents.map((s, i) => `
        <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">
            ${s.html}
        </div>
        `).join('')}
        <div class="logo">Studio Marini</div>
        <div class="controls">
            <button onclick="channel.postMessage({action:'prev'})"><</button>
            <button onclick="channel.postMessage({action:'next'})">></button>
            <button onclick="toggleFS()">Fullscreen</button>
        </div>
        <script>
            const channel = new BroadcastChannel('studio_marini_presenter');
            const slideEls = document.querySelectorAll('.slide');
            let currentSlide = 0;
            
            function showSlide(idx) {
                slideEls.forEach((s, i) => s.classList.toggle('active', i === idx));
            }
            
            function toggleFS() {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
            
            channel.onmessage = (e) => {
                if (e.data.action === 'goto') {
                    currentSlide = e.data.index;
                    showSlide(currentSlide);
                }
                if (e.data.action === 'next') {
                    currentSlide = (currentSlide + 1) % slideEls.length;
                    showSlide(currentSlide);
                }
                if (e.data.action === 'prev') {
                    currentSlide = (currentSlide - 1 + slideEls.length) % slideEls.length;
                    showSlide(currentSlide);
                }
            };
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === ' ') channel.postMessage({action:'next'});
                if (e.key === 'ArrowLeft') channel.postMessage({action:'prev'});
                if (e.key === 'f') toggleFS();
            });
        </script>
    </body>
    </html>
    `;
    
    window.presentationWin.document.write(presentationHTML);
    window.presentationWin.document.close();
    
    setTimeout(() => {
        try { window.presentationWin.focus(); } catch(e) {}
    }, 1000);
    
    window.presenterWin = window.open('', 'PresenterView', 'width=1200,height=900');
    
    const presenterHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Presenter View - Studio Marini</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', sans-serif; background: #1a1a1a; color: white; padding: 15px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .timer { font-size: 42px; font-weight: bold; color: #4285f4; }
            .timer.running { animation: pulse 2s infinite; }
            @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
            .slide-counter { font-size: 22px; background: #333; padding: 8px 16px; border-radius: 8px; }
            .slides-container { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 12px; margin-bottom: 12px; }
            .slide-box { background: #333; border-radius: 10px; padding: 10px; text-align: center; }
            .slide-box.current { border: 3px solid #4285f4; }
            .slide-box h4 { color: #888; margin-bottom: 6px; font-size: 11px; }
            .slide-preview { background: #202124; border-radius: 6px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px; overflow: hidden; }
            .slide-preview.current { height: 160px; border: 2px solid #4285f4; }
            .slide-preview h2 { font-size: 11px; color: #4285f4; }
            .slide-preview p { font-size: 8px; color: #aaa; }
            .slide-preview .empty { color: #555; font-size: 10px; }
            .notes { background: #333; border-radius: 10px; padding: 12px; }
            .notes h4 { color: #888; margin-bottom: 6px; font-size: 11px; }
            .notes textarea { width: 100%; height: 60px; background: #222; border: none; color: white; padding: 8px; border-radius: 6px; font-size: 12px; resize: none; }
            .controls { display: flex; gap: 8px; margin-top: 12px; justify-content: center; }
            .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; }
            .btn-prev { background: #ea4335; color: white; }
            .btn-next { background: #34a853; color: white; }
            .btn-timer { background: #fbbc04; color: black; }
            .btn-stop { background: #666; color: white; }
            .hint { background: #222; border: 1px solid #444; padding: 8px; border-radius: 6px; margin-bottom: 12px; font-size: 11px; color: #aaa; text-align: center; }
        </style>
    </head>
    <body>
        <div class="hint">
            <i class="fas fa-desktop"></i> Trascina la finestra "Presentazione" sul 2° schermo, poi Fullscreen (F)
        </div>
        <div class="header">
            <button class="btn btn-timer" onclick="toggleTimer()" id="timerBtn"><i class="fas fa-play"></i> Start</button>
            <div class="slide-counter"><span id="slideNum">1</span> / <span id="totalSlides">${slideContents.length}</span></div>
            <div class="timer" id="timer">00:00:00</div>
        </div>
        <div class="slides-container">
            <div class="slide-box">
                <h4>PRECEDENTE</h4>
                <div class="slide-preview" id="prevSlide"></div>
            </div>
            <div class="slide-box current">
                <h4>CORRENTE</h4>
                <div class="slide-preview current" id="currentSlide"></div>
            </div>
            <div class="slide-box">
                <h4>SUCCESSIVA</h4>
                <div class="slide-preview" id="nextSlide"></div>
            </div>
        </div>
        <div class="notes">
            <h4>NOTE</h4>
            <textarea id="notes" placeholder="Scrivi le note..."></textarea>
        </div>
        <div class="controls">
            <button class="btn btn-prev" onclick="goPrev()"><i class="fas fa-arrow-left"></i></button>
            <button class="btn btn-stop" onclick="window.close()"><i class="fas fa-stop"></i></button>
            <button class="btn btn-next" onclick="goNext()"><i class="fas fa-arrow-right"></i></button>
        </div>
        <script>
            const slideData = ${JSON.stringify(slideContents)};
            const channel = new BroadcastChannel('studio_marini_presenter');
            let currentSlide = 0;
            let timerInterval = null;
            let seconds = 0;
            let timerRunning = false;
            
            function updateView(curr) {
                document.getElementById('slideNum').textContent = curr;
                
                const prevIdx = curr - 2;
                const nextIdx = curr;
                
                document.getElementById('prevSlide').innerHTML = prevIdx >= 0 
                    ? '<h2>' + slideData[prevIdx].h2 + '</h2><p>' + (slideData[prevIdx].p || '').substring(0,35) + '</p>'
                    : '<span class="empty">Nessuna</span>';
                    
                document.getElementById('currentSlide').innerHTML = '<h2>' + slideData[curr-1].h2 + '</h2><p>' + (slideData[curr-1].p || '').substring(0,70) + '</p>';
                
                document.getElementById('nextSlide').innerHTML = nextIdx < slideData.length 
                    ? '<h2>' + slideData[nextIdx].h2 + '</h2><p>' + (slideData[nextIdx].p || '').substring(0,35) + '</p>'
                    : '<span class="empty">Nessuna</span>';
            }
            
            function goPrev() {
                currentSlide = (currentSlide - 1 + slideData.length) || slideData.length;
                updateView(currentSlide);
                channel.postMessage({action:'goto', index:currentSlide-1});
            }
            
            function goNext() {
                currentSlide = (currentSlide % slideData.length) + 1;
                updateView(currentSlide);
                channel.postMessage({action:'goto', index:currentSlide-1});
            }
            
            function toggleTimer() {
                const btn = document.getElementById('timerBtn');
                const timerEl = document.getElementById('timer');
                if (timerRunning) {
                    clearInterval(timerInterval);
                    timerRunning = false;
                    btn.innerHTML = '<i class="fas fa-play"></i> Start';
                    timerEl.classList.remove('running');
                } else {
                    timerInterval = setInterval(() => {
                        seconds++;
                        const h = Math.floor(seconds / 3600).toString().padStart(2,'0');
                        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2,'0');
                        const s = (seconds % 60).toString().padStart(2,'0');
                        timerEl.textContent = h + ':' + m + ':' + s;
                    }, 1000);
                    timerRunning = true;
                    btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                    timerEl.classList.add('running');
                }
            }
            
            window.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') goPrev();
                if (e.key === 'ArrowRight' || e.key === ' ') goNext();
            });
            
            updateView(1);
        </script>
    </body>
    </html>
    `;
    
    window.presenterWin.document.write(presenterHTML);
    window.presenterWin.document.close();
    
    document.getElementById('presenterMode').textContent = 'Presentatore ON';
    document.getElementById('presenterMode').style.background = 'var(--g-green)';
}

export function copyPrompt(btn) {
    const promptCard = btn.closest('.prompt-card');
    const promptText = promptCard.querySelector('code').innerText;
    
    navigator.clipboard.writeText(promptText).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copiato!';
        btn.classList.remove('btn-blue');
        btn.classList.add('btn-green');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-green');
            btn.classList.add('btn-blue');
        }, 2000);
    });
}

export function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const clickedBtn = document.querySelector('[onclick="openTab(\'' + tabId + '\')"]');
    if (clickedBtn) clickedBtn.classList.add('active');
    
    document.getElementById(tabId).scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    const sectionMap = {
        'corso-base': 5,
        'modulo-1': 5,
        'modulo-2': 5,
        'modulo-3': 5
    };
    
    if (sectionMap[tabId] !== undefined) {
        syncPresentation(sectionMap[tabId]);
    }
}

export function syncPresentation(index) {
    { id: 'm1-lab1', label: 'Completa Lab 1: Configura Agenda' },
    { id: 'm1-lab2', label: 'Completa Lab 2: Crea Listino Servizi' },
    { id: 'm1-lab3', label: 'Completa Lab 3: Collega Stripe' },
    { id: 'm2-lab1', label: 'Completa Lab 4: Prompt Reclamo' },
    { id: 'm2-lab2', label: 'Completa Lab 5: Prompt Preventivo' },
    { id: 'm2-lab3', label: 'Completa Lab 6: Estrai Decisioni' },
    { id: 'm3-lab1', label: 'Completa Lab 7: Analisi PDF' },
    { id: 'm3-lab2', label: 'Completa Lab 8: Genera Documento' }
];

export function loadChecklist() {
    const saved = localStorage.getItem(STORAGE_KEYS.checklist);
    const data = saved ? JSON.parse(saved) : {};
    const container = document.getElementById('checklistContainer');
    container.innerHTML = '';
    checklistItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checklist-item';
        const checked = data[item.id] ? 'checked' : '';
        div.innerHTML = `
            <input type="checkbox" id="${item.id}" ${checked} onchange="window.syncCheck('${item.id}', this.checked)">
            <label for="${item.id}">${item.label}</label>
        `;
        container.appendChild(div);
    });
}

export function syncCheck(id, status) {
    const saved = localStorage.getItem(STORAGE_KEYS.checklist);
    const data = saved ? JSON.parse(saved) : {};
    data[id] = status;
    localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(data));
}

export function loadWall() {
    const saved = localStorage.getItem(STORAGE_KEYS.history);
    const history = saved ? JSON.parse(saved) : [];
    const wall = document.getElementById('publicWall');
    wall.innerHTML = '';
    
    if (history.length === 0) {
        wall.innerHTML = '<p style="color:var(--subtext); grid-column: 1/-1; text-align:center;">I tuoi prompt appariranno qui dopo aver usato i laboratori AI.</p>';
        return;
    }
    
    history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '20px';
        card.innerHTML = `
            <div class="badge badge-ai" style="margin-bottom:10px;">${item.type}</div>
            <p style="font-size:13px; font-weight:bold;">"${item.prompt.substring(0, 50)}..."</p>
            <div style="font-size:12px; color:var(--subtext); background:var(--bg); padding:10px; border-radius:10px;">${item.result.substring(0, 150)}...</div>
        `;
        wall.appendChild(card);
    });
}

function saveHistory(type, prompt, result) {
    const saved = localStorage.getItem(STORAGE_KEYS.history);
    const history = saved ? JSON.parse(saved) : [];
    history.unshift({ type, prompt, result, ts: Date.now() });
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 50)));
}

export async function generateAiText() {
    const prompt = document.getElementById('aiPrompt').value;
    const btn = document.getElementById('btnAi');
    const output = document.getElementById('aiOutput');

    if (!prompt) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Elaborazione...';
    output.style.display = 'block';
    output.innerText = "Gemini sta scrivendo per te...";

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: "Sei l'assistente dello Studio Marini. Scrivi testi brevi, professionali e orientati alle PMI." }] }
            })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Errore nella generazione.";
        output.innerText = text;
        
        saveHistory('Testo AI', prompt, text);
        loadWall();
    } catch (e) {
        output.innerText = "Errore di connessione. Verifica la chiave API.";
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Genera Bozza';
    }
}

export async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value;
    const btn = document.getElementById('btnImage');
    const img = document.getElementById('imageResult');

    if (!prompt) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione...';
    img.style.display = 'none';

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
        });
        const data = await res.json();
        if (data.predictions?.[0]) {
            const b64 = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            img.src = b64;
            img.style.display = 'block';
            
            saveHistory('Immagine AI', prompt, 'Immagine generata');
            loadWall();
        }
    } catch (e) {
        alert("Errore generazione immagine.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Genera Asset';
    }
}

window.changeSlide = changeSlide;
window.openTab = openTab;
window.copyPrompt = copyPrompt;
window.syncCheck = syncCheck;
window.generateAiText = generateAiText;
window.generateImage = generateImage;
window.toggleFullscreen = toggleFullscreen;
window.togglePresenterMode = togglePresenterMode;
window.startPresentation = startPresentation;

export function startPresentation() {
    if (window.presentationWin && !window.presentationWin.closed) {
        window.presentationWin.focus();
        return;
    }
    
    window.presentationWin = window.open('', 'PresentazioneCompleta', 'width=1280,height=720');
    
    const channel = new BroadcastChannel('studio_marini_presentation');
    
    const presentationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Presentazione Corso - Studio Marini</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; background: #1a1a1a; color: white; overflow: hidden; }
            .slide { 
                display: none; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center;
                height: 100vh; 
                padding: 60px;
                text-align: center;
            }
            .slide.active { display: flex; }
            .slide h1 { font-size: 56px; color: #4285f4; font-family: 'Poppins', sans-serif; margin-bottom: 20px; }
            .slide h2 { font-size: 48px; color: #4285f4; font-family: 'Poppins', sans-serif; margin-bottom: 30px; }
            .slide p { font-size: 28px; color: #9aa0a6; margin-bottom: 20px; }
            .slide ul { font-size: 24px; color: #bdc1c6; text-align: left; margin: 20px 0; }
            .slide li { margin: 15px 0; }
            .badge { 
                background: #e8f0fe; color: #4285f4; 
                padding: 8px 20px; border-radius: 50px; 
                font-size: 16px; font-weight: 700; text-transform: uppercase;
            }
            .progress {
                position: fixed; bottom: 0; left: 0; right: 0;
                height: 6px; background: #333;
            }
            .progress-bar {
                height: 100%; background: #4285f4;
                transition: width 0.3s;
            }
            .section-label {
                position: fixed; top: 30px; left: 30px;
                background: rgba(66, 133, 244, 0.2);
                color: #4285f4; padding: 10px 20px;
                border-radius: 8px; font-size: 14px;
            }
            .footer {
                position: fixed; bottom: 30px; right: 30px;
                color: #666; font-size: 14px;
            }
            .controls {
                position: fixed; bottom: 20px; left: 50%;
                transform: translateX(-50%);
                display: flex; gap: 10px;
            }
            .controls button {
                background: rgba(255,255,255,0.1);
                border: none; color: white; padding: 10px 20px;
                border-radius: 8px; cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="section-label" id="sectionLabel">Benvenuto</div>
        <div class="progress"><div class="progress-bar" id="progressBar" style="width: 5%"></div></div>
        
        <!-- Hero Slide -->
        <div class="slide active" data-section="hero" data-index="0">
            <span class="badge">Masterclass 2026</span>
            <h1>L'Ufficio Automatico</h1>
            <p>Google Workspace per PMI: Automazione, Pagamenti e Intelligenza Artificiale</p>
            <div style="margin-top: 40px; color: #4285f4; font-size: 18px;">Studio Marini Formazione • Aprile 2026</div>
        </div>
        
        <!-- Slide Presentazione -->
        <div class="slide" data-section="presentazione" data-index="1">
            <h2>L'Ufficio Automatico</h2>
            <p>Google Workspace per PMI — Automazione e AI</p>
            <div style="width: 150px; height: 4px; background: #ea4335; margin: 30px 0;"></div>
            <p style="font-size: 20px;">Studio Marini Formazione • Aprile 2026</p>
        </div>
        
        <!-- Chi Siamo -->
        <div class="slide" data-section="presentazione" data-index="2">
            <h2>Chi Siamo</h2>
            <p>Partners della Trasformazione</p>
            <ul style="list-style: none; padding: 0;">
                <li><i class="fas fa-check" style="color: #34a853;"></i> 15+ Anni di esperienza IT</li>
                <li><i class="fas fa-check" style="color: #34a853;"></i> 200+ Aziende digitalizzate</li>
                <li><i class="fas fa-check" style="color: #34a853;"></i> Focus su PMI e Artigianato</li>
            </ul>
        </div>
        
        <!-- L'Era dell'AI -->
        <div class="slide" data-section="presentazione" data-index="3">
            <h2>L'Era dell'AI</h2>
            <p>Gemini in Google Workspace</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
                <div style="background: #333; padding: 30px; border-radius: 16px;">
                    <h3 style="color: #4285f4;">Testo</h3>
                    <p style="font-size: 18px;">Sintesi email, bozze solleciti, verbali meet.</p>
                </div>
                <div style="background: #333; padding: 30px; border-radius: 16px;">
                    <h3 style="color: #4285f4;">Immagini</h3>
                    <p style="font-size: 18px;">Generazione asset per marketing e docs.</p>
                </div>
            </div>
        </div>
        
        <!-- Il Muro di Google -->
        <div class="slide" data-section="presentazione" data-index="4">
            <h2>Il Muro di Google</h2>
            <p>Cosa NON fa e come lo risolviamo</p>
            <ul style="color: #ea4335;">
                <li>Mancata integrazione TeamSystem</li>
                <li>Zero tracking ore tecnici</li>
                <li>No WhatsApp Automation</li>
            </ul>
            <p style="margin-top: 30px; color: #34a853; font-size: 24px;">✓ Risolto con App Proprietaria Studio Marini</p>
        </div>
        
        <!-- Moduli -->
        <div class="slide" data-section="moduli" data-index="5">
            <h2>I Moduli del Corso</h2>
            <div style="text-align: left; max-width: 800px;">
                <p><strong style="color: #4285f4;">Corso Base (4h):</strong> L'Ufficio Automatico</p>
                <p><strong style="color: #4285f4;">Modulo 1 (2h):</strong> Booking & Pagamenti Digitali</p>
                <p><strong style="color: #4285f4;">Modulo 2 (2h):</strong> Segreteria AI: Posta e Riunioni</p>
                <p><strong style="color: #4285f4;">Modulo 3 (2h):</strong> La Fabbrica dei Documenti</p>
            </div>
        </div>
        
        <!-- Lab Pratici -->
        <div class="slide" data-section="laboratori" data-index="6">
            <h2>Laboratori Pratici</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; max-width: 900px;">
                <div><strong>Lab 1:</strong> Configura il Tuo Agenda</div>
                <div><strong>Lab 2:</strong> Crea i Tuoi Servizi</div>
                <div><strong>Lab 3:</strong> Collega Stripe</div>
                <div><strong>Lab 4:</strong> Scrivi Email AI</div>
                <div><strong>Lab 5:</strong> Riunione Trascritta</div>
                <div><strong>Lab 6:</strong> Genera Documenti</div>
            </div>
        </div>
        
        <!-- AI Lab -->
        <div class="slide" data-section="ai-lab" data-index="7">
            <h2>AI Lab - Laboratorio Operativo</h2>
            <p>Sperimenta i prompt AI in tempo reale</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; max-width: 800px;">
                <div style="background: #333; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #4285f4;">Gemini 2.0 Flash</h3>
                    <p>Generazione testi professionali</p>
                </div>
                <div style="background: #333; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #34a853;">Imagen 3.0</h3>
                    <p>Generazione immagini e asset</p>
                </div>
            </div>
        </div>
        
        <!-- Prompt Library -->
        <div class="slide" data-section="prompt" data-index="8">
            <h2>Prompt Library</h2>
            <p>6 prompt pronti da usare</p>
            <ul style="text-align: left; max-width: 600px; font-size: 20px;">
                <li>📝 Risposta Reclamo Cliente</li>
                <li>💼 Email Preventivo</li>
                <li>📋 Estrai Decisioni da Trascrizione</li>
                <li>📄 Estrai da PDF</li>
                <li>⚖️ Semplifica Testo Legale</li>
                <li>📚 Genera Manuale Operativo</li>
            </ul>
        </div>
        
        <!-- Roadmap -->
        <div class="slide" data-section="roadmap" data-index="9">
            <h2>La tua Roadmap</h2>
            <p>Traccia il tuo percorso formativo</p>
            <ul style="text-align: left; max-width: 600px; font-size: 20px;">
                <li>✓ Configura Agenda</li>
                <li>✓ Crea Listino Servizi</li>
                <li>✓ Collega Stripe</li>
                <li>✓ Prompt Reclamo</li>
                <li>✓ Estrai Decisioni</li>
                <li>✓ Analisi PDF</li>
            </ul>
        </div>
        
        <!-- Risorse -->
        <div class="slide" data-section="risorse" data-index="10">
            <h2>Risorse & Link Utili</h2>
            <div style="display: flex; gap: 40px; margin-top: 30px;">
                <div style="text-align: center;">
                    <i class="fab fa-google" style="font-size: 60px; color: #4285f4;"></i>
                    <p>Google Workspace</p>
                </div>
                <div style="text-align: center;">
                    <i class="fab fa-stripe" style="font-size: 60px; color: #635bff;"></i>
                    <p>Stripe</p>
                </div>
                <div style="text-align: center;">
                    <i class="fas fa-file-pdf" style="font-size: 60px; color: #ea4335;"></i>
                    <p>Manuale Corso</p>
                </div>
            </div>
        </div>
        
        <div class="footer">© 2026 Studio Marini Formazione</div>
        
        <div class="controls">
            <button onclick="goSlide(-1)">◀</button>
            <button onclick="toggleFS()">Fullscreen</button>
            <button onclick="goSlide(1)">▶</button>
        </div>
        
        <script>
            const slides = document.querySelectorAll('.slide');
            const sectionLabel = document.getElementById('sectionLabel');
            const progressBar = document.getElementById('progressBar');
            let currentSlide = 0;
            const channel = new BroadcastChannel('studio_marini_presentation');
            
            function showSlide(index) {
                slides.forEach((s, i) => s.classList.toggle('active', i === index));
                currentSlide = index;
                
                const section = slides[index].dataset.section;
                const labels = {
                    'hero': 'Benvenuto',
                    'presentazione': 'Presentazione',
                    'moduli': 'I Moduli',
                    'laboratori': 'Laboratori Pratici',
                    'ai-lab': 'AI Lab',
                    'prompt': 'Prompt Library',
                    'roadmap': 'Roadmap',
                    'risorse': 'Risorse'
                };
                sectionLabel.textContent = labels[section] || 'Corso';
                progressBar.style.width = ((index + 1) / slides.length * 100) + '%';
            }
            
            function goSlide(dir) {
                currentSlide = (currentSlide + dir + slides.length) % slides.length;
                showSlide(currentSlide);
                channel.postMessage({action: 'sync', index: currentSlide});
            }
            
            function toggleFS() {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
            
            channel.onmessage = (e) => {
                if (e.data.action === 'sync') {
                    showSlide(e.data.index);
                }
            };
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === ' ') goSlide(1);
                if (e.key === 'ArrowLeft') goSlide(-1);
                if (e.key === 'f') toggleFS();
            });
            
            showSlide(0);
        </script>
    </body>
    </html>
    `;
    
    window.presentationWin.document.write(presentationHTML);
    window.presentationWin.document.close();
    
    setTimeout(() => {
        try { window.presentationWin.focus(); } catch(e) {}
    }, 1000);
}

export function syncPresentation(index) {
    if (window.presentationWin && !window.presentationWin.closed) {
        const channel = new BroadcastChannel('studio_marini_presentation');
        channel.postMessage({action: 'sync', index: index});
    }
}

export function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const clickedBtn = document.querySelector('[onclick="openTab(\'' + tabId + '\')"]');
    if (clickedBtn) clickedBtn.classList.add('active');
    
    document.getElementById(tabId).scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    const sectionMap = {
        'corso-base': 5,
        'modulo-1': 5,
        'modulo-2': 5,
        'modulo-3': 5
    };
    
    if (sectionMap[tabId] !== undefined) {
        syncPresentation(sectionMap[tabId]);
    }
}

export function initApp() {
    loadChecklist();
    loadWall();
}
