window.onload = async () => {
    let filmesEmBreve = [];
    const inputBuscar = document.getElementById("inputBuscar");
    const btnBuscar = document.getElementById("btnBuscar");
    const msgErro = document.querySelector('.msgErro');
    const msgErro1 = document.querySelector('.msgErro1');
    const corpoTabela = document.getElementById("gradeFilmes");

    function renderFilmes(lista) {
        corpoTabela.innerHTML = "";
        if (!lista || lista.length === 0) {
            corpoTabela.innerHTML = "<p style='color:white;'>Nenhum filme encontrado.</p>";
            return;
        }

        lista.forEach(filme => {
            const divCard = document.createElement("div");
            divCard.className = "cardFilme";

            const posterUrl = filme.poster_path 
                ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
                : "/assets/sem-foto.jpg";

            divCard.innerHTML = `
                <a href="/detalhes/${filme.id}">
                    <img class="posterFilme" src="${posterUrl}" alt="${filme.title}">
                    <strong class="tituloFilme">${filme.title}</strong>
                </a>
            `;

            corpoTabela.appendChild(divCard);
        });
    }

    function filtrarFilmes() {
        const termo = (inputBuscar && inputBuscar.value || '').trim().toLowerCase();
        if (!termo) {
            renderFilmes(filmesEmBreve);
            return;
        }

        const filtrados = filmesEmBreve.filter(f => (f.title || '').toLowerCase().includes(termo));
        renderFilmes(filtrados);
    }

    try {
        const resposta = await fetch("/api/filmes-em-breve");
        filmesEmBreve = await resposta.json();
        console.log("Filmes carregados para busca local:", filmesEmBreve);

        if (!filmesEmBreve || filmesEmBreve.length === 0) {
            if (msgErro) msgErro.textContent = "Nenhum lançamento futuro encontrado.";
            return;
        }

        if (btnBuscar) btnBuscar.addEventListener("click", filtrarFilmes);
        window.addEventListener("keydown", function(event){
            if (event.key == "Enter"){
                // evita submeter formulários acidentalmente
                event.preventDefault();
                filtrarFilmes();
            }
        });

        renderFilmes(filmesEmBreve);
    } catch (erro) {
        console.error("Erro ao carregar API:", erro);
        if (corpoTabela) corpoTabela.innerHTML = "<p style='color:white;'>Erro ao conectar com o servidor.</p>";
    }
};