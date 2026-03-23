console.log("Executando o js ...");

const busca = "Batman";

async function carregarFilmes() {
    // Link da API
    const url = "https://www.omdbapi.com/?s="+busca+"&apikey=9d5bacaa";

    // Faz a requisição dos dados e salva
    const resposta = await fetch(url);
    const dados = await resposta.json();

    const corpoTabela = document.getElementById("corpoTabela");
    const linhaImg = document.createElement("tr");

    // Procura o filme na API
    if (dados.Search) {
        dados.Search.forEach(filme => {
            console.log(filme.Title);

            const linha = document.createElement("tr");
            
            const imgColuna = document.createElement("td");
            const img = document.createElement("img");
            img.src = filme.Poster;
            img.width = 100;
            imgColuna.appendChild(img);
            
            const tituloColuna = document.createElement("td");
            const titulo = document.createElement("th");
            titulo.innerText = filme.Title;
            tituloColuna.appendChild(titulo);

            const descColuna = document.createElement("td");
            const desc = document.createElement("td");
            desc.innerText = filme.Plot;
            descColuna.appendChild(desc);

            linha.appendChild(imgColuna);
            linha.appendChild(tituloColuna);
            linha.appendChild(descColuna);

            corpoTabela.appendChild(linha);
        });
    } else {
        console.log("NENHUM FILME ENCONTRADO!");
    }
}

carregarFilmes();