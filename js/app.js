let user = { uid: 'local-user' };

const STORAGE_KEYS = {
    checklist: 'studio_marini_checklist',
    history: 'studio_marini_history'
};

export function initAuth(callback) {
    document.getElementById('loadingOverlay').style.display = 'none';
    callback();
}

export function getUser() { return user; }
export function getAppId() { return 'local'; }

let currentSlide = 0;
const slides = document.querySelectorAll('.slide-content');
const counter = document.getElementById('slideCounter');

export function changeSlide(dir) {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    counter.innerText = `Slide ${currentSlide + 1} / ${slides.length}`;
}

export function toggleFullscreen() {
    const viewer = document.getElementById('viewer');
    const btn = viewer?.querySelector('.fullscreen-btn');
    if (!document.fullscreenElement) {
        viewer?.requestFullscreen();
        if (btn) btn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        document.exitFullscreen();
        if (btn) btn.innerHTML = '<i class="fas fa-expand"></i>';
    }
}

document.addEventListener('fullscreenchange', () => {
    const viewer = document.getElementById('viewer');
    const btn = viewer?.querySelector('.fullscreen-btn');
    if (!document.fullscreenElement && btn) {
        btn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === ' ') changeSlide(1);
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 'p' || e.key === 'P') togglePresenterMode();
});

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
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
    const btn = document.querySelector('[onclick="openTab(\'' + tabId + '\')"]');
    if (btn) btn.classList.add('active');
    document.getElementById(tabId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    const sectionMap = { 'corso-base': 5, 'modulo-1': 5, 'modulo-2': 5, 'modulo-3': 5 };
    if (sectionMap[tabId] !== undefined) syncPresentation(sectionMap[tabId]);
}

export function syncPresentation(index) {
    if (window.presentationWin && !window.presentationWin.closed) {
        new BroadcastChannel('studio_marini_presentation').postMessage({action: 'sync', index});
    }
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
        div.innerHTML = `<input type="checkbox" id="${item.id}" ${data[item.id] ? 'checked' : ''} onchange="syncCheck('${item.id}', this.checked)"> <label for="${item.id}">${item.label}</label>`;
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
    wall.innerHTML = history.length ? '' : '<p style="color:#666; grid-column:1/-1; text-align:center;">I tuoi prompt appariranno qui.</p>';
    history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '20px';
        card.innerHTML = `<div class="badge badge-ai" style="margin-bottom:10px;">${item.type}</div><p style="font-size:13px; font-weight:bold;">"${item.prompt.substring(0,50)}..."</p><div style="font-size:12px; color:#666; background:#f8f9fa; padding:10px; border-radius:10px;">${item.result.substring(0,150)}...</div>`;
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
    const prompt = document.getElementById('aiPrompt')?.value;
    const btn = document.getElementById('btnAi');
    const output = document.getElementById('aiOutput');
    if (!prompt || !btn || !output) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Elaborazione...';
    output.style.display = 'block';
    output.innerText = "Gemini sta scrivendo...";
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: "Sei l'assistente dello Studio Marini." }] } })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Errore.";
        output.innerText = text;
        saveHistory('Testo AI', prompt, text);
        loadWall();
    } catch (e) { output.innerText = "Errore di connessione."; }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Genera Bozza'; }
}

export async function generateImage() {
    const prompt = document.getElementById('imagePrompt')?.value;
    const btn = document.getElementById('btnImage');
    const img = document.getElementById('imageResult');
    if (!prompt || !btn || !img) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione...';
    img.style.display = 'none';
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
        });
        const data = await res.json();
        if (data.predictions?.[0]) {
            img.src = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            img.style.display = 'block';
            saveHistory('Immagine AI', prompt, 'Immagine generata');
            loadWall();
        }
    } catch (e) { alert("Errore generazione immagine."); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Genera Asset'; }
}

window.changeSlide = changeSlide;
window.openTab = openTab;
window.copyPrompt = copyPrompt;
window.syncCheck = syncCheck;
window.generateAiText = generateAiText;
window.generateImage = generateImage;
window.toggleFullscreen = toggleFullscreen;
window.startPresentation = startPresentation;

export function startPresentation() {
    if (window.presentationWin && !window.presentationWin.closed) {
        window.presentationWin.focus();
        return;
    }
    window.presentationWin = window.open('', 'PresentazioneCompleta', 'width=1280,height=720');
    window.presentationWin.document.write(getPresentationHTML());
    window.presentationWin.document.close();
    setTimeout(() => { try { window.presentationWin.focus(); } catch(e) {} }, 1000);
}

