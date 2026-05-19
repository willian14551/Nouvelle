/**
 * cadastro.js — Validações e máscaras do formulário de cadastro.
 * Trabalha em conjunto com modal.js para exibir erros de forma padronizada.
 */

// --- Máscara de CPF (000.000.000-00) ---
function mascaraCPF(campo) {
    let v = campo.value.replace(/\D/g, '').substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    campo.value = v;
}

/**
 * Valida CPF pelo algoritmo oficial (módulo 11).
 * Rejeita sequências inválidas como 111.111.111-11.
 */
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf[10]);
}

// --- Máscara de Telefone ((DD) 90000-0000) ---
function mascaraTelefone(campo) {
    let v = campo.value.replace(/\D/g, '').substring(0, 11);
    if (v.length <= 10) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    campo.value = v;
}

/**
 * Verifica se a senha atende aos requisitos mínimos de segurança:
 * mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial.
 */
function senhaForte(senha) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]).{8,}$/.test(senha);
}

document.addEventListener('DOMContentLoaded', function () {
    const campoCPF       = document.getElementById('cpf');
    const campoPerfil    = document.getElementById('btnAddFoto');
    const previewImg     = document.getElementById('preview-img');
    const nomeArquivo    = document.getElementById('nomeArquivo');
    const campoTelefone  = document.getElementById('telefone');
    const campoSenha     = document.getElementById('senhaCadastro');
    const campoConfirmar = document.getElementById('senhaConfirmar');
    const erroCPF        = document.getElementById('erroCpf');
    const erroTelefone   = document.getElementById('erroTelefone');
    const erroSenha      = document.getElementById('erroSenha');
    const erroConfirmar  = document.getElementById('erroConfirmar');
    const form           = document.getElementById('formCadastro');

    // Aplica a máscara e valida o CPF enquanto o usuário digita
    if (campoCPF) {
        campoCPF.addEventListener('input', () => {
            mascaraCPF(campoCPF);
            const cpfLimpo = campoCPF.value.replace(/\D/g, '');
            if (cpfLimpo.length === 11) {
                erroCPF.style.display = validarCPF(campoCPF.value) ? 'none' : 'block';
            } else {
                erroCPF.style.display = 'none';
            }
        });
    }

    // Aplica a máscara e valida o telefone enquanto o usuário digita
    if (campoTelefone) {
        campoTelefone.addEventListener('input', () => {
            mascaraTelefone(campoTelefone);
            const tel = campoTelefone.value.replace(/\D/g, '');
            erroTelefone.style.display = (tel.length === 10 || tel.length === 11) ? 'none' : 'block';
        });
    }

    // Indica em tempo real se a senha atende aos critérios de segurança
    if (campoSenha && erroSenha) {
        campoSenha.addEventListener('input', () => {
            if (campoSenha.value.length === 0) {
                erroSenha.style.display = 'none';
                return;
            }
            erroSenha.style.display = senhaForte(campoSenha.value) ? 'none' : 'block';
            // Revalida a confirmação caso já esteja preenchida
            if (campoConfirmar && campoConfirmar.value.length > 0) {
                erroConfirmar.style.display = (campoSenha.value !== campoConfirmar.value) ? 'block' : 'none';
            }
        });
    }

    // Compara a confirmação com a senha original em tempo real
    if (campoConfirmar && erroConfirmar) {
        campoConfirmar.addEventListener('input', () => {
            const diferente = campoConfirmar.value.length > 0 && campoSenha.value !== campoConfirmar.value;
            erroConfirmar.style.display = diferente ? 'block' : 'none';
        });
    }

    // Mostra pré-visualização da foto de perfil selecionada
    if (campoPerfil) {
        campoPerfil.addEventListener('change', function () {
            const arquivo = this.files[0];
            if (arquivo) {
                const leitor = new FileReader();
                leitor.onload = e => { if (previewImg) previewImg.src = e.target.result; };
                leitor.readAsDataURL(arquivo);
                if (nomeArquivo) nomeArquivo.innerText = arquivo.name;
            }
        });
    }

    // Alterna visibilidade da senha ao clicar no ícone de olho
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            if (!input) return;
            input.type = input.type === 'password' ? 'text' : 'password';
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Validação completa antes de enviar o formulário ao servidor
    if (form) {
        form.addEventListener('submit', function (e) {
            if (campoCPF && !validarCPF(campoCPF.value)) {
                e.preventDefault();
                mostrarAlerta('CPF inválido', 'Verifique o CPF digitado antes de continuar.', 'erro');
                return;
            }
            if (campoSenha && !senhaForte(campoSenha.value)) {
                e.preventDefault();
                mostrarAlerta(
                    'Senha muito fraca',
                    'A senha precisa ter no mínimo 8 caracteres, letras maiúsculas, minúsculas, um número e um caractere especial (ex: @, #, !).',
                    'erro'
                );
                return;
            }
            if (campoConfirmar && campoSenha.value !== campoConfirmar.value) {
                e.preventDefault();
                mostrarAlerta('Senhas diferentes', 'A confirmação de senha não corresponde à senha digitada.', 'erro');
                return;
            }
        });
    }

    // Exibe a mensagem de erro vinda do servidor via modal em vez de texto inline
    const msgEl = document.getElementById('mensagemServidor');
    if (msgEl && msgEl.dataset.msg) {
        mostrarAlerta('Atenção', msgEl.dataset.msg, 'erro');
    }
});
