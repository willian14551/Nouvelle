
 // modal.js — Sistema de alertas padronizado da Nouvelle
 //Disponibiliza duas funções globais: mostrarAlerta() e mostrarConfirmacao()

// Cor principal de cada tipo, usada na borda da caixa e no botão OK via variável CSS
const _CORES = {
    erro:    '#c0392b',
    sucesso: '#27ae60',
    aviso:   '#F0AD12',
    info:    '#3498db',
};

// Remove qualquer modal aberto anteriormente para não empilhar dois ao mesmo tempo
function _removerModalAnterior() {
    const anterior = document.getElementById('_modal-alerta-global');
    if (anterior) anterior.remove();
}

/**
 * Exibe um modal informativo simples com botão OK.
 * @param {string}   titulo    - Título do modal.
 * @param {string}   mensagem  - Mensagem descritiva.
 * @param {string}   tipo      - 'info' | 'erro' | 'sucesso' | 'aviso'
 * @param {Function} aoFechar  - Callback opcional chamado ao fechar.
 */
function mostrarAlerta(titulo, mensagem, tipo = 'info', aoFechar = null) {
    _removerModalAnterior();

    const cor   = _CORES[tipo] || _CORES.info;

    // Overlay (fundo escurecido)
    const overlay = document.createElement('div');
    overlay.id = '_modal-alerta-global';
    overlay.className = 'modal-overlay';

    // Caixa central com modificador de cor pelo tipo
    const caixa = document.createElement('div');
    caixa.className = `modal-caixa modal-caixa--${tipo}`;
    // Passa a cor para o botão OK via variável CSS
    caixa.style.setProperty('--modal-cor', cor);

    caixa.innerHTML = `
        <h3 class="modal-titulo">${titulo}</h3>
        <p class="modal-mensagem">${mensagem}</p>
        <button id="_modal-btn-ok" class="modal-btn modal-btn--ok">OK</button>
    `;

    overlay.appendChild(caixa);
    document.body.appendChild(overlay);

    function fechar() {
        overlay.remove();
        if (typeof aoFechar === 'function') aoFechar();
    }

    document.getElementById('_modal-btn-ok').addEventListener('click', fechar);
    // Fecha também ao clicar fora da caixa
    overlay.addEventListener('click', e => { if (e.target === overlay) fechar(); });
}

/**
 * Exibe um modal de confirmação com dois botões (Cancelar / Confirmar).
 * Substitui o confirm() nativo do browser, que não segue a identidade visual.
 * @param {string}   titulo      - Título do modal.
 * @param {string}   mensagem    - Texto explicativo da ação a confirmar.
 * @param {Function} aoConfirmar - Callback chamado ao clicar em "Confirmar".
 * @param {Function} aoCancelar  - Callback opcional ao cancelar.
 */
function mostrarConfirmacao(titulo, mensagem, aoConfirmar, aoCancelar = null) {
    _removerModalAnterior();

    // Confirmação sempre usa o estilo de aviso (borda amarela)
    const overlay = document.createElement('div');
    overlay.id = '_modal-alerta-global';
    overlay.className = 'modal-overlay';

    const caixa = document.createElement('div');
    caixa.className = 'modal-caixa modal-caixa--aviso';

    caixa.innerHTML = `
        <h3 class="modal-titulo">${titulo}</h3>
        <p class="modal-mensagem">${mensagem}</p>
        <div class="modal-botoes">
            <button id="_modal-btn-cancelar"  class="modal-btn modal-btn--cancelar">Cancelar</button>
            <button id="_modal-btn-confirmar" class="modal-btn modal-btn--confirmar">Confirmar</button>
        </div>
    `;

    overlay.appendChild(caixa);
    document.body.appendChild(overlay);

    document.getElementById('_modal-btn-confirmar').addEventListener('click', () => {
        overlay.remove();
        if (typeof aoConfirmar === 'function') aoConfirmar();
    });
    document.getElementById('_modal-btn-cancelar').addEventListener('click', () => {
        overlay.remove();
        if (typeof aoCancelar === 'function') aoCancelar();
    });
    // Fecha ao clicar fora da caixa (equivalente a cancelar)
    overlay.addEventListener('click', e => {
        if (e.target === overlay) {
            overlay.remove();
            if (typeof aoCancelar === 'function') aoCancelar();
        }
    });
}