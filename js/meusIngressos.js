document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('ingresso-select');
    const detalhes = document.getElementById('detalhes-ingresso');
    const botoes = document.querySelectorAll('.btn-ingresso-item');
    const ingressos = window.meusIngressos || [];

    if (!select || !detalhes) {
        return;
    }

    function formatarDataHora(valor) {
        if (!valor) return 'N/A';
        const data = new Date(valor);
        if (isNaN(data.getTime())) {
            return valor;
        }
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function mostrarDetalhes(ingressoId) {
        const ingresso = ingressos.find(i => String(i.ingresso_id) === String(ingressoId));
        if (!ingresso) {
            detalhes.innerHTML = '<h2>Detalhes do ingresso</h2><p>Selecione um ingresso para ver as informações completas.</p>';
            return;
        }

        detalhes.innerHTML = `
            <h2>Detalhes do ingresso</h2>
            <p><strong>Ingresso:</strong> #${ingresso.ingresso_id}</p>
            <p><strong>Filme:</strong> ${ingresso.filme_nome}</p>
            <p><strong>Horário:</strong> ${formatarDataHora(ingresso.horario_inicio)}</p>
            <p><strong>Tipo:</strong> ${ingresso.dub_leg}</p>
            <p><strong>Assento:</strong> ${ingresso.numero_assento || 'Não definido'}</p>
            <p><strong>Valor pago:</strong> R$ ${Number(ingresso.valor_total).toFixed(2)}</p>
            <p><strong>Pagamento:</strong> ${ingresso.metodo_pagamento}</p>
            <p><strong>Status:</strong> ${ingresso.status}</p>
            <p><strong>ID do pagamento:</strong> ${ingresso.pagamento_id}</p>
            <p><strong>Sala:</strong> ${ingresso.sala_quantidade || 'N/A'} assentos</p>
            <p><strong>Descrição do filme:</strong><br>${ingresso.filme_descricao || 'Sem descrição'}</p>
        `;
    }

    select.addEventListener('change', function(event) {
        mostrarDetalhes(event.target.value);
    });

    botoes.forEach(function(botao) {
        botao.addEventListener('click', function() {
            const id = botao.getAttribute('data-id');
            if (!id) return;
            select.value = id;
            mostrarDetalhes(id);
        });
    });
});