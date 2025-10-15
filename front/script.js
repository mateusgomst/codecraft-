// Configuração da API
const API_URL = 'http://localhost:5001/api';

// Smooth scroll
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Image Comparison Slider
function initImageComparisonStatic() {
    const imageComparison = document.getElementById('imageComparisonStatic');
    const slider = document.getElementById('comparisonSliderStatic');
    const processed = imageComparison?.querySelector('.processed');

    if (!imageComparison || !slider || !processed) {
        console.log('Comparador estático não encontrado');
        return;
    }

    let isDragging = false;

    function updateSliderPosition(clientX) {
        const rect = imageComparison.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = (x / rect.width) * 100;

        if (percentage >= 0 && percentage <= 100) {
            slider.style.left = percentage + '%';
            processed.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
        }
    }

    slider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSliderPosition(e.clientX);
    });

    // Touch events for mobile
    slider.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        updateSliderPosition(e.touches[0].clientX);
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        updateSliderPosition(e.touches[0].clientX);
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Initialize position
    slider.style.left = '50%';
    processed.style.clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
}

// File Upload System
function initDemo() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadContent = document.getElementById('uploadContent');
    const processingContent = document.getElementById('processingContent');
    const resultContent = document.getElementById('resultContent');
    const fileInput = document.getElementById('fileInput');

    if (!uploadArea || !uploadContent || !processingContent || !resultContent || !fileInput) {
        console.error('Elementos da demo não encontrados');
        return;
    }

    // File input change handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.nc')) {
            handleFile(files[0]);
        } else {
            alert('Por favor, envie um arquivo NetCDF (.nc)');
        }
    });

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea || e.target.classList.contains('upload-content')) {
            fileInput.click();
        }
    });
}

async function handleFile(file) {
    console.log('Arquivo selecionado:', file.name, (file.size / (1024 * 1024)).toFixed(2), 'MB');

    if (!file.name.endsWith('.nc')) {
        alert('Por favor, envie um arquivo NetCDF (.nc)');
        return;
    }

    try {
        // Verificar se o backend está rodando
        await fetch(`${API_URL}/status`);
        // Se chegou aqui, backend está online
        await uploadFile(file);
    } catch (error) {
        console.log('Backend offline, usando modo demonstração');
        simulateProcessing(file);
    }
}

async function uploadFile(file) {
    const uploadContent = document.getElementById('uploadContent');
    const processingContent = document.getElementById('processingContent');

    // Mostrar tela de processamento
    uploadContent.style.display = 'none';
    processingContent.style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Fazer upload
        const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Erro no upload do arquivo');
        }

        // Monitorar progresso
        await monitorProgress();

    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao processar arquivo. Usando modo demonstração.');
        simulateProcessing(file);
    }
}

async function monitorProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {

            try {
                const statusResponse = await fetch(`${API_URL}/status`);
                const status = await statusResponse.json();

                console.log(`Progresso: ${status.progress}%`);

                // Atualizar interface
                progressFill.style.width = `${status.progress}%`;
                progressText.textContent = status.current_step || 'Processando...';

                // Atualizar steps
                updateProcessingSteps(status.progress);

                // Verificar se terminou
                if (status.progress >= 100 && status.results) {
                    clearInterval(interval);
                    showRealResults(status.results);
                    resolve(status.results);
                }

                // Verificar erro
                if (status.error) {
                    clearInterval(interval);
                    throw new Error(status.error);
                }

            } catch (error) {
                clearInterval(interval);
                console.error('Erro ao monitorar progresso:', error);
                resetDemo();
                reject(error);
            }
        }, 1000);
    });
}

function updateProcessingSteps(progress) {
    if (progress >= 20) {
        document.getElementById('step2').innerHTML = '✓ Processando 285 bandas...';
    }
    if (progress >= 40) {
        document.getElementById('step3').innerHTML = '✓ Aplicando modelo...';
    }
    if (progress >= 80) {
        document.getElementById('step4').innerHTML = '✓ Gerando mapa de anomalias...';
    }
}

function showRealResults(results) {
    const processingContent = document.getElementById('processingContent');
    const resultContent = document.getElementById('resultContent');

    processingContent.style.display = 'none';
    resultContent.style.display = 'block';

    // Atualizar estatísticas com dados reais
    document.getElementById('highRisk').textContent = results.high_risk + '%';
    document.getElementById('mediumRisk').textContent = results.medium_risk + '%';
    document.getElementById('lowRisk').textContent = results.low_risk + '%';

    // Feedback
    alert('✅ Processamento real concluído com sucesso!');
}

