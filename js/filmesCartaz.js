console.log("Executando o js ..."); // Teste no console

<<<<<<< HEAD
const busca = "Harry Potter";
=======
const busca = "Alien";
>>>>>>> felipe

async function carregarFilmes() {
    // Link da API
    const url = "https://www.omdbapi.com/?s="+busca+"&apikey=9d5bacaa";

    // Faz a requisição dos dados e salva
    const resposta = await fetch(url);
    const dados = await resposta.json();

    const corpoTabela = document.getElementById("corpoTabela");
    // Procura o poster do filme na API
    if (dados.Search) {
        const linha = document.createElement("tr");
        dados.Search.forEach(filme => {
            console.log(filme.Poster); // Teste no console
            
            const imgTd = document.createElement("td");
            const img = document.createElement("img");
            img.src = filme.Poster;
            img.width = 250;
            imgTd.appendChild(img);

            linha.appendChild(imgTd);
            corpoTabela.appendChild(linha);
        });

    } if (dados.Search){
        const linha = document.createElement("tr");
        dados.Search.forEach(filme => {
            console.log(filme.Title); // Teste no console

            const titulo = document.createElement("th");
            titulo.innerText = filme.Title;

            linha.appendChild(titulo);
            corpoTabela.appendChild(linha);
       });

    } if (dados.Search){
        const linha = document.createElement("tr");
        dados.Search.forEach(filme => {
            console.log(filme.Title); // Teste no console
            
            const desc = document.createElement("td");
            desc.innerText = filme.Overview;

            linha.appendChild(desc);
            corpoTabela.appendChild(linha);
        });
        
    }  else {
        console.log("NENHUM FILME CHAMADO '"+busca+"' FOI ENCONTRADO!");
    }

}

carregarFilmes();