function getPresentationHTML() {
    return `<!DOCTYPE html><html><head><title>Presentazione Corso</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#1a1a1a;color:white;overflow:hidden}.slide{display:none;flex-direction:column;justify-content:center;align-items:center;height:100vh;padding:60px;text-align:center}.slide.active{display:flex}.slide h1{font-size:56px;color:#4285f4;margin-bottom:20px}.slide h2{font-size:48px;color:#4285f4;margin-bottom:30px}.slide p{font-size:28px;color:#9aa0a6;margin-bottom:20px}.slide ul{font-size:24px;color:#bdc1c6;text-align:left;margin:20px 0}.badge{background:#e8f0fe;color:#4285f4;padding:8px 20px;border-radius:50px;font-size:16px;font-weight:700}.progress{position:fixed;bottom:0;left:0;right:0;height:6px;background:#333}.progress-bar{height:100%;background:#4285f4;transition:width .3s}.section-label{position:fixed;top:30px;left:30px;background:rgba(66,133,244,.2);color:#4285f4;padding:10px 20px;border-radius:8px;font-size:14px}.footer{position:fixed;bottom:30px;right:30px;color:#666;font-size:14px}</style></head><body><div class="section-label" id="sectionLabel">Benvenuto</div><div class="progress"><div class="progress-bar" id="progressBar" style="width:5%"></div></div><div class="slide active" data-section="hero" data-index="0"><span class="badge">Masterclass 2026</span><h1>L'Ufficio Automatico</h1><p>Google Workspace per PMI: Automazione, Pagamenti e AI</p><div style="margin-top:40px;color:#4285f4;font-size:18px;">Studio Marini Formazione • Aprile 2026</div></div><div class="slide" data-section="presentazione" data-index="1"><h2>L'Ufficio Automatico</h2><p>Google Workspace per PMI — Automazione e AI</p></div><div class="slide" data-section="moduli" data-index="2"><h2>I Moduli del Corso</h2><div style="text-align:left;max-width:800px"><p><strong style="color:#4285f4">Corso Base (4h):</strong> L'Ufficio Automatico</p><p><strong style="color:#4285f4">Modulo 1 (2h):</strong> Booking & Pagamenti Digitali</p><p><strong style="color:#4285f4">Modulo 2 (2h):</strong> Segreteria AI</p><p><strong style="color:#4285f4">Modulo 3 (2h):</strong> La Fabbrica dei Documenti</p></div></div><div class="slide" data-section="laboratori" data-index="3"><h2>Laboratori Pratici</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:left;max-width:900px"><div><strong>Lab 1:</strong> Configura Agenda</div><div><strong>Lab 2:</strong> Crea Servizi</div><div><strong>Lab 3:</strong> Collega Stripe</div><div><strong>Lab 4:</strong> Email AI</div><div><strong>Lab 5:</strong> Riunione Trascritta</div><div><strong>Lab 6:</strong> Genera Documenti</div></div></div><div class="slide" data-section="ai-lab" data-index="4"><h2>AI Lab - Laboratorio Operativo</h2><p>Sperimenta i prompt AI in tempo reale</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:30px;max-width:800px"><div style="background:#333;padding:25px;border-radius:16px"><h3 style="color:#4285f4">Gemini 2.0 Flash</h3><p>Generazione testi</p></div><div style="background:#333;padding:25px;border-radius:16px"><h3 style="color:#34a853">Imagen 3.0</h3><p>Generazione immagini</p></div></div></div><div class="slide" data-section="prompt" data-index="5"><h2>Prompt Library</h2><p>6 prompt pronti da usare</p><ul style="text-align:left;max-width:600px;font-size:20px"><li>📝 Risposta Reclamo</li><li>💼 Email Preventivo</li><li>📋 Estrai Decisioni</li><li>📄 Estrai da PDF</li><li>⚖️ Semplifica Legale</li><li>📚 Genera Manuale</li></ul></div><div class="slide" data-section="roadmap" data-index="6"><h2>La tua Roadmap</h2><p>Traccia il tuo percorso formativo</p><ul style="text-align:left;max-width:600px;font-size:20px"><li>✓ Configura Agenda</li><li>✓ Crea Listino</li><li>✓ Collega Stripe</li><li>✓ Prompt Reclamo</li><li>✓ Estrai Decisioni</li><li>✓ Analisi PDF</li></ul></div><div class="slide" data-section="risorse" data-index="7"><h2>Risorse & Link Utili</h2><div style="display:flex;gap:40px;margin-top:30px"><div style="text-align:center"><i class="fab fa-google" style="font-size:60px;color:#4285f4"></i><p>Google Workspace</p></div><div style="text-align:center"><i class="fab fa-stripe" style="font-size:60px;color:#635bff"></i><p>Stripe</p></div><div style="text-align:center"><i class="fas fa-file-pdf" style="font-size:60px;color:#ea4335"></i><p>Manuale Corso</p></div></div></div><div class="footer">© 2026 Studio Marini Formazione</div><script>const slides=document.querySelectorAll('.slide');const sectionLabel=document.getElementById('sectionLabel');const progressBar=document.getElementById('progressBar');let currentSlide=0;const channel=new BroadcastChannel('studio_marini_presentation');function showSlide(index){slides.forEach((s,i)=>s.classList.toggle('active',i===index));currentSlide=index;const section=slides[index].dataset.section;const labels={'hero':'Benvenuto','presentazione':'Presentazione','moduli':'I Moduli','laboratori':'Laboratori','ai-lab':'AI Lab','prompt':'Prompt','roadmap':'Roadmap','risorse':'Risorse'};sectionLabel.textContent=labels[section]||'Corso';progressBar.style.width=((index+1)/slides.length*100)+'%'}function goSlide(dir){currentSlide=(currentSlide+dir+slides.length)%slides.length;showSlide(currentSlide);channel.postMessage({action:'sync',index:currentSlide})}channel.onmessage=(e)=>{if(e.data.action==='sync')showSlide(e.data.index)};document.addEventListener('keydown',(e)=>{if(e.key==='ArrowRight'||e.key===' ')goSlide(1);if(e.key==='ArrowLeft')goSlide(-1)});showSlide(0);<\/script></body></html>`;
}

export function initApp() {
    loadChecklist();
    loadWall();
}