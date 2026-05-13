window.onload = async () => {
    try {
        // Busca os filmes já filtrados 
        const resposta = await fetch("/api/filmes-em-breve");
        const filmesEmBreve = await resposta.json();
        console.log("Filmes carregados para busca local:", filmesEmBreve);

        if (filmesEmBreve.length === 0) {
            msgErro.textContent = "Nenhum lançamento futuro encontrado.";
            return;
        }

        // Barra de pesquisa
        const btnBuscar = document.getElementById("btnBuscar");
        btnBuscar.addEventListener("click", () => {
            filtrarFilmes();
        });
        window.addEventListener("keydown", function(event){
            if (event.key == "Enter"){
                filtrarFilmes();
            }
        });

        const corpoTabela = document.getElementById("corpoTabela");
        corpoTabela.innerHTML = ""; // Limpa o container

        filmesEmBreve.forEach(filme => {
            const divCard = document.createElement("div");
            divCard.className = "cardFilme";

            // URL da imagem
            const posterUrl = filme.poster_path 
                ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
                : "/assets/sem-foto.jpg";

            divCard.innerHTML = `
                <img class="posterFilme" src="${posterUrl}" alt="${filme.title}">
                <strong class="tituloFilme">${filme.title}</strong>
            `;

            corpoTabela.appendChild(divCard);
        });
    } catch (erro) {
        console.error("Erro ao carregar API:", erro);
        corpoTabela.innerHTML = "<p style='color:white;'>Erro ao conectar com o servidor.</p>";
    }
};