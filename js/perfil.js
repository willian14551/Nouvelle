document.addEventListener('DOMContentLoaded', function() {
    const fotoInput = document.getElementById('btnAddFoto');
    const previewImg = document.getElementById('preview-img');
    const paragNomeArquivo = document.getElementById('nomeArquivo');
    const containerPreview = document.getElementById('container-preview');

    if (fotoInput) {
        fotoInput.addEventListener('change', function() {
            const arquivo = this.files[0]; // Obtém o arquivo selecionado

            // Atualiza o texto do botão
            const nomeArquivo = arquivo ? arquivo.name : "Selecionar Imagem"; // Verifica se um arquivo foi selecionado
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

    // Validação da data de nascimento (mesma ideia do cadastro)
    const formAtualizar = document.querySelector('form[action="/atualizar_perfil"]');
    const dataNasc = document.getElementById('data_nasc');

    function exibirErro(input, mensagem) {
        // remove erros anteriores
        const prev = input.parentNode.querySelector('.msg-erro');
        if (prev) prev.remove();
        const erro = document.createElement('p');
        erro.className = 'msg-erro';
        erro.innerText = mensagem;
        erro.style.color = "#F0AD12";
        erro.style.fontSize = "0.9rem";
        erro.style.marginTop = "5px";
        input.parentNode.appendChild(erro);
    }

    if (formAtualizar && dataNasc) {
        formAtualizar.addEventListener('submit', function(e) {
            // validação de idade mínima de 18 anos
            const hoje = new Date();
            const valor = dataNasc.value;
            if (!valor) return; // o required no input já trata

            const dataNascimento = new Date(valor);
            let idade = hoje.getFullYear() - dataNascimento.getFullYear();
            const mes = hoje.getMonth() - dataNascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
                idade--;
            }

            if (idade < 18) {
                e.preventDefault();
                exibirErro(dataNasc, "Você precisa ter pelo menos 18 anos.");
                return false;
            }
        });
    }
});