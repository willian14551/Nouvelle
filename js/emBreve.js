const filmesDaPagina = [];
const btnBuscar = document.getElementById("btnBuscar");
const inputBuscar = document.getElementById("inputBuscar");
const msgErro = document.querySelector(".msgErro");
const msgErro1 = document.querySelector(".msgErro1");
const corpoTabela = document.getElementById("corpoTabela");

window.addEventListener("load", async () => {
    const resposta = await fetch("/api/filmes-em-breve");
    filmesDaPagina.push(...await resposta.json());
    console.log("Filmes carregados para busca local:", filmesDaPagina);
    exibirFilmes(filmesDaPagina);
});

btnBuscar.addEventListener("click", filtrarFilmes);
window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        filtrarFilmes();
    }
});

function filtrarFilmes() {
    const termo = inputBuscar.value.trim().toLowerCase();
    corpoTabela.innerHTML = "";

    const resultados = filmesDaPagina.filter((filme) =>
        filme.title.toLowerCase().includes(termo)
    );

    if (resultados.length === 0) {
        msgErro.textContent = termo
            ? `O filme '${inputBuscar.value.trim()}' não foi encontrado nos lançamentos futuros.`
            : "";
        msgErro1.textContent = termo ? "Tente buscar outro filme." : "";
    } else {
        msgErro.textContent = "";
        msgErro1.textContent = "";
    }

    exibirFilmes(resultados);
}

function exibirFilmes(filmes) {
    corpoTabela.innerHTML = "";

    if (filmes.length === 0) {
        corpoTabela.innerHTML = "<p style='color:white; text-align:center;'>Nenhum lançamento futuro encontrado.</p>";
        return;
    }

    filmes.forEach((filme) => {
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
