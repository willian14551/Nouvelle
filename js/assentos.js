/**
 * assentos.js — Geração do mapa de assentos e lógica de seleção.
 * Depende de modal.js (carregado antes no HTML) para confirmações e alertas padronizados.
 */

const PRECO_ASSENTO = 35.00;
const COLUNAS = 10;
let SESSAO_ID = 0;
let QTD_ASSENTOS = 60;
const SESSAO_FILME  = document.body.dataset.sessaoFilme  || '';
const SESSAO_SALA   = document.body.dataset.sessaoSala   || '';
const SESSAO_HORARIO = document.body.dataset.sessaoHorario || '';
const SESSAO_DATA   = document.body.dataset.sessaoData   || '';
const assentosSelecionados = new Set();

// Lista de assentos já ocupados, carregada dinamicamente via API
let indisponiveis = new Set();

// Busca os assentos ocupados na API e monta o mapa
async function carregarAssentosOcupados() {
    const sessaoId = SESSAO_ID || parseInt(localStorage.getItem('sessaoSelecionada') || '0', 10);

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
        // Exibe o erro via modal e ainda gera o mapa vazio para não travar a página
        mostrarAlerta('Aviso', 'Não foi possível carregar os assentos ocupados. Alguns assentos podem aparecer como disponíveis incorretamente.', 'aviso');
        gerarAssentos();
    }
}

// Cria os botões de assento no grid de acordo com a capacidade da sala
function gerarAssentos() {
    const container = document.getElementById('assentosGrid');
    container.innerHTML = '';

    const totalAssentos = parseInt(QTD_ASSENTOS, 10) || 60;
    const numLinhas = Math.ceil(totalAssentos / COLUNAS);
    let assentosCriados = 0;

    for (let i = 0; i < numLinhas; i++) {
        const linha = String.fromCharCode(65 + i); // A, B, C...
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
            assentosCriados++;
        }

        container.appendChild(linhaDiv);
    }
}

// Alterna a seleção de um assento ao clicar
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

// Atualiza o painel lateral com os assentos escolhidos e o total
function atualizarResumo() {
    const listaAssentos = document.getElementById('listaAssentos');
    const qtdAssentos   = document.getElementById('qtdAssentos');
    const precoTotal    = document.getElementById('precoTotal');
    const btnComprar    = document.getElementById('btnComprar');

    qtdAssentos.textContent = assentosSelecionados.size;

    if (assentosSelecionados.size === 0) {
        listaAssentos.innerHTML = '<p class="vazio">Nenhum assento selecionado</p>';
        precoTotal.textContent  = 'R$ 0,00';
        btnComprar.disabled = true;
    } else {
        const ordenados = Array.from(assentosSelecionados).sort();
        listaAssentos.innerHTML = ordenados.map(a => `<span class="tag-assento">${a}</span>`).join('');
        precoTotal.textContent  = `R$ ${(assentosSelecionados.size * PRECO_ASSENTO).toFixed(2).replace('.', ',')}`;
        btnComprar.disabled = false;
    }
}

// Exibe o modal de confirmação ao clicar em "Continuar para Pagamento"
document.getElementById('btnComprar').addEventListener('click', function (event) {
    event.preventDefault();

    if (assentosSelecionados.size === 0) return;

    const assentos = Array.from(assentosSelecionados).sort();
    const total    = (assentosSelecionados.size * PRECO_ASSENTO).toFixed(2).replace('.', ',');

    // Usa mostrarConfirmacao() do modal.js — sem modal hardcoded no HTML
    mostrarConfirmacao(
        'Confirmar compra',
        `<strong>Assentos:</strong> ${assentos.join(', ')}<br><strong>Total:</strong> R$ ${total}<br><br>Deseja continuar para o pagamento?`,
        function () {
            // Salva os dados no localStorage para a página de pagamento ler
            localStorage.setItem('assentosSelecionados', JSON.stringify(assentos));
            if (SESSAO_ID)   localStorage.setItem('sessaoSelecionada', SESSAO_ID);
            if (SESSAO_FILME)   localStorage.setItem('filmeSelecionado',  SESSAO_FILME);
            if (SESSAO_SALA)    localStorage.setItem('salaSelecionada',    SESSAO_SALA);
            if (SESSAO_HORARIO) localStorage.setItem('horarioSelecionado', SESSAO_HORARIO);
            if (SESSAO_DATA)    localStorage.setItem('dataSelecionada',    SESSAO_DATA);

            window.location.href = '/pagamento';
        }
    );
});

// Inicializa as variáveis do body e carrega os assentos após o DOM estar pronto
document.addEventListener('DOMContentLoaded', function () {
    SESSAO_ID    = parseInt(document.body.dataset.sessaoId, 10) || 0;
    QTD_ASSENTOS = parseInt(document.body.dataset.sessaoQtdeAssentos, 10) || 60;

    // Limpa dados de sessão anterior se o usuário veio de uma sessão diferente
    const sessaoArmazenada = localStorage.getItem('sessaoSelecionada');
    if (sessaoArmazenada && parseInt(sessaoArmazenada, 10) !== SESSAO_ID) {
        ['assentosSelecionados', 'filmeSelecionado', 'salaSelecionada',
         'horarioSelecionado', 'dataSelecionada', 'sessaoSelecionada'].forEach(k => localStorage.removeItem(k));
    }

    carregarAssentosOcupados();
});
