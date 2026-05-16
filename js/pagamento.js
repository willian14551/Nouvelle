// Recupera dados da URL ou localStorage
function carregarDadosCompra() {
    // Tenta recuperar dados do localStorage
    const assentosArmazenados = localStorage.getItem('assentosSelecionados');
    const filmeArmazenado = localStorage.getItem('filmeSelecionado');
    const salaArmazenada = localStorage.getItem('salaSelecionada');
    const horarioArmazenado = localStorage.getItem('horarioSelecionado');
    const dataArmazenada = localStorage.getItem('dataSelecionada');
    const sessaoArmazenada = localStorage.getItem('sessaoSelecionada');
    // Preencha os campos visíveis e hidden mesmo se os assentos não existirem
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

    if (filmeArmazenado) {
        document.getElementById('filmeSelecionado').textContent = filmeArmazenado;
        document.getElementById('filmeHidden').value = filmeArmazenado;
    }
    if (salaArmazenada) {
        document.getElementById('salaSelecionado').textContent = salaArmazenada;
        document.getElementById('salaHidden').value = salaArmazenada;
    }
    if (horarioArmazenado) {
        document.getElementById('horarioSelecionado').textContent = horarioArmazenado;
        document.getElementById('horarioHidden').value = horarioArmazenado;
    }
    if (dataArmazenada) {
        document.getElementById('dataSelecionado').textContent = dataArmazenada;
        document.getElementById('dataHidden').value = dataArmazenada;
    }
    if (sessaoArmazenada) {
        const sessaoElemento = document.getElementById('sessaoIdHidden');
        if (sessaoElemento) {
            sessaoElemento.value = String(sessaoArmazenada);
        }
    }
}

function atualizarCamposMetodo() {
    const metodo = document.querySelector('input[name="metodo_pagamento"]:checked').value;
    const cartaoCampos = document.getElementById('cartaoCampos');
    const pixCampo = document.getElementById('pixCampo');

    if (metodo === 'PIX') {
        cartaoCampos.style.display = 'none';
        pixCampo.style.display = 'block';
    } else {
        cartaoCampos.style.display = 'block';
        pixCampo.style.display = 'none';
    }
}

// Validação do formulário de pagamento
function validarFormulario() {
    const metodo = document.querySelector('input[name="metodo_pagamento"]:checked').value;
    let valido = true;
    let mensagensErro = [];

    const emailElemento = document.getElementById('email');
    const emailValor = emailElemento.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValor) {
        valido = false;
        mensagensErro.push('E-mail é obrigatório');
        emailElemento.style.borderColor = '#ff4444';
    } else if (!emailRegex.test(emailValor)) {
        valido = false;
        mensagensErro.push('E-mail inválido');
        emailElemento.style.borderColor = '#ff4444';
    } else {
        emailElemento.style.borderColor = '#555';
    }

    if (metodo === 'PIX') {
        const pixKey = document.getElementById('pixKey');
        const pixValor = pixKey.value.trim();

        if (!pixValor) {
            valido = false;
            mensagensErro.push('Chave PIX é obrigatória para PIX');
            pixKey.style.borderColor = '#ff4444';
        } else {
            pixKey.style.borderColor = '#555';
        }
    } else {
        const camposCartao = [
            { id: 'nomeCartao', nome: 'Nome no Cartão' },
            { id: 'numeroCartao', nome: 'Número do Cartão' },
            { id: 'validade', nome: 'Validade' },
            { id: 'cvv', nome: 'CVV' }
        ];

        camposCartao.forEach(campo => {
            const elemento = document.getElementById(campo.id);
            const valor = elemento.value.trim();

            if (!valor) {
                valido = false;
                mensagensErro.push(`${campo.nome} é obrigatório`);
                elemento.style.borderColor = '#ff4444';
                return;
            }

            elemento.style.borderColor = '#555';

            if (campo.id === 'numeroCartao') {
                const numeroLimpo = valor.replace(/\s/g, '');
                if (!/^\d{16}$/.test(numeroLimpo)) {
                    valido = false;
                    mensagensErro.push('Número do cartão deve ter 16 dígitos');
                    elemento.style.borderColor = '#ff4444';
                }
            }

            if (campo.id === 'validade') {
                if (!/^\d{2}\/\d{2}$/.test(valor)) {
                    valido = false;
                    mensagensErro.push('Validade deve estar no formato MM/AA');
                    elemento.style.borderColor = '#ff4444';
                }
            }

            if (campo.id === 'cvv') {
                if (!/^\d{3}$/.test(valor)) {
                    valido = false;
                    mensagensErro.push('CVV deve ter 3 dígitos');
                    elemento.style.borderColor = '#ff4444';
                }
            }
        });
    }

    return { valido, mensagensErro };
}

// Formatação automática do número do cartão
function formatarNumeroCartao(event) {
    let valor = event.target.value.replace(/\s/g, '');
    valor = valor.replace(/\D/g, ''); // Remove não-dígitos
    valor = valor.substring(0, 16); // Limita a 16 dígitos

    // Adiciona espaços a cada 4 dígitos
    valor = valor.replace(/(\d{4})(?=\d)/g, '$1 ');

    event.target.value = valor;
}

