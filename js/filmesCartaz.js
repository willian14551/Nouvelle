// Falta filtrar a busca e pesquisar com o Enter além do botão da tela

const btnBuscar = document.getElementById("btnBuscar");
btnBuscar.addEventListener("click", async () => {
    carregarFilmes();
});

const inputBuscar = document.getElementById("inputBuscar");

async function carregarFilmes() {
    // Link da API
    const url = "https://www.omdbapi.com/?s="+inputBuscar.value+"&apikey=9d5bacaa";

    const corpoTabela = document.getElementById("corpoTabela");
    // Limpa a tela antes de mostrar o resultado de busca
    corpoTabela.innerHTML = "";

    try {
        // Faz a requisição dos dados e salva
        const resposta = await fetch(url);
        const dados = await resposta.json();

        // Procura o filme na API
        if (dados.Search) {
            

            dados.Search.forEach(filme => {
                console.log(filme.Poster); // Teste no console

                const divCard = document.createElement("div");
                divCard.className = "cardFilme";
                divCard.innerHTML = `
                    <img class="posterFilme" src="${filme.Poster}">
                    <strong class="tituloFilme">${filme.Title}</strong>
                `;
                corpoTabela.appendChild(divCard);
            });
 
        }  else {
            console.log("NENHUM FILME CHAMADO '"+inputBuscar+"' FOI ENCONTRADO!");
            alert("NENHUM FILME CHAMADO '"+inputBuscar+"' FOI ENCONTRADO!");
        }
    } catch (error) {
        console.log("Erro ao buscar os dados: ", error);
    }
    
}

console.log("filmesCartaz.js foi executado!"); // Teste no console