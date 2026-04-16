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
    
    if (window.presenterWindow && !window.presenterWindow.closed) {
        window.presenterWindow.postMessage({type: 'slideChange', index: currentSlide}, '*');
    }
    if (window.presentationWindow && !presentationWindow.closed) {
        window.presentationWindow.updateSlide(currentSlide);
    }
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
        if (window.presentationWindow) {
            window.presentationWindow.close();
            window.presentationWindow = null;
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
    
    // Open presentation window (fullscreen on external display if available)
    window.presentationWindow = window.open('', 'Presentation', 'width=800,height=600');
    
    const presentationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Presentazione - Studio Marini</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #202124; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .slide { width: 100%; height: 100%; padding: 60px; display: none; flex-direction: column; justify-content: center; color: white; }
            .slide.active { display: flex; }
            h2 { font-size: 64px; color: #4285f4; margin-bottom: 30px; }
            p { font-size: 32px; color: #9aa0a6; }
            ul { font-size: 28px; color: #bdc1c6; margin-top: 20px; }
            .logo { position: absolute; bottom: 30px; right: 30px; color: #4285f4; font-size: 24px; }
        </style>
    </head>
    <body>
        ${slideContents.map((s, i) => `
        <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">
            ${s.html}
        </div>
        `).join('')}
        <div class="logo">Studio Marini</div>
        <script>
            const slideEls = document.querySelectorAll('.slide');
            let currentSlide = 0;
            
            function showSlide(idx) {
                slideEls.forEach((s, i) => s.classList.toggle('active', i === idx));
            }
            
            window.updateSlide = function(idx) {
                currentSlide = idx;
                showSlide(idx);
            };
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === ' ') {
                    currentSlide = (currentSlide + 1) % slideEls.length;
                    showSlide(currentSlide);
                    window.opener?.postMessage({type: 'slideChange', index: currentSlide}, '*');
                }
                if (e.key === 'ArrowLeft') {
                    currentSlide = (currentSlide - 1 + slideEls.length) % slideEls.length;
                    showSlide(currentSlide);
                    window.opener?.postMessage({type: 'slideChange', index: currentSlide}, '*');
                }
            });
        </script>
    </body>
    </html>
    `;
    
    window.presentationWindow.document.write(presentationHTML);
    window.presentationWindow.document.close();
    
    // Try to fullscreen the presentation window
    setTimeout(() => {
        try {
            window.presentationWindow.focus();
        } catch(e) {}
    }, 500);
    
    // Open presenter view
    window.presenterWindow = window.open('', 'PresenterView', 'width=1200,height=900');
    
    const presenterHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Presenter View - Studio Marini</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', sans-serif; background: #1a1a1a; color: white; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .timer { font-size: 48px; font-weight: bold; color: #4285f4; }
            .timer.running { animation: pulse 2s infinite; }
            @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
            .info-bar { display: flex; gap: 20px; align-items: center; }
            .slide-counter { font-size: 24px; background: #333; padding: 10px 20px; border-radius: 8px; }
            .display-hint { background: #fbbc04; color: black; padding: 10px 15px; border-radius: 8px; font-size: 14px; }
            .slides-container { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 15px; margin-bottom: 15px; }
            .slide-box { background: #333; border-radius: 12px; padding: 12px; text-align: center; }
            .slide-box.current { border: 3px solid #4285f4; }
            .slide-box h4 { color: #888; margin-bottom: 8px; font-size: 12px; }
            .slide-preview { background: #202124; border-radius: 8px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; overflow: hidden; }
            .slide-preview.current { height: 180px; border: 2px solid #4285f4; }
            .slide-preview h2 { font-size: 12px; color: #4285f4; }
            .slide-preview p { font-size: 9px; color: #aaa; }
            .slide-preview .empty { color: #555; font-size: 11px; }
            .notes { background: #333; border-radius: 12px; padding: 15px; }
            .notes h4 { color: #888; margin-bottom: 8px; font-size: 12px; }
            .notes textarea { width: 100%; height: 70px; background: #222; border: none; color: white; padding: 10px; border-radius: 8px; font-size: 13px; resize: none; }
            .controls { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }
            .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; }
            .btn-prev { background: #ea4335; color: white; }
            .btn-next { background: #34a853; color: white; }
            .btn-timer { background: #fbbc04; color: black; }
            .btn-stop { background: #666; color: white; }
            .btn:hover { opacity: 0.9; }
            .fullscreen-hint { background: #222; border: 1px solid #444; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; color: #aaa; text-align: center; }
        </style>
    </head>
    <body>
        <div class="fullscreen-hint">
            <i class="fas fa-desktop"></i> Trascina la finestra "Presentazione" sullo schermo esterno e premi F per fullscreen
        </div>
        <div class="header">
            <div>
                <button class="btn btn-timer" onclick="toggleTimer()" id="timerBtn"><i class="fas fa-play"></i> Start</button>
            </div>
            <div class="info-bar">
                <span style="color:#888">Slide:</span>
                <div class="slide-counter"><span id="slideNum">1</span> / <span id="totalSlides">${slideContents.length}</span></div>
            </div>
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
            <textarea id="notes" placeholder="Scrivi le tue note qui..."></textarea>
        </div>
        <div class="controls">
            <button class="btn btn-prev" onclick="goPrev()"><i class="fas fa-arrow-left"></i> Precedente</button>
            <button class="btn btn-stop" onclick="window.close()"><i class="fas fa-stop"></i> Esci</button>
            <button class="btn btn-next" onclick="goNext()">Successiva <i class="fas fa-arrow-right"></i></button>
        </div>
        <script>
            const slideData = ${JSON.stringify(slideContents)};
            let currentSlide = 0;
            let timerInterval = null;
            let seconds = 0;
            let timerRunning = false;
            
            function updateView(curr, total) {
                document.getElementById('slideNum').textContent = curr;
                
                const prevIdx = curr - 2;
                const nextIdx = curr;
                
                document.getElementById('prevSlide').innerHTML = prevIdx >= 0 
                    ? '<h2>' + slideData[prevIdx].h2 + '</h2><p>' + (slideData[prevIdx].p || '').substring(0,40) + '</p>'
                    : '<span class="empty">Nessuna</span>';
                    
                document.getElementById('currentSlide').innerHTML = '<h2>' + slideData[curr-1].h2 + '</h2><p>' + (slideData[curr-1].p || '').substring(0,80) + '</p>';
                
                document.getElementById('nextSlide').innerHTML = nextIdx < slideData.length 
                    ? '<h2>' + slideData[nextIdx].h2 + '</h2><p>' + (slideData[nextIdx].p || '').substring(0,40) + '</p>'
                    : '<span class="empty">Nessuna</span>';
            }
            
            function goPrev() {
                currentSlide = (currentSlide - 1 + slideData.length) || slideData.length;
                updateView(currentSlide, slideData.length);
                window.presentationWindow?.updateSlide(currentSlide - 1);
            }
            
            function goNext() {
                currentSlide = (currentSlide % slideData.length) + 1;
                updateView(currentSlide, slideData.length);
                window.presentationWindow?.updateSlide(currentSlide - 1);
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
            
            window.addEventListener('message', (e) => {
                if (e.data?.type === 'slideChange') {
                    currentSlide = e.data.index + 1;
                    updateView(currentSlide, slideData.length);
                }
            });
            
            updateView(1, slideData.length);
        </script>
    </body>
    </html>
    `;
    
    window.presenterWindow.document.write(presenterHTML);
    window.presenterWindow.document.close();
    
    document.getElementById('presenterMode').textContent = 'Presentatore ON';
    document.getElementById('presenterMode').style.background = 'var(--g-green)';
}

export function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const clickedBtn = document.querySelector(`[onclick="openTab('${tabId}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');
    
    document.getElementById(tabId).scrollIntoView({ behavior: 'smooth', block: 'start' });
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

const checklistItems = [
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

export function initApp() {
    loadChecklist();
    loadWall();
}
