'''
Importar as ferramentas
FastApi cria o servidor, enquanto o request lida com os pedidos de acessar o site
'''
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import httpx

# Variável que instância um objeto da classe FastApi, criando o app
app = FastAPI()

app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Variável que instância um objeto da classe Jinja2Templates que determina o local onde procurar um HTML
templates = Jinja2Templates(directory="templates")
API_KEY = "2ba00226f0008ae80f498510e6d1882a"

@app.get("/")

# Função Assincrona (endpoint) que recebe o parâmetro do tipo Request chamado request
async def home(request: Request):
    url = f"https://api.themoviedb.org/3/movie/now_playing?api_key={API_KEY}&language=pt-BR&page=1"

    # Gerenciador de contexto que instancia um objeto AsyncClient
    async with httpx.AsyncClient() as client:
        
        # Chamada de método, o await pede pra esperar, salvando o objeto da resposta na variável
        resposta = await client.get(url)
        # Chamada de Método que transforma a resposta de uma forma que o python consiga ler, salvando na variável dados
        dados = resposta.json()
        # Chamada de método e fatiamento, o método .get("resultado") extrai os 5 primeiros filmes da api e salva na variável
        filmes_recentes = dados.get("results", [])[:5]

    # Chamada de método que utiliza o método .TemplateResponse() para montar o HTML
    # Para funcionar, é necessário passar o nome do arquivo e um dicionário de contexto do request e lista de filmes
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={"request": request, "filmes": filmes_recentes}
    )


