/**
 * filmesCartaz.js — Busca e exibe filmes em cartaz com pesquisa local.
 * Correções aplicadas: variável corpoTabela apontava para id errado dentro de filtrarFilmes(),
 * variável "erro" indefinida no catch, e typo ".textContentL" no catch.
 */

window.onload = async () => {
    const inputBuscar = document.getElementById("inputBuscar");
    const btnBuscar   = document.getElementById("btnBuscar");
    const gradeFilmes = document.getElementById("gradeFilmes");
    const msgErro     = document.querySelector('.msgErro');
    const msgErro1    = document.querySelector('.msgErro1');

    let filmesEmCartaz = [];

    function renderFilmes(lista) {
        gradeFilmes.innerHTML = '';
        if (!lista || lista.length === 0) {
            if (msgErro)  msgErro.textContent  = `O filme '${inputBuscar.value}' ainda não está em exibição ou já saiu de cartaz.`;
            if (msgErro1) msgErro1.textContent = 'Tente buscar outro filme.';
            return;
        }
        // Limpa mensagens anteriores ao exibir resultados
        if (msgErro)  msgErro.textContent  = '';
        if (msgErro1) msgErro1.textContent = '';

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
            gradeFilmes.appendChild(divCard);
        });
    }

    function filtrarFilmes() {
        const termo = (inputBuscar ? inputBuscar.value : '').trim().toLowerCase();
        if (!termo) {
            renderFilmes(filmesEmCartaz);
            return;
        }
        const filtrados = filmesEmCartaz.filter(f => (f.title || '').toLowerCase().includes(termo));
        renderFilmes(filtrados);
    }

    try {
        const resposta = await fetch("/api/filmes-em-cartaz");
        filmesEmCartaz = await resposta.json();

        if (!filmesEmCartaz || filmesEmCartaz.length === 0) {
            if (msgErro) msgErro.textContent = "Nenhum filme em cartaz no momento.";
            return;
        }

        if (btnBuscar) btnBuscar.addEventListener("click", filtrarFilmes);
        window.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                filtrarFilmes();
            }
        });

        renderFilmes(filmesEmCartaz);
    } catch (error) {
        console.error("Erro ao carregar API:", error);
        if (gradeFilmes) gradeFilmes.innerHTML = "<p style='color:white;'>Erro ao conectar com o servidor.</p>";
    }
};
