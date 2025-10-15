// Smooth scroll
function smoothScroll(target) {
    document.querySelector(target).scrollIntoView({
        behavior: 'smooth'
    });
}

// Configuração da API - PORTA ATUALIZADA PARA 5001
const API_URL = 'http://localhost:5001/api';

// File Upload Demo
const fileInput = document.getElementById('fileInput');
const uploadContent = document.getElementById('uploadContent');
const processingContent = document.getElementById('processingContent');
const resultContent = document.getElementById('resultContent');
const uploadArea = document.getElementById('uploadArea');

// Verificar se elementos existem
if (!fileInput || !uploadContent || !processingContent || !resultContent || !uploadArea) {
    console.error('Elementos HTML não encontrados. Verifique o index.html');
}

// Image Comparison Slider - Inicialização segura
function initImageComparison() {
    const imageComparison = document.getElementById('imageComparison');
    const slider = document.getElementById('comparisonSlider');
    const processed = imageComparison?.querySelector('.processed');
    
    if (!imageComparison || !slider || !processed) {
        console.log('Comparador de imagens não encontrado, será inicializado após upload');
        return;
    }
    
    let isDragging = false;
    
    // Limpar eventos anteriores
    const newSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(newSlider, slider);
    
    newSlider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const rect = imageComparison.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        
        if (percentage >= 0 && percentage <= 100) {
            newSlider.style.left = percentage + '%';
            processed.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
        }
    });
    
    console.log('Comparador de imagens inicializado');
}

// Image Comparison Slider - Inicialização segura para seção estática
function initImageComparisonStatic() {
    const imageComparison = document.getElementById('imageComparisonStatic');
    const slider = document.getElementById('comparisonSliderStatic');
    const processed = imageComparison?.querySelector('.processed');
    
    if (!imageComparison || !slider || !processed) {
        console.log('Comparador estático não encontrado');
        return;
    }
    
    let isDragging = false;
    
    slider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const rect = imageComparison.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        
        if (percentage >= 0 && percentage <= 100) {
            slider.style.left = percentage + '%';
            processed.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
        }
    });
    
    console.log('Comparador estático inicializado');
}

// Inicializar comparador ao carregar página (se existir)
document.addEventListener('DOMContentLoaded', () => {
    initImageComparison();
    initImageComparisonStatic(); // Inicializar o comparador de exemplo
});

// Drag and drop
if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#059669';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#e5e7eb';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e5e7eb';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

function handleFile(file) {
    console.log('Arquivo selecionado:', file.name, file.size, 'bytes');
    
    if (!file.name.endsWith('.nc')) {
        alert('Por favor, envie um arquivo NetCDF (.nc)');
        return;
    }
    
    // Verificar se já está processando
    fetch(`${API_URL}/status`)
        .then(res => {
            if (!res.ok) throw new Error('Servidor não responde');
            return res.json();
        })
        .then(status => {
            if (status.is_processing) {
                alert('Já existe um processamento em andamento. Aguarde...');
                return;
            }
            uploadFile(file);
        })
        .catch(err => {
            console.error('Erro ao verificar status:', err);
            alert('Erro ao conectar com o servidor.\n\nVerifique se o backend está rodando:\ncd backend\npython3 app.py');
        });
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Mostrar tela de processamento
    if (uploadContent) uploadContent.style.display = 'none';
    if (processingContent) processingContent.style.display = 'block';
    
    // Mostrar tamanho do arquivo
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`Enviando arquivo: ${file.name} (${fileSizeMB} MB)`);
    
    // Enviar arquivo
    fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(res => {
        console.log('Resposta do servidor:', res.status);
        // Verificar se a resposta é JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Erro do servidor: ${res.status} - Resposta não é JSON`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Dados recebidos:', data);
        if (data.error) {
            throw new Error(data.error);
        }
        console.log('Upload bem-sucedido, iniciando monitoramento...');
        // Iniciar monitoramento do progresso
        monitorProgress();
    })
    .catch(err => {
        console.error('Erro no upload:', err);
        let errorMsg = 'Erro ao enviar arquivo: ' + err.message;
        
        // Mensagens mais específicas
        if (err.message.includes('413') || err.message.includes('muito grande')) {
            errorMsg = 'Arquivo muito grande! Máximo: 2GB\n\nTamanho do seu arquivo: ' + fileSizeMB + ' MB';
        } else if (err.message.includes('Failed to fetch')) {
            errorMsg = 'Erro ao conectar com o servidor.\n\nVerifique se o backend está rodando:\n\ncd backend\npython3 app.py';
        }
        
        alert(errorMsg);
        resetDemo();
    });
}

function monitorProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    let checkCount = 0;
    const maxChecks = 600; // 10 minutos máximo (600 segundos)
    
    const interval = setInterval(() => {
        checkCount++;
        
        if (checkCount > maxChecks) {
            clearInterval(interval);
            alert('Tempo limite excedido. O processamento pode ter falhado.');
            resetDemo();
            return;
        }
        
        fetch(`${API_URL}/status`)
            .then(res => res.json())
            .then(status => {
                console.log(`Progresso: ${status.progress}% - ${status.current_step}`);
                
                // Atualizar barra de progresso
                if (progressFill) progressFill.style.width = status.progress + '%';
                if (progressText) progressText.textContent = status.current_step;
                
                // Atualizar steps
                if (status.progress >= 20) {
                    const step2 = document.getElementById('step2');
                    if (step2) step2.innerHTML = '✓ Processando 285 bandas...';
                }
                if (status.progress >= 40) {
                    const step3 = document.getElementById('step3');
                    if (step3) step3.innerHTML = '✓ Aplicando modelo...';
                }
                if (status.progress >= 80) {
                    const step4 = document.getElementById('step4');
                    if (step4) step4.innerHTML = '✓ Gerando mapa de anomalias...';
                }
                
                // Verificar se terminou
                if (status.progress >= 100 && status.results) {
                    console.log('Processamento concluído!', status.results);
                    clearInterval(interval);
                    showResults(status.results);
                }
                
                // Verificar erro
                if (status.error) {
                    console.error('Erro no processamento:', status.error);
                    clearInterval(interval);
                    alert('Erro no processamento: ' + status.error);
                    resetDemo();
                }
            })
            .catch(err => {
                console.error('Erro ao obter status:', err);
                clearInterval(interval);
                alert('Erro ao monitorar processamento');
                resetDemo();
            });
    }, 1000); // Verificar a cada 1 segundo
}

function showResults(results) {
    console.log('Mostrando resultados:', results);
    
    if (processingContent) processingContent.style.display = 'none';
    if (resultContent) resultContent.style.display = 'block';
    
    // Atualizar estatísticas NO CARD DE RESULTADOS (demo)
    const highRisk = document.getElementById('highRisk');
    const mediumRisk = document.getElementById('mediumRisk');
    const lowRisk = document.getElementById('lowRisk');
    
    if (highRisk) highRisk.textContent = results.high_risk + '%';
    if (mediumRisk) mediumRisk.textContent = results.medium_risk + '%';
    if (lowRisk) lowRisk.textContent = results.low_risk + '%';
    
    // NOVO: Mostrar seção de resultados dedicada
    showResultsSection(results);
    
    // Configurar botões de download
    const downloadButton = document.querySelector('.download-button');
    if (downloadButton) {
        downloadButton.onclick = () => downloadResults(results);
    }
}

function showResultsSection(results) {
    console.log('Mostrando seção de resultados dedicada');
    
    // Mostrar seção de resultados
    const resultsSection = document.querySelector('.results');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    
    // Atualizar estatísticas na seção de resultados
    const resultHighRisk = document.getElementById('resultHighRisk');
    const resultMediumRisk = document.getElementById('resultMediumRisk');
    const resultLowRisk = document.getElementById('resultLowRisk');
    
    if (resultHighRisk) resultHighRisk.textContent = results.high_risk + '%';
    if (resultMediumRisk) resultMediumRisk.textContent = results.medium_risk + '%';
    if (resultLowRisk) resultLowRisk.textContent = results.low_risk + '%';
    
    // Carregar imagens no comparador de resultados
    loadResultImagesInNewSection(results);
    
    // Configurar botão de download na seção de resultados
    const downloadResultsBtn = document.getElementById('downloadResultsBtn');
    if (downloadResultsBtn) {
        downloadResultsBtn.onclick = () => downloadResults(results);
    }
    
    // Scroll suave até a seção de resultados
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

function loadResultImagesInNewSection(results) {
    console.log('Carregando imagens na seção de resultados');
    
    const comparisonContainer = document.getElementById('imageComparisonResults');
    
    if (!comparisonContainer) {
        console.error('Elemento #imageComparisonResults não encontrado');
        return;
    }
    
    // URL das imagens geradas
    const rgbUrl = `${API_URL}/preview/${results.rgb_file}?t=${Date.now()}`;
    const mapUrl = `${API_URL}/preview/${results.map_file}?t=${Date.now()}`;
    
    console.log('URLs das imagens:', { rgbUrl, mapUrl });
    
    // Substituir o placeholder por imagens reais
    comparisonContainer.innerHTML = `
        <div class="comparison-image original">
            <img src="${rgbUrl}" alt="Imagem RGB Original" onload="console.log('RGB carregada')" onerror="console.error('Erro ao carregar RGB')">
            <div class="image-label original-label">RGB Visível</div>
        </div>
        <div class="comparison-image processed">
            <img src="${mapUrl}" alt="Mapa de Anomalias" onload="console.log('Mapa carregado')" onerror="console.error('Erro ao carregar mapa')">
            <div class="image-label processed-label">Anomalias Detectadas</div>
        </div>
        <div class="comparison-slider" id="comparisonSliderResults">
            <div class="slider-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
        </div>
    `;
    
    // Reinicializar o comparador de imagens para a nova seção
    setTimeout(() => {
        initImageComparisonResults();
        console.log('Comparador de resultados inicializado');
    }, 100);
}

function initImageComparisonResults() {
    const imageComparison = document.getElementById('imageComparisonResults');
    const slider = document.getElementById('comparisonSliderResults');
    const processed = imageComparison?.querySelector('.processed');
    
    if (!imageComparison || !slider || !processed) {
        console.log('Comparador de resultados não encontrado');
        return;
    }
    
    let isDragging = false;
    
    // Limpar eventos anteriores
    const newSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(newSlider, slider);
    
    newSlider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const rect = imageComparison.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        
        if (percentage >= 0 && percentage <= 100) {
            newSlider.style.left = percentage + '%';
            processed.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
        }
    });
    
    console.log('Comparador de resultados inicializado com sucesso');
}

