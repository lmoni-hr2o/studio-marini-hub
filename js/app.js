export function togglePresenterMode() {
    if (window.presenterWin && !window.presenterWin.closed) {
        window.presenterWin.close();
        window.presenterWin = null;
        if (window.presentationWin) {
            window.presentationWin.close();
            window.presentationWin = null;
        }
        return;
    }
    
    window.presentationWin = window.open('', 'Presentation', 'width=1024,height=768');
    
    const presentationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Presentazione Corso</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #1a1a1a; color: white; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
            
            .slide { 
                display: none; 
                flex-direction: column; 
                height: 100vh; 
                padding: 40px 60px;
            }
            .slide.active { display: flex; }
            
            .header-bar {
                position: fixed;
                top: 20px;
                left: 30px;
                right: 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                z-index: 100;
            }
            .section-label {
                background: rgba(66,133,244,0.2);
                color: #4285f4;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
            }
            .module-label {
                color: #888;
                font-size: 14px;
            }
            
            .slide-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                max-width: 1200px;
                margin: 0 auto;
                width: 100%;
            }
            
            .slide h1 {
                font-size: 56px;
                color: #4285f4;
                margin-bottom: 40px;
                font-family: 'Poppins', sans-serif;
            }
            .slide h2 {
                font-size: 48px;
                color: #4285f4;
                margin-bottom: 30px;
                font-family: 'Poppins', sans-serif;
            }
            .slide p {
                font-size: 28px;
                color: #9aa0a6;
                margin-bottom: 20px;
            }
            .slide ul {
                font-size: 26px;
                color: #bdc1c6;
                line-height: 1.8;
            }
            .slide li {
                margin-bottom: 15px;
            }
            
            .badge {
                display: inline-block;
                padding: 10px 25px;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 700;
                text-transform: uppercase;
                margin-bottom: 20px;
            }
            .badge-presentation { background: #e8f0fe; color: #4285f4; }
            .badge-lab { background: #e8f5e9; color: #34a853; }
            .badge-intro { background: rgba(66,133,244,0.2); color: #4285f4; }
            
            .lab-content {
                background: #2d2d2d;
                border-radius: 20px;
                padding: 40px;
                margin-top: 20px;
            }
            .lab-content h3 {
                color: #34a853;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .lab-content ol {
                font-size: 22px;
                color: #bdc1c6;
                padding-left: 30px;
            }
            .lab-content li {
                margin-bottom: 15px;
            }
            
            .tools-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-top: 30px;
            }
            .tool-card {
                background: #333;
                padding: 30px;
                border-radius: 16px;
                text-align: center;
            }
            .tool-card i {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .tool-card.blue i { color: #4285f4; }
            .tool-card.green i { color: #34a853; }
            
            .progress {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 6px;
                background: #333;
            }
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4285f4, #34a853);
                transition: width 0.5s ease;
            }
            
            .footer {
                position: fixed;
                bottom: 30px;
                right: 30px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header-bar">
            <div class="section-label" id="sectionLabel">Benvenuto</div>
            <div class="module-label" id="moduleLabel"></div>
        </div>
        
        <div class="progress"><div class="progress-bar" id="progressBar" style="width: 0%"></div></div>
        
        <!-- Slide 0: Intro -->
        <div class="slide active" id="slide-intro">
            <div class="slide-content" id="intro-content">
                <span class="badge badge-intro" id="intro-badge">Studio Marini</span>
                <h1 id="intro-title">L'Ufficio Automatico</h1>
                <p id="intro-subtitle">Google Workspace per PMI</p>
            </div>
        </div>
        
        <!-- Slide 1: Presentation -->
        <div class="slide" id="slide-presentation">
            <div class="slide-content" id="presentation-content">
                <span class="badge badge-presentation"><i class="fas fa-chalkboard-teacher"></i> Presentazione</span>
                <h1 id="presentation-title">Titolo Presentazione</h1>
                <div id="presentation-body"></div>
            </div>
        </div>
        
        <!-- Slide 2: Lab -->
        <div class="slide" id="slide-lab">
            <div class="slide-content" id="lab-content">
                <span class="badge badge-lab"><i class="fas fa-flask"></i> Laboratorio Pratico</span>
                <h1 id="lab-title">Titolo Laboratorio</h1>
                <div id="lab-body"></div>
            </div>
        </div>
        
        <!-- Slide 3: Tools -->
        <div class="slide" id="slide-tools">
            <div class="slide-content">
                <span class="badge badge-presentation"><i class="fas fa-tools"></i> Strumenti</span>
                <h1>Strumenti del Corso</h1>
                <div class="tools-grid">
                    <div class="tool-card blue">
                        <i class="fas fa-robot"></i>
                        <h3>AI Text Studio</h3>
                        <p>Generazione testi con Gemini</p>
                    </div>
                    <div class="tool-card green">
                        <i class="fas fa-image"></i>
                        <h3>AI Image Studio</h3>
                        <p>Generazione immagini con Imagen</p>
                    </div>
                    <div class="tool-card blue">
                        <i class="fas fa-copy"></i>
                        <h3>Prompt Library</h3>
                        <p>Prompt pronti da usare</p>
                    </div>
                    <div class="tool-card green">
                        <i class="fas fa-folder"></i>
                        <h3>Risorse</h3>
                        <p>Materiali del corso</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">Studio Marini Formazione</div>
        
        <script>
            const channel = new BroadcastChannel('studio_marini_presentation');
            
            function showSlide(index) {
                document.querySelectorAll('.slide').forEach((s, i) => {
                    s.classList.toggle('active', i === index);
                });
                document.getElementById('progressBar').style.width = ((index + 1) / 4 * 100) + '%';
            }
            
            channel.onmessage = (e) => {
                const data = e.data;
                
                document.getElementById('sectionLabel').textContent = data.label || 'Corso';
                document.getElementById('moduleLabel').textContent = data.module || '';
                
                if (data.type === 'intro' || data.type === undefined) {
                    if (data.title) document.getElementById('intro-title').textContent = data.title;
                    if (data.subtitle) document.getElementById('intro-subtitle').textContent = data.subtitle;
                    if (data.label) document.getElementById('intro-badge').textContent = data.label;
                    showSlide(0);
                }
                else if (data.type === 'presentation') {
                    document.getElementById('presentation-title').textContent = data.title || 'Presentazione';
                    document.getElementById('presentation-body').innerHTML = data.content || '<p>Contenuto della lezione...</p>';
                    showSlide(1);
                }
                else if (data.type === 'lab') {
                    document.getElementById('lab-title').textContent = data.title || 'Laboratorio';
                    document.getElementById('lab-body').innerHTML = data.content || '<p>Istruzioni del laboratorio...</p>';
                    showSlide(2);
                }
                else if (data.type === 'tool') {
                    showSlide(3);
                }
            };
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'f' && !document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                }
                if (e.key === 'Escape' && document.fullscreenElement) {
                    document.exitFullscreen();
                }
            });
            
            showSlide(0);
        </script>
    </body>
    </html>
    `;
    
    window.presentationWin.document.write(presentationHTML);
    window.presentationWin.document.close();
    
    setTimeout(() => { try { window.presentationWin.focus(); } catch(e) {} }, 1000);
}

export function startPresentation() {
    togglePresenterMode();
}

export function changeSlide(dir) {
    console.log('Slide change:', dir);
}

export function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

export function loadChecklist() {}
export function loadWall() {}

export async function generateAiText() {
    const prompt = document.getElementById('aiPrompt')?.value;
    const output = document.getElementById('aiOutput');
    if (!prompt || !output) return;
    output.style.display = 'block';
    output.innerText = "Gemini sta generando...";
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        output.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Errore";
    } catch (e) { output.innerText = "Errore di connessione"; }
}

export async function generateImage() {
    const prompt = document.getElementById('imagePrompt')?.value;
    const img = document.getElementById('imageResult');
    if (!prompt || !img) return;
    img.style.display = 'none';
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
        });
        const data = await res.json();
        if (data.predictions?.[0]) {
            img.src = 'data:image/png;base64,' + data.predictions[0].bytesBase64Encoded;
            img.style.display = 'block';
        }
    } catch (e) { alert("Errore"); }
}