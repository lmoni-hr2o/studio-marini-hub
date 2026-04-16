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

export function changeSlide(dir) {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    counter.innerText = `Slide ${currentSlide + 1} / ${slides.length}`;
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

export function initApp() {
    loadChecklist();
    loadWall();
}