// Formatação automática da validade
function formatarValidade(event) {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 4); // Limita a 4 dígitos

    if (valor.length >= 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2);
    }

    event.target.value = valor;
}

// Limita CVV a 3 dígitos
function limitarCVV(event) {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 3);
    event.target.value = valor;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Carrega dados da compra
    carregarDadosCompra();

    // Formatação automática dos campos
    document.getElementById('numeroCartao').addEventListener('input', formatarNumeroCartao);
    document.getElementById('validade').addEventListener('input', formatarValidade);
    document.getElementById('cvv').addEventListener('input', limitarCVV);

    document.querySelectorAll('input[name="metodo_pagamento"]').forEach(radio => {
        radio.addEventListener('change', atualizarCamposMetodo);
    });
    atualizarCamposMetodo();
    window.addEventListener('pageshow', atualizarCamposMetodo);
    setTimeout(atualizarCamposMetodo, 0);

    // Submissão do formulário
    document.getElementById('formPagamento').addEventListener('submit', async function(event) {
        event.preventDefault();

        const validacao = validarFormulario();

        if (!validacao.valido) {
            document.getElementById('modalTitle').textContent = 'Erro na Validação';
            document.getElementById('modalMessage').textContent = 'Por favor, corrija os seguintes erros:\n\n' + validacao.mensagensErro.join('\n');
            document.getElementById('btnModalAction').textContent = 'OK';
            document.getElementById('modalConfirmacao').style.display = 'block';
            return;
        }

        const form = event.target;

        // Ensure hidden fields are populated from localStorage before submitting
        if (!document.getElementById('sessaoIdHidden').value) {
            const s = localStorage.getItem('sessaoSelecionada');
            if (s) document.getElementById('sessaoIdHidden').value = s;
        }
        if (!document.getElementById('filmeHidden').value) {
            const f = localStorage.getItem('filmeSelecionado');
            if (f) document.getElementById('filmeHidden').value = f;
        }
        if (!document.getElementById('salaHidden').value) {
            const sa = localStorage.getItem('salaSelecionada');
            if (sa) document.getElementById('salaHidden').value = sa;
        }
        if (!document.getElementById('horarioHidden').value) {
            const h = localStorage.getItem('horarioSelecionado');
            if (h) document.getElementById('horarioHidden').value = h;
        }
        if (!document.getElementById('dataHidden').value) {
            const d = localStorage.getItem('dataSelecionada');
            if (d) document.getElementById('dataHidden').value = d;
        }

        // Always ensure the hidden session id is synced with localStorage
        const sessaoArmazenada = localStorage.getItem('sessaoSelecionada');
        if (sessaoArmazenada) {
            document.getElementById('sessaoIdHidden').value = sessaoArmazenada;
        }

        const formData = new FormData(form);

        // Client-side check: sessao_id must be present
        const sessaoIdValue = formData.get('sessao_id');
        if (!sessaoIdValue) {
            document.getElementById('modalTitle').textContent = 'Erro';
            document.getElementById('modalMessage').textContent = 'Sessão não informada.';
            document.getElementById('btnModalAction').textContent = 'OK';
            document.getElementById('modalConfirmacao').style.display = 'block';
            return;
        }

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            const resultado = await response.json();

            if (response.ok && resultado.success) {
                document.getElementById('modalTitle').textContent = 'Pagamento Confirmado';
                document.getElementById('modalMessage').textContent = resultado.message || 'Pagamento processado com sucesso!';
                document.getElementById('btnModalAction').textContent = 'Voltar ao Início';
                document.getElementById('modalConfirmacao').style.display = 'block';

                // Limpa localStorage após confirmação ser exibida
                localStorage.removeItem('assentosSelecionados');
                localStorage.removeItem('filmeSelecionado');
                localStorage.removeItem('salaSelecionada');
                localStorage.removeItem('horarioSelecionado');
                localStorage.removeItem('dataSelecionada');
            } else {
                document.getElementById('modalTitle').textContent = 'Erro';
                document.getElementById('modalMessage').textContent = resultado.message || 'Não foi possível processar o pagamento.';
                document.getElementById('btnModalAction').textContent = 'OK';
                document.getElementById('modalConfirmacao').style.display = 'block';
            }
        } catch (error) {
            document.getElementById('modalTitle').textContent = 'Erro';
            document.getElementById('modalMessage').textContent = 'Não foi possível comunicar com o servidor. Tente novamente.';
            document.getElementById('btnModalAction').textContent = 'OK';
            document.getElementById('modalConfirmacao').style.display = 'block';
            console.error('Erro no fetch de pagamento:', error);
        }
    });
});

// Event listeners para o modal
document.getElementById('btnModalAction').addEventListener('click', function() {
    const modal = document.getElementById('modalConfirmacao');
    modal.style.display = 'none';

    // Se for sucesso, redireciona para a página inicial
    if (document.getElementById('modalTitle').textContent === 'Pagamento Confirmado') {
        window.location.href = '/';
    }
});

document.querySelector('.modal-close').addEventListener('click', function() {
    document.getElementById('modalConfirmacao').style.display = 'none';
});

// Fecha o modal ao clicar fora dele
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalConfirmacao');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});