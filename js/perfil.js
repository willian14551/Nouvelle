const fotoInput = document.getElementById('btnAddFoto');
const previewImg = document.getElementById('preview-img');
const paragNomeArquivo = document.getElementById('nomeArquivo');
const containerPreview = document.getElementById('container-preview');

fotoInput.addEventListener('change', function() {
        const arquivo = this.files[0]; // Obtém o arquivo selecionado

        // Atualiza o texto do botão
        const nomeArquivo = arquivo ? arquivo.name : "Selecionar Imagem"; // Verifica se um arquivo foi selecionado
        document.querySelector('.botao-upload').innerText = "Alterar Imagem";
        paragNomeArquivo.innerText = nomeArquivo;
        console.log("Arquivo selecionado: " + nomeArquivo); // Teste no console

        if (arquivo) { 
            const leitor = new FileReader();

            leitor.onload = function(e) {
                previewImg.src = e.target.result;
                containerPreview.style.display = 'block';
            }

            leitor.readAsDataURL(arquivo);
        } else {
            containerPreview.style.display = 'none';
            console.log("Nenhum arquivo selecionado."); // Teste no console
        }
    });