function scrollToDemo() {
    const demoSection = document.querySelector('.demo');
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function resetDemo() {
    console.log('Resetando demo');
    
    // Resetar no backend
    fetch(`${API_URL}/reset`, { method: 'POST' })
        .then(() => {
            if (resultContent) resultContent.style.display = 'none';
            if (processingContent) processingContent.style.display = 'none';
            if (uploadContent) uploadContent.style.display = 'block';
            if (fileInput) fileInput.value = '';
            
            // Esconder seção de resultados
            const resultsSection = document.querySelector('.results');
            if (resultsSection) resultsSection.style.display = 'none';
            
            // Reset processing steps
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const step2 = document.getElementById('step2');
            const step3 = document.getElementById('step3');
            const step4 = document.getElementById('step4');
            
            if (progressFill) progressFill.style.width = '0%';
            if (progressText) progressText.textContent = 'Carregando dados hiperespectrais...';
            if (step2) step2.innerHTML = '⏳ Processando 285 bandas...';
            if (step3) step3.innerHTML = '⏳ Aplicando modelo...';
            if (step4) step4.innerHTML = '⏳ Gerando mapa de anomalias...';
            
            // Scroll para demo
            scrollToDemo();
        })
        .catch(err => console.error('Erro ao resetar:', err));
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(6, 78, 59, 1)';
        } else {
            navbar.style.background = 'rgba(6, 78, 59, 0.95)';
        }
    }
});

// Debug: Log quando o script carregar
console.log('Script carregado. Backend URL:', API_URL);
console.log('Elementos encontrados:', {
    fileInput: !!fileInput,
    uploadArea: !!uploadArea,
    uploadContent: !!uploadContent,
    processingContent: !!processingContent,
    resultContent: !!resultContent
});

// REMOVER ESTA LINHA - ESTÁ CAUSANDO ERRO:
// window.addEventListener('load', () => {
//     loadSampleImages();
// });

function downloadResults(results) {
    console.log('Iniciando download dos resultados');
    
    // Array com os arquivos para download
    const arquivos = [
        {
            nome: results.rgb_file,
            url: `${API_URL}/download/${results.rgb_file}`,
            descricao: 'Imagem RGB Original'
        },
        {
            nome: results.map_file,
            url: `${API_URL}/download/${results.map_file}`,
            descricao: 'Mapa de Anomalias'
        }
    ];
    
    // Fazer download de cada arquivo com delay
    arquivos.forEach((arquivo, index) => {
        setTimeout(() => {
            console.log(`Baixando ${arquivo.descricao}: ${arquivo.nome}`);
            
            const link = document.createElement('a');
            link.href = arquivo.url;
            link.download = arquivo.nome;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`✅ Download iniciado: ${arquivo.nome}`);
        }, index * 1000); // 1 segundo de delay entre downloads
    });
    
    // Feedback visual
    const downloadButton = document.querySelector('.download-results-button') || 
                          document.querySelector('.download-button');
    
    if (downloadButton) {
        const originalText = downloadButton.innerHTML;
        downloadButton.innerHTML = '✅ Downloads Iniciados!';
        downloadButton.disabled = true;
        
        setTimeout(() => {
            downloadButton.innerHTML = originalText;
            downloadButton.disabled = false;
        }, 3000);
    }
    
    console.log('✅ Todos os downloads foram solicitados com sucesso!');
}
