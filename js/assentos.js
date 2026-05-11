
const PRECO_ASSENTO = 35.00;
const LINHAS = 6;
const COLUNAS = 10;
const assentosSelecionados = new Set();

// Simular assentos indisponíveis
const indisponiveis = new Set(['A2', 'A3', 'B7', 'C4', 'C5', 'F2', 'F9']);

function gerarAssentos() {
    const container = document.getElementById('assentosGrid');
    container.innerHTML = '';

    for (let i = 0; i < LINHAS; i++) {
        const linha = String.fromCharCode(65 + i); // A, B, C, D, E, F
        const linhaDiv = document.createElement('div');
        linhaDiv.className = 'linha-assentos';

        for (let j = 1; j <= COLUNAS; j++) {
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
    event.preventDefault(); // Impede a submissão padrão do formulário

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
    localStorage.setItem('filmeSelecionado', 'Homem-Aranha: Sem Volta Para Casa');
    localStorage.setItem('salaSelecionada', 'Sala 03');
    localStorage.setItem('horarioSelecionado', '19:30');
    localStorage.setItem('dataSelecionada', '15 de Abril, 2026');

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

// Inicializar
gerarAssentos();