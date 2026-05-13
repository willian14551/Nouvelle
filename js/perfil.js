document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formPerfil');
    const dataNasc = document.querySelector('input[name="data_nasc"]');
    const telInput = document.getElementById('telefone');
    const nomeInput = document.getElementById('Nome');

    if (!form || !dataNasc) {
        return;
    }

    // Define a data máxima como hoje (impede datas futuras)
    const hoje = new Date();
    const hojeISO = hoje.toISOString().split('T')[0];
    dataNasc.max = hojeISO;

    // Máscara do Telefone ((00) 00000-0000)
    if (telInput) {
        telInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
            v = v.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = v;
        });
    }

    form.addEventListener('submit', function(e) {
        document.querySelectorAll('.msg-erro').forEach(el => el.remove());

        // Validar nome
        if (nomeInput) {
            const nomeValor = nomeInput.value.trim();
            if (nomeValor.length < 5) {
                e.preventDefault();
                exibirErro(nomeInput, "O nome deve ser completo!!");
                return;
            }
        }

        // Validar telefone
        if (telInput) {
            const telValido = telInput.value.replace(/\D/g, '').length >= 10;
            if (!telValido) {
                e.preventDefault();
                exibirErro(telInput, "Telefone inválido!");
                return;
            }
        }

        // Validar data de nascimento
        const valor = dataNasc.value;
        if (!valor) {
            exibirErro(dataNasc, 'Informe a data de nascimento.');
            e.preventDefault();
            return;
        }

        const dataNascimento = new Date(valor);
        const hojeAtual = new Date();

        if (dataNascimento > hojeAtual) {
            exibirErro(dataNasc, 'A data de nascimento não pode ser maior do que a data de hoje.');
            e.preventDefault();
            return;
        }

        let idade = hojeAtual.getFullYear() - dataNascimento.getFullYear();
        const mes = hojeAtual.getMonth() - dataNascimento.getMonth();
        if (mes < 0 || (mes === 0 && hojeAtual.getDate() < dataNascimento.getDate())) {
            idade--;
        }

        if (idade < 18) {
            exibirErro(dataNasc, 'Você precisa ter pelo menos 18 anos para atualizar o perfil.');
            e.preventDefault();
        }
    });

    function exibirErro(input, mensagem) {
        const erro = document.createElement('p');
        erro.className = 'msg-erro';
        erro.innerText = mensagem;
        erro.style.color = '#F0AD12';
        erro.style.fontSize = '0.8rem';
        erro.style.marginTop = '5px';
        input.parentNode.appendChild(erro);
    }
});
