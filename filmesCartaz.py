# Importação da biblioteca
import requests

busca = "Batman"

# Link API
url = f"https://www.omdbapi.com/?s={busca}&apikey=9d5bacaa"

# Faz a requisição dos dados e salva
resposta = requests.get(url)
dados = resposta.json()

# Mostra os títulos dos filmes
if "Search" in dados:
    for filme in dados["Search"]:
        print(filme["Title"])
else:
    print("NENHUM FILME FOI ENCONTRADO OU OCORREU UM ERRO NA API!")