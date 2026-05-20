// Verifica se a senha atende aos requisitos mínimos de segurança
function senhaForte(senha) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]).{8,}$/.test(senha);
}

document.addEventListener('DOMContentLoaded', function() {
    

    // PREVIEW DA FOTO DE PERFIL ---

    const fotoInput = document.getElementById('btnAddFoto');
    const previewImg = document.getElementById('preview-img');
    const paragNomeArquivo = document.getElementById('nomeArquivo');
    const containerPreview = document.getElementById('container-preview');

    if (fotoInput) {
        fotoInput.addEventListener('change', function() {
            const arquivo = this.files[0]; // Obtém o arquivo selecionado

            // Atualiza o texto do botão
            const nomeArquivo = arquivo ? arquivo.name : "Selecionar Imagem"; 
            const botaoUpload = document.querySelector('.botao-upload');
            if (botaoUpload) botaoUpload.innerText = "Alterar Imagem";
            if (paragNomeArquivo) paragNomeArquivo.innerText = nomeArquivo;

            const btnSalvar = document.getElementById('btnSalvarFoto');

            if (arquivo) { 
                const leitor = new FileReader();

                leitor.onload = function(e) {
                    if (previewImg) previewImg.src = e.target.result;
                    if (containerPreview) containerPreview.style.display = 'block';
                }

                leitor.readAsDataURL(arquivo);
                // Só mostra o botão de salvar quando o usuário seleciona um arquivo
                if (btnSalvar) btnSalvar.style.display = 'block';
            } else {
                if (containerPreview) containerPreview.style.display = 'none';
                if (btnSalvar) btnSalvar.style.display = 'none';
            }
        });
    }

    // VALIDAÇÃO EM TEMPO REAL DA SENHA ---

    const campoNovaSenha = document.getElementById('nova_senha');
    const campoConfirmarSenha = document.getElementById('confirmar_senha');
    const erroNovaSenha = document.getElementById('erroNovaSenha');
    const erroConfirmarSenha = document.getElementById('erroConfirmarSenha');

    // Valida a força da senha enquanto digita
    if (campoNovaSenha && erroNovaSenha) {
        campoNovaSenha.addEventListener('input', () => {
            if (campoNovaSenha.value.length === 0) {
                erroNovaSenha.style.display = 'none';
                if (erroConfirmarSenha) erroConfirmarSenha.style.display = 'none';
                return;
            }
            erroNovaSenha.style.display = senhaForte(campoNovaSenha.value) ? 'none' : 'block';
            
            // Revalida a confirmação caso já esteja preenchida
            if (campoConfirmarSenha && campoConfirmarSenha.value.length > 0) {
                erroConfirmarSenha.style.display = (campoNovaSenha.value !== campoConfirmarSenha.value) ? 'block' : 'none';
            }
        });
    }

    // Compara a confirmação com a nova senha
    if (campoConfirmarSenha && erroConfirmarSenha) {
        campoConfirmarSenha.addEventListener('input', () => {
            const diferente = campoConfirmarSenha.value.length > 0 && campoNovaSenha.value !== campoConfirmarSenha.value;
            erroConfirmarSenha.style.display = diferente ? 'block' : 'none';
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

    // 3. VALIDAÇÃO AO ENVIAR O FORMULÁRIO ---
    const formAtualizar = document.querySelector('form[action="/atualizar_perfil"]');
    const dataNasc = document.getElementById('data_nasc');

    if (formAtualizar && dataNasc) {
        formAtualizar.addEventListener('submit', function(e) {
            
            // Validação de idade mínima de 18 anos e máxima de 120 anos
            const hoje = new Date();
            const valor = dataNasc.value;
            if (!valor) return;

            const dataNascimento = new Date(valor);
            let idade = hoje.getFullYear() - dataNascimento.getFullYear();
            const mes = hoje.getMonth() - dataNascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
                idade--;
            }

            if (idade < 18 || idade > 120) {
                e.preventDefault();
                // Ajustei o texto de "se cadastrar" para "atualizar seu cadastro"
                mostrarAlerta('Data Inválida', 'Você precisa ter entre 18 e 120 anos para atualizar seu cadastro.', 'aviso');
                return false;
            }

            // Validação final de senha antes do submit (apenas se o campo estiver preenchido)
            if (campoNovaSenha && campoNovaSenha.value.trim() !== "") {
                if (campoNovaSenha.value !== campoConfirmarSenha.value) {
                    e.preventDefault();
                    mostrarAlerta('Senhas Incompatíveis', 'A nova senha e a confirmação não coincidem.', 'erro');
                    return false;
                }

                if (!senhaForte(campoNovaSenha.value)) {
                    e.preventDefault();
                    mostrarAlerta('Senha Fraca', 'A nova senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, um número e um caractere especial.', 'aviso');
                    return false;
                }
            }
        });
    }
});