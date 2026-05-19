/**
 * pagamento.js — Lógica da página de finalização de compra.
 * Depende de modal.js (carregado antes no HTML) para exibir alertas padronizados.
 */

// Carrega os dados de sessão/assentos salvos pela página de assentos
function carregarDadosCompra() {
    const assentosArmazenados = localStorage.getItem('assentosSelecionados');
    const filmeArmazenado     = localStorage.getItem('filmeSelecionado');
    const salaArmazenada      = localStorage.getItem('salaSelecionada');
    const horarioArmazenado   = localStorage.getItem('horarioSelecionado');
    const dataArmazenada      = localStorage.getItem('dataSelecionada');
    const sessaoArmazenada    = localStorage.getItem('sessaoSelecionada');

    if (assentosArmazenados) {
        try {
            const assentos = JSON.parse(assentosArmazenados);
            const quantidade = assentos.length;
            const total = quantidade * 35.00;

            document.getElementById('assentosSelecionados').textContent = assentos.join(', ');
            document.getElementById('qtdAssentosFinal').textContent = quantidade;
            document.getElementById('totalFinal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            document.getElementById('assentosHidden').value = JSON.stringify(assentos);
        } catch (e) {
            console.error('Erro ao parsear assentos armazenados', e);
        }
    }

    if (filmeArmazenado)   { document.getElementById('filmeSelecionado').textContent   = filmeArmazenado;   document.getElementById('filmeHidden').value   = filmeArmazenado;   }
    if (salaArmazenada)    { document.getElementById('salaSelecionado').textContent    = salaArmazenada;    document.getElementById('salaHidden').value    = salaArmazenada;    }
    if (horarioArmazenado) { document.getElementById('horarioSelecionado').textContent = horarioArmazenado; document.getElementById('horarioHidden').value = horarioArmazenado; }
    if (dataArmazenada)    { document.getElementById('dataSelecionado').textContent    = dataArmazenada;    document.getElementById('dataHidden').value    = dataArmazenada;    }

    if (sessaoArmazenada) {
        const el = document.getElementById('sessaoIdHidden');
        if (el) el.value = String(sessaoArmazenada);
    }
}

// Mostra ou esconde os campos de cartão/PIX conforme o método escolhido
function atualizarCamposMetodo() {
    const metodo = document.querySelector('input[name="metodo_pagamento"]:checked').value;
    document.getElementById('cartaoCampos').style.display = metodo === 'PIX' ? 'none' : 'block';
    document.getElementById('pixCampo').style.display    = metodo === 'PIX' ? 'block' : 'none';
}

// Valida os campos antes de enviar ao servidor; retorna lista de erros encontrados
function validarFormulario() {
    const metodo = document.querySelector('input[name="metodo_pagamento"]:checked').value;
    const erros  = [];

    const emailEl  = document.getElementById('email');
    const emailVal = emailEl.value.trim();

    if (!emailVal) {
        erros.push('E-mail é obrigatório');
        emailEl.style.borderColor = '#ff4444';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        erros.push('E-mail inválido');
        emailEl.style.borderColor = '#ff4444';
    } else {
        emailEl.style.borderColor = '#555';
    }

    if (metodo === 'PIX') {
        const pixKey = document.getElementById('pixKey');
        if (!pixKey.value.trim()) {
            erros.push('Chave PIX é obrigatória');
            pixKey.style.borderColor = '#ff4444';
        } else {
            pixKey.style.borderColor = '#555';
        }
    } else {
        // Validações dos campos de cartão
        const camposCartao = [
            { id: 'nomeCartao',   nome: 'Nome no Cartão' },
            { id: 'numeroCartao', nome: 'Número do Cartão' },
            { id: 'validade',     nome: 'Validade' },
            { id: 'cvv',          nome: 'CVV' },
        ];

        camposCartao.forEach(({ id, nome }) => {
            const el  = document.getElementById(id);
            const val = el.value.trim();
            if (!val) {
                erros.push(`${nome} é obrigatório`);
                el.style.borderColor = '#ff4444';
                return;
            }
            el.style.borderColor = '#555';
            if (id === 'numeroCartao' && !/^\d{16}$/.test(val.replace(/\s/g, ''))) {
                erros.push('Número do cartão deve ter 16 dígitos');
                el.style.borderColor = '#ff4444';
            }
            if (id === 'validade' && !/^\d{2}\/\d{2}$/.test(val)) {
                erros.push('Validade deve estar no formato MM/AA');
                el.style.borderColor = '#ff4444';
            }
            if (id === 'cvv' && !/^\d{3}$/.test(val)) {
                erros.push('CVV deve ter 3 dígitos');
                el.style.borderColor = '#ff4444';
            }
        });
    }

    return erros;
}

// Formata o número do cartão com espaços a cada 4 dígitos
function formatarNumeroCartao(event) {
    let v = event.target.value.replace(/\D/g, '').substring(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    event.target.value = v;
}

// Insere a barra (/) automaticamente na validade
function formatarValidade(event) {
    let v = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
    event.target.value = v;
}

// Permite apenas 3 dígitos no CVV
function limitarCVV(event) {
    event.target.value = event.target.value.replace(/\D/g, '').substring(0, 3);
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', function () {
    carregarDadosCompra();

    document.getElementById('numeroCartao').addEventListener('input', formatarNumeroCartao);
    document.getElementById('validade').addEventListener('input', formatarValidade);
    document.getElementById('cvv').addEventListener('input', limitarCVV);

    document.querySelectorAll('input[name="metodo_pagamento"]').forEach(r => {
        r.addEventListener('change', atualizarCamposMetodo);
    });
    atualizarCamposMetodo();
    window.addEventListener('pageshow', atualizarCamposMetodo);

    document.getElementById('formPagamento').addEventListener('submit', async function (event) {
        event.preventDefault();

        const erros = validarFormulario();
        if (erros.length > 0) {
            // Exibe todos os erros de validação num único modal padronizado
            mostrarAlerta('Erro na validação', erros.join('<br>'), 'erro');
            return;
        }

        // Garante que os campos ocultos estejam preenchidos com os dados do localStorage
        const syncMap = {
            sessaoIdHidden: 'sessaoSelecionada',
            filmeHidden:    'filmeSelecionado',
            salaHidden:     'salaSelecionada',
            horarioHidden:  'horarioSelecionado',
            dataHidden:     'dataSelecionada'
        };
        Object.entries(syncMap).forEach(([elId, lsKey]) => {
            const el = document.getElementById(elId);
            if (el && !el.value) el.value = localStorage.getItem(lsKey) || '';
        });
        // Sempre sincroniza o sessaoId como garantia extra
        const sessaoLs = localStorage.getItem('sessaoSelecionada');
        if (sessaoLs) document.getElementById('sessaoIdHidden').value = sessaoLs;

        const formData = new FormData(event.target);
        if (!formData.get('sessao_id')) {
            mostrarAlerta('Erro', 'Sessão não identificada. Volte e selecione os assentos novamente.', 'erro');
            return;
        }

        try {
            const response = await fetch(event.target.action, { method: 'POST', body: formData });
            const resultado = await response.json();

            if (response.ok && resultado.success) {
                // Limpa o localStorage e, ao fechar o modal de sucesso, volta para a home
                ['assentosSelecionados', 'filmeSelecionado', 'salaSelecionada',
                 'horarioSelecionado', 'dataSelecionada', 'sessaoSelecionada'].forEach(k => localStorage.removeItem(k));

                mostrarAlerta('Pagamento confirmado', resultado.message || 'Pagamento processado com sucesso!', 'sucesso', () => {
                    window.location.href = '/';
                });
            } else {
                mostrarAlerta('Erro no pagamento', resultado.message || 'Não foi possível processar o pagamento.', 'erro');
            }
        } catch (error) {
            console.error('Erro no fetch de pagamento:', error);
            mostrarAlerta('Erro de conexão', 'Não foi possível comunicar com o servidor. Tente novamente.', 'erro');
        }
    });
});
