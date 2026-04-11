'''
Importar as ferramentas
FastApi cria o servidor, enquanto o request lida com os pedidos de acessar o site
'''
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from conexao import obter_conexao
import httpx

# Variável que instância um objeto da classe FastApi, criando o app
app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Variável que instância um objeto da classe Jinja2Templates que determina o local onde procurar um HTML
templates = Jinja2Templates(directory="templates")
API_KEY = "2ba00226f0008ae80f498510e6d1882a"
url = f"https://api.themoviedb.org/3/movie/now_playing?api_key={API_KEY}&language=pt-BR&page=1"

@app.get("/")
# Função Assincrona (endpoint) que recebe o parâmetro do tipo Request chamado request
async def home(request: Request):

    # Gerenciador de contexto que instancia um objeto AsyncClient
    # !!!! Para funcionar no servidor da puc deve ter o "verify=False" sempre que tiver a linha abaixo !!!!
    async with httpx.AsyncClient(verify=False) as client:

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

# Mostra o caminho de outra página para o python
@app.get("/filmesCartaz.html")
async def filmesCartaz(request: Request):

    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url)
        dados = resposta.json()
        filmesCartaz = dados.get("results", [])[:18]

    return templates.TemplateResponse(
        request=request,
        name="filmesCartaz.html",
        context={"request": request, "filmes": filmesCartaz}
    )

@app.get("/api/detalhes/{filme_id}")
async def pegar_detalhes(filme_id: int):
    # Imagine que você busca os detalhes de um filme específico aqui
    return {"id": filme_id, "status": "Disponível", "assentos": [1, 5, 8]}

@app.get("/emBreve.html")
async def emBreve(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="emBreve.html",
        context={"request": request}
    )

@app.get("/cadastro.html")
async def cadastro(request: Request):

    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url)
        dados = resposta.json()
        filmesCartaz = dados.get("results", [])[:5]

    return templates.TemplateResponse(
        request=request,
        name="cadastro.html",
        context={"request": request, "filmes": filmesCartaz}
    )
@app.get("/login.html")
async def login_pagina(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"request": request}
    )

@app.post("/login")
async def processar_login(
    request: Request,
    email: str = Form(...),
    senha: str = Form(...),
):
    conexao = obter_conexao()
    if not conexao:
        return templates.TemplateResponse(
            request=request,
            name="login.html", 
            context={"request": request, "mensagem": "Erro de conexão com o servidor."}
        )
    
    try:
        cursor = conexao.cursor(dictionary=True) # O Dictionary faz o MySql devolver os dados com os nomes das colunas

        sql = "Select cpf, nome, senha FROM Usuario WHERE email = %s"
        cursor.execute(sql, (email,))
        usuario = cursor.fetchone()

        if not usuario:
            return templates.TemplateResponse(
                request=request,
                name="login.html", 
                context={"request": request, "mensagem": "E-mail ou senha incorretos."}
            )
        
        senha_valida = pwd_context.verify(senha, usuario['senha'])

        if not senha_valida:
            return templates.TemplateResponse(
                request=request,
                name="login.html", 
                context={"request": request, "mensagem": "E-mail ou senha incorretos."}
            )
        
        resposta = RedirectResponse(url="/", status_code=303)
        resposta.set_cookie(key="usuario_nome", value=usuario['nome'])
        resposta.set_cookie(key="usuario_cpf", value=usuario['cpf'])

        return resposta
    except Exception as e:
        print(f"Erro no Login: {e}")
        return templates.TemplateResponse(
            request=request,
            name="login.html", 
            context={"request": request, "mensagem": "Ocorreu um erro ao tentar fazer login."}
        )
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

# Mostra para o js como buscar somente os 5 primeiros filmes
@app.get("/api/filmes-lista")
async def pegar_lista():
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url)
        dados = resposta.json()
        return dados.get("results", [])[:5]

@app.get("/pagamento.html")
async def pagamento(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="pagamento.html",
        context={"request": request}
    )

@app.get("/assentos.html")
async def assentos(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="assentos.html",
        context={"request": request}
    )