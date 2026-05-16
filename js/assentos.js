
const PRECO_ASSENTO = 35.00;
const COLUNAS = 10;
let SESSAO_ID = window.SESSAO_ID || 0;
let QTD_ASSENTOS = window.SESSAO_QTDE_ASSENTOS || 60;
const SESSAO_FILME = document.body.dataset.sessaoFilme || '';
const SESSAO_SALA = document.body.dataset.sessaoSala || '';
const SESSAO_HORARIO = document.body.dataset.sessaoHorario || '';
const SESSAO_DATA = document.body.dataset.sessaoData || '';
const assentosSelecionados = new Set();

// Assentos indisponíveis (serão carregados dinamicamente)
let indisponiveis = new Set();

// Função para carregar assentos ocupados da API
async function carregarAssentosOcupados() {
    // Usar sessao_id da variável global ou o valor armazenado em localStorage
    const storedSessao = localStorage.getItem('sessaoSelecionada');
    const sessaoId = SESSAO_ID || (storedSessao ? parseInt(storedSessao, 10) : 0);

    if (!sessaoId) {
        console.error('Sessão não especificada');
        return;
    }

    try {
        const response = await fetch(`/api/assentos-ocupados/${sessaoId}`);
        const data = await response.json();
        indisponiveis = new Set(data.ocupados || []);
        gerarAssentos();
    } catch (error) {
        console.error('Erro ao carregar assentos ocupados:', error);
        // Fallback: gerar assentos sem dados dinâmicos
        gerarAssentos();
    }
}

function gerarAssentos() {
    const container = document.getElementById('assentosGrid');
    container.innerHTML = '';

    const totalAssentos = parseInt(QTD_ASSENTOS, 10) || 60;
    const numLinhas = Math.ceil(totalAssentos / COLUNAS);
    let assentosCriados = 0;

    for (let i = 0; i < numLinhas; i++) {
        const linha = String.fromCharCode(65 + i);
        const linhaDiv = document.createElement('div');
        linhaDiv.className = 'linha-assentos';

        for (let j = 1; j <= COLUNAS && assentosCriados < totalAssentos; j++) {
            const id = `${linha}${j}`;
            const assento = document.createElement('button');
            assento.className = 'assento';
            assento.textContent = id;
            assento.dataset.id = id;

            if (indisponiveis.has(id)) {
                assento.classList.add('indisponivel');
                assento.disabled = true;
            } else {
                assento.classList.add('disponivel');
                assento.addEventListener('click', toggleAssento);
            }

            linhaDiv.appendChild(assento);
            assentosCriados += 1;
        }

        container.appendChild(linhaDiv);
    }
}

function toggleAssento(event) {
    const assento = event.target;
    const id = assento.dataset.id;

    if (assentosSelecionados.has(id)) {
        assentosSelecionados.delete(id);
        assento.classList.remove('selecionado');
    } else {
        assentosSelecionados.add(id);
        assento.classList.add('selecionado');
    }

    atualizarResumo();
}

function atualizarResumo() {
    const listaAssentos = document.getElementById('listaAssentos');
    const qtdAssentos = document.getElementById('qtdAssentos');
    const precoTotal = document.getElementById('precoTotal');
    const btnComprar = document.getElementById('btnComprar');

    qtdAssentos.textContent = assentosSelecionados.size;

    if (assentosSelecionados.size === 0) {
        listaAssentos.innerHTML = '<p class="vazio">Nenhum assento selecionado</p>';
        precoTotal.textContent = 'R$ 0,00';
        btnComprar.disabled = true;
    } else {
        const assentosOrdenados = Array.from(assentosSelecionados).sort();
        listaAssentos.innerHTML = assentosOrdenados.map(a => `<span class="tag-assento">${a}</span>`).join('');
        
        const total = assentosSelecionados.size * PRECO_ASSENTO;
        precoTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        btnComprar.disabled = false;
    }
}

document.getElementById('btnComprar').addEventListener('click', function(event) {
    event.preventDefault();

    if (assentosSelecionados.size > 0) {
        const assentos = Array.from(assentosSelecionados).sort();
        const total = assentosSelecionados.size * PRECO_ASSENTO;

        // Preenche o modal
        document.getElementById('modalAssentos').textContent = assentos.join(', ');
        document.getElementById('modalTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Mostra o modal
        document.getElementById('modalConfirmacao').style.display = 'block';
    }
});

// Event listeners para o modal
document.getElementById('btnConfirmar').addEventListener('click', function() {
    // Fecha o modal
    document.getElementById('modalConfirmacao').style.display = 'none';

    // Salva dados no localStorage para a página de pagamento
    const assentos = Array.from(assentosSelecionados).sort();
    localStorage.setItem('assentosSelecionados', JSON.stringify(assentos));
    if (SESSAO_ID) {
        localStorage.setItem('sessaoSelecionada', SESSAO_ID);
    }
    if (SESSAO_FILME) localStorage.setItem('filmeSelecionado', SESSAO_FILME);
    if (SESSAO_SALA) localStorage.setItem('salaSelecionada', SESSAO_SALA);
    if (SESSAO_HORARIO) localStorage.setItem('horarioSelecionado', SESSAO_HORARIO);
    if (SESSAO_DATA) localStorage.setItem('dataSelecionada', SESSAO_DATA);

    // Redireciona para a página de pagamento
    window.location.href = "/pagamento";
});

document.getElementById('btnCancelar').addEventListener('click', function() {
    // Fecha o modal
    document.getElementById('modalConfirmacao').style.display = 'none';
});

document.querySelector('.modal-close').addEventListener('click', function() {
    // Fecha o modal
    document.getElementById('modalConfirmacao').style.display = 'none';
});

// Fecha o modal ao clicar fora dele
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalConfirmacao');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Inicializar após o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    SESSAO_ID = parseInt(document.body.dataset.sessaoId, 10) || 0;
    QTD_ASSENTOS = parseInt(document.body.dataset.sessaoQtdeAssentos, 10) || 60;

    const sessaoArmazenada = localStorage.getItem('sessaoSelecionada');
    if (sessaoArmazenada && parseInt(sessaoArmazenada, 10) !== SESSAO_ID) {
        localStorage.removeItem('assentosSelecionados');
        localStorage.removeItem('filmeSelecionado');
        localStorage.removeItem('salaSelecionada');
        localStorage.removeItem('horarioSelecionado');
        localStorage.removeItem('dataSelecionada');
        localStorage.removeItem('sessaoSelecionada');
    }

    carregarAssentosOcupados();
});