// Demonstração simulada (fallback)
function simulateProcessing(file) {
    const uploadContent = document.getElementById('uploadContent');
    const processingContent = document.getElementById('processingContent');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    uploadContent.style.display = 'none';
    processingContent.style.display = 'block';

    let progress = 0;
    const steps = [
        'Carregando dados hiperespectrais...',
        'Processando 285 bandas espectrais...',
        'Aplicando modelo de deep learning...',
        'Gerando mapa de anomalias...',
        'Finalizando análise...'
    ];

    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        progressFill.style.width = `${progress}%`;

        // Update step text based on progress
        if (progress < 20) {
            progressText.textContent = steps[0];
            updateStep(1);
        } else if (progress < 40) {
            progressText.textContent = steps[1];
            updateStep(2);
        } else if (progress < 60) {
            progressText.textContent = steps[2];
            updateStep(3);
        } else if (progress < 80) {
            progressText.textContent = steps[3];
            updateStep(4);
        } else {
            progressText.textContent = steps[4];
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(showSimulatedResults, 1000);
        }
    }, 300);
}

function updateStep(stepNumber) {
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            if (i < stepNumber) {
                step.innerHTML = '✓ ' + step.textContent.replace('⏳ ', '').replace('✓ ', '');
            } else if (i === stepNumber) {
                step.innerHTML = '⏳ ' + step.textContent.replace('⏳ ', '').replace('✓ ', '');
            }
        }
    }
}

function showSimulatedResults() {
    const processingContent = document.getElementById('processingContent');
    const resultContent = document.getElementById('resultContent');

    processingContent.style.display = 'none';
    resultContent.style.display = 'block';

    // Generate random results for demo
    const highRisk = (Math.random() * 5 + 1).toFixed(1);
    const mediumRisk = (Math.random() * 10 + 5).toFixed(1);
    const lowRisk = (100 - parseFloat(highRisk) - parseFloat(mediumRisk)).toFixed(1);

    document.getElementById('highRisk').textContent = highRisk + '%';
    document.getElementById('mediumRisk').textContent = mediumRisk + '%';
    document.getElementById('lowRisk').textContent = lowRisk + '%';
}

async function downloadResults() {
    try {
        // Tentar baixar resultados reais primeiro
        const statusResponse = await fetch(`${API_URL}/status`);
        const status = await statusResponse.json();

        if (status.results) {
            // Download dos arquivos gerados
            const files = [
                { name: status.results.rgb_file, url: `${API_URL}/download/${status.results.rgb_file}` },
                { name: status.results.map_file, url: `${API_URL}/download/${status.results.map_file}` }
            ];

            files.forEach((file, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = file.url;
                    link.download = file.name;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 500);
            });

            showDownloadFeedback('✅ Downloads dos resultados reais iniciados!');
        } else {
            downloadSampleImages();
        }
    } catch (error) {
        downloadSampleImages();
    }
}

function downloadSampleImages() {
    const images = [
        { name: 'imagem_rgb_visivel.png', url: 'imagem_rgb_visivel.png' },
        { name: 'mapa_anomalia_visual_refinado.png', url: 'mapa_anomalia_visual_refinado.png' }
    ];

    images.forEach((image, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = image.name;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 500);
    });

    showDownloadFeedback('✅ Downloads das imagens de exemplo iniciados!');
}

function showDownloadFeedback(message) {
    const downloadButton = document.querySelector('.download-button');
    const originalText = downloadButton.innerHTML;
    downloadButton.innerHTML = message;
    downloadButton.disabled = true;

    setTimeout(() => {
        downloadButton.innerHTML = originalText;
        downloadButton.disabled = false;
    }, 3000);
}

function resetDemo() {
    const uploadContent = document.getElementById('uploadContent');
    const processingContent = document.getElementById('processingContent');
    const resultContent = document.getElementById('resultContent');
    const fileInput = document.getElementById('fileInput');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Reset displays
    resultContent.style.display = 'none';
    processingContent.style.display = 'none';
    uploadContent.style.display = 'block';
    fileInput.value = '';

    // Reset progress
    progressFill.style.width = '0%';
    progressText.textContent = 'Carregando dados hiperespectrais...';

    // Reset steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.innerHTML = step.textContent.replace('✓ ', '⏳ ');
        }
    }
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(6, 78, 59, 1)';
        } else {
            navbar.style.background = 'rgba(6, 78, 59, 0.95)';
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando CO₂Vision...');

    initImageComparisonStatic();
    initDemo();
    initNavbarScroll();

    // Testar conexão com backend
    checkBackendStatus();

    // Animações
    initAnimations();

    console.log('✅ CO₂Vision inicializado com sucesso!');
});

async function checkBackendStatus() {
        console.log('Modo demonstração ativo');
    
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements to animate
    document.querySelectorAll('.identification-card, .diff-card, .info-step').forEach(el => {
        observer.observe(el);
    });
}