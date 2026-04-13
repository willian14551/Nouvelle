// Variável global para guardar os filmes que o Python enviou
let filmesDaPagina = [];

// Assim que a página carregar, buscamos a lista do Python
window.onload = async () => {
    const resposta = await fetch("/api/filmes-lista");
    filmesDaPagina = await resposta.json();
    console.log("Filmes carregados para busca local:", filmesDaPagina);
};

const btnBuscar = document.getElementById("btnBuscar");
btnBuscar.addEventListener("click", () => {
    filtrarFilmes(); // Mudamos o nome para refletir que é um filtro
});

window.addEventListener("keydown", function(event){
    if (event.key == "Enter"){
        filtrarFilmes();
    }
});

const inputBuscar = document.getElementById("inputBuscar");

function filtrarFilmes() {
    const termo = inputBuscar.value.toLowerCase();
    const corpoTabela = document.getElementById("corpoTabela");
    corpoTabela.innerHTML = "";

    // FILTRAGEM LOCAL: Olhamos apenas para os filmes que já temos
    const resultados = filmesDaPagina.filter(filme => 
        filme.title.toLowerCase().includes(termo)
    );

    if (resultados.length > 0) {
        resultados.forEach(filme => {
            const divCard = document.createElement("div");
            divCard.className = "cardFilme";
            
            // Montando a URL da imagem do TMDb
            const posterUrl = filme.poster_path 
                ? "https://image.tmdb.org/t/p/w500" + filme.poster_path 
                : "caminho/para/imagem-padrao.jpg";

            divCard.innerHTML = `
                <img class="posterFilme" src="${posterUrl}">
                <strong class="tituloFilme">${filme.title}</strong>
            `;
            divCard.onclick = () => window.location.href = `/assentos/${filme.id}`;
            corpoTabela.appendChild(divCard);
        });
    } else {
        alert("Nenhum dos filmes em cartaz corresponde a: " + inputBuscar.value);
    }
}
