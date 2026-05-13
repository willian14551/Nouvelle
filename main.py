'''
Importar as ferramentas
FastApi cria o servidor, enquanto o request lida com os pedidos de acessar o site
'''
from fastapi import FastAPI, Request, Form, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse, JSONResponse
from conexao import obter_conexao
from datetime import datetime, timedelta
import httpx
import bcrypt
import shutil
import os

# Variável que instância um objeto da classe FastApi, criando o app
app = FastAPI()

app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Variável que instância um objeto da classe Jinja2Templates que determina o local onde procurar um HTML
templates = Jinja2Templates(directory="templates")
API_KEY = "2ba00226f0008ae80f498510e6d1882a"
url = f"https://api.themoviedb.org/3/movie/now_playing?api_key={API_KEY}&language=pt-BR&page=1"

#  Helper: basicamente checa se o cookie é ADMINISTRADOR
def _is_admin(request: Request) -> bool:
    return request.cookies.get("usuario_permissao") == "ADMINISTRADOR"


# Decorador assincrono que define o caminho da rota (endpoint) para acessar a função home, ou seja, a página inicial do site
@app.get("/")
async def home(request: Request):

    # Gerenciador de contexto que instancia um objeto AsyncClient
    # Para funcionar no servidor da puc deve ter o "verify=False" sempre que tiver a linha abaixo !!!!
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

# INATIVIDADE DO USUÁRIO
@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=303)
    
    # Remove todos os cookies que foram criados no login
    response.delete_cookie("usuario_nome")
    response.delete_cookie("usuario_cpf")
    response.delete_cookie("usuario_foto")
    
    return response

# Mostra para o js como buscar somente os 5 primeiros filmes
@app.get("/api/filmes-em-cartaz")
async def pegar_lista():
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url)
        dados = resposta.json()
        return dados.get("results", [])[:5]

@app.get("/api/detalhes/{filme_id}")
async def pegar_detalhes(filme_id: int):
    # Imagine que você busca os detalhes de um filme específico aqui
    return {"id": filme_id, "status": "Disponível", "assentos": [1, 5, 8]}

@app.get("/detalhes/{filme_id}")
async def detalhes_pagina(request: Request, filme_id: int):
    url_detalhes = f"https://api.themoviedb.org/3/movie/{filme_id}?api_key={API_KEY}&language=pt-BR"
    
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_detalhes)
        filme_dados = resposta.json()
        
    # Recebe a data de hoje
    hoje = datetime.now().strftime("%Y-%m-%d")
    # Recebe a data de lançamento do filme (se não tiver, usa string vazia)
    data_lancamento = filme_dados.get("release_date", "")

    # Função para formatar a data
    def formatar_data_br(valor):
        if not valor:
            return ""
        try:
            # Converte a string da API para um objeto de data e depois para o formato PT
            data_obj = datetime.strptime(valor, "%Y-%m-%d")
            return data_obj.strftime("%d/%m/%Y")
        except:
            return valor

    # Regista o filtro no Jinja2
    templates.env.filters['data_pt'] = formatar_data_br

    # Filtro de data
    def formatar_duracao(minutos):
        if not minutos:
            return "N/A"
        horas = minutos // 60
        resto_minutos = minutos % 60
        # O :02d vai garantir que 5 minutos fiquem como 05 
        return f"{horas}h {resto_minutos:02d}min"

    # Regista o filtro no ambiente do Jinja2
    templates.env.filters['tempo_h'] = formatar_duracao
    
    # Se a data de lançamento for menor ou igual a hoje, o ingresso pode ser comprado
    pode_comprar = data_lancamento <= hoje if data_lancamento else False

    return templates.TemplateResponse(
        request=request,
        name="detalhes.html",
        context={
            "request": request, 
            "filme": filme_dados,
            "pode_comprar": pode_comprar # Enviamos a variável para o HTML
        }
    )

@app.get("/api/filmes-em-breve")
async def api_em_breve():
    hoje = datetime.now().strftime("%Y-%m-%d")
    filmes_futuros = []

    async with httpx.AsyncClient(verify=False) as client:
        for pagina in range(1, 18):
            url_paginada = f"https://api.themoviedb.org/3/movie/upcoming?api_key={API_KEY}&language=pt-BR&page={pagina}"
            resposta = await client.get(url_paginada)
            dados = resposta.json()
            todos_filmes = dados.get("results", [])
            
            filtrados = [f for f in todos_filmes if f.get("release_date", "") > hoje]
            filmes_futuros.extend(filtrados)

    return filmes_futuros[:18]

# Mostra o caminho de outra página para o python
@app.get("/filmesCartaz")
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

@app.get("/emBreve")
async def emBreve(request: Request):
    hoje = datetime.now().strftime("%Y-%m-%d")
    filmes_futuros = []

    async with httpx.AsyncClient(verify=False) as client:
        # Buscar a páginas 
        for pagina in range(1, 18):
            url_paginada = f"https://api.themoviedb.org/3/movie/upcoming?api_key={API_KEY}&language=pt-BR&page={pagina}"
            resposta = await client.get(url_paginada)
            dados = resposta.json()
            todos_filmes = dados.get("results", [])
        # Filtro de Filmes com data maior que hoje    
            filtrados = [f for f in todos_filmes if f.get("release_date", "") > hoje]
            filmes_futuros.extend(filtrados)

    emBreve_final = filmes_futuros[:18]

    return templates.TemplateResponse(
        request=request,
        name="emBreve.html", 
        context={"request": request, "filmes": emBreve_final}
    )


@app.get("/cadastro")
async def cadastro_pagina (request: Request):
    return templates.TemplateResponse(
        request=request,
        name="cadastro.html",
        context={"request": request}
    )

@app.post("/cadastrar")
async def processar_cadastro(
    request: Request,
    cpf: str = Form(...),
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(...),
    data_nasc: str = Form(...),
    senha: str = Form(...),
    foto_perfil: UploadFile = File(None)
):
    # Validação de Idade
    # Convertemos a data que veio do formulário (string) para um objeto de data
    data_nascimento = datetime.strptime(data_nasc, "%Y-%m-%d")
    hoje = datetime.now()

    # Aqui ocorre o cálculo de idade
    # 1. Subtraímos os anos.
    # 2. Verificamos se o dia/mês atual já passou do dia/mês de nascimento.
    # Se não passou, subtraímos 1 da idade.
    idade = hoje.year - data_nascimento.year - ((hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day))

    # Se a idade for menor que 18 (inclui datas futuras que geram idade negativa) vai ser barrado aqui
    if idade < 18:
        return templates.TemplateResponse(
            request=request, 
            name="cadastro.html", 
            context={"request": request, "mensagem": "Você precisa ter pelo menos 18 anos para se cadastrar."}
        )

    caminho_final = "assets/fotoPerfilDefault.png"

    # Verificação e salvamento da foto de perfil, se houver
    if foto_perfil and foto_perfil.filename:
        pasta_destino = os.path.join("assets", "uploads")
        os.makedirs(pasta_destino, exist_ok=True)
        
        extensao = os.path.splitext(foto_perfil.filename)[1]
        nome_arquivo = f"{cpf}{extensao}"

        caminho_disco = os.path.join(pasta_destino, nome_arquivo)
        
        # Salva o arquivo
        with open(caminho_disco, "wb") as buffer:
            shutil.copyfileobj(foto_perfil.file, buffer)
        
        # Caminho que vai para o banco de dados
        caminho_final = f"assets/uploads/{nome_arquivo}"

    bytes_senha = senha.encode('utf-8')
    salt = bcrypt.gensalt()
    senha_cripto = bcrypt.hashpw(bytes_senha, salt).decode('utf-8')

    conexao = obter_conexao()
    if not conexao:
        return templates.TemplateResponse(
            request=request, 
            name="cadastro.html",
            context={"request": request, "mensagem": "Erro de conexão com o banco."})
    try:
        cursor = conexao.cursor()

        sql = """
            INSERT INTO Usuario(cpf, nome, email, telefone, data_nasc, senha, caminho_final)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        valores = (cpf, nome, email, telefone, data_nasc, senha_cripto, caminho_final)

        cursor.execute(sql, valores)
        conexao.commit()

        return templates.TemplateResponse(
            request=request, 
            name="login.html", 
            context={"request": request, "mensagem": "Cadastro realizado com sucesso! Faça seu login."})
    
    except Exception as e:
        print(f"Erro no banco: {e}")
        return templates.TemplateResponse(
            request=request, 
            name="cadastro.html", 
            context={"request": request, "mensagem": "Erro: CPF ou E-mail já estão em uso."})  
    
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.get("/login")
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

        sql = "Select cpf, nome, senha, permissao, caminho_final FROM Usuario WHERE email = %s"
        cursor.execute(sql, (email,))
        usuario = cursor.fetchone()

        if not usuario:
            return templates.TemplateResponse(
                request=request,
                name="login.html", 
                context={"request": request, "mensagem": "E-mail ou senha incorretos."}
            )
        
        bytes_senha_digitada = senha.encode('utf-8')
        bytes_senha_banco = usuario['senha'].encode('utf-8')

        senha_valida = bcrypt.checkpw(bytes_senha_digitada, bytes_senha_banco)

        if not senha_valida:
            return templates.TemplateResponse(
                request=request,
                name="login.html", 
                context={"request": request, "mensagem": "E-mail ou senha incorretos."}
            )
        
        resposta = RedirectResponse(url="/", status_code=303)
        resposta.set_cookie(key="usuario_nome", value=usuario['nome'])
        resposta.set_cookie(key="usuario_cpf", value=usuario['cpf'])
        resposta.set_cookie(key="usuario_permissao", value=usuario['permissao'])

        resposta.set_cookie(key="senha_usuario", value=usuario['senha'])
        resposta.set_cookie(key="usuario_caminho_final", value=usuario['caminho_final'])
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


@app.get("/logout")
async def logout():
    resposta = RedirectResponse(url="/", status_code=303)
    resposta.delete_cookie("usuario_nome")
    resposta.delete_cookie("usuario_cpf")
    resposta.delete_cookie("usuario_permissao")  # cookie de permissão também precisa ser removido
    return resposta


#  CRUD Admin - GET para acessar o painel
@app.get("/admin")
async def painel_admin(request: Request):
    if not _is_admin(request):
        return RedirectResponse(url="/login", status_code=303)

    return templates.TemplateResponse(
        request=request,
        name="admin.html",
        context={"request": request}
    )


#  CRUD das Salas (para o admin criar, listar e deletar as salas de sessões do cinema)

# CRUD Salas - Get (para listar as salas já criadas)
@app.get("/api/admin/salas")
async def listar_salas(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)    
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Sala ORDER BY id")
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# Salas - Post (criar nova sala, informando a quantidade de assentos)
@app.post("/api/admin/salas")
async def criar_sala(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    qtde = body.get("qtde_assentos")
    if not qtde:
        return JSONResponse({"erro": "qtde_assentos é obrigatório"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute("INSERT INTO Sala (qtde_assentos) VALUES (%s)", (qtde,))
        conexao.commit()
        return JSONResponse({"id": cursor.lastrowid, "qtde_assentos": qtde}, status_code=201)
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

# CRUD Salas - Put (editar a quantidade de assentos de uma sala)
@app.put("/api/admin/salas/{sala_id}")
async def atualizar_sala(request: Request, sala_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    qtde = body.get("qtde_assentos")
    if not qtde:
        return JSONResponse({"erro": "qtde_assentos é obrigatório"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE Sala SET qtde_assentos = %s WHERE id = %s", (qtde, sala_id))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Sala não encontrada"}, status_code=404)
        return JSONResponse({"mensagem": "Sala atualizada com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD Salas - Delete (deletar sala, informando o id da sala)
@app.delete("/api/admin/salas/{sala_id}")
async def deletar_sala(request: Request, sala_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM Sala WHERE id = %s", (sala_id,))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Sala não encontrada"}, status_code=404)
        return JSONResponse({"mensagem": "Sala removida com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": "Não é possível remover: existem sessões vinculadas a esta sala."}, status_code=409)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


#  CRUD de Filmes (para o admin criar, listar e deletar os filmes do cinema)

# CRUD de Filmes - Get (para listar os filmes já criados)
@app.get("/api/admin/filmes")
async def listar_filmes_db(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Filme ORDER BY id")
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

# CRUD de Filmes - Post (criar novo filme, informando o tmdb_id, nome, duração e descrição)
@app.post("/api/admin/filmes")
async def criar_filme_db(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    tmdb_id  = body.get("tmdb_id")
    nome     = body.get("nome")
    duracao  = body.get("duracao")
    descricao = body.get("descricao", "")
    if not all([tmdb_id, nome, duracao]):
        return JSONResponse({"erro": "tmdb_id, nome e duracao são obrigatórios"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute(
            "INSERT INTO Filme (tmdb_id, nome, duracao, descricao) VALUES (%s, %s, %s, %s)",
            (tmdb_id, nome, duracao, descricao)
        )
        conexao.commit()
        return JSONResponse({"id": cursor.lastrowid}, status_code=201)
    except Exception as e:
        return JSONResponse({"erro": "tmdb_id já cadastrado ou outro erro: " + str(e)}, status_code=409)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Filmes - Delete (remover filme, informando o id do filme)
@app.delete("/api/admin/filmes/{filme_id}")
async def deletar_filme_db(request: Request, filme_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM Filme WHERE id = %s", (filme_id,))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Filme não encontrado"}, status_code=404)
        return JSONResponse({"mensagem": "Filme removido com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": "Não é possível remover: existem sessões vinculadas a este filme."}, status_code=409)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Filmes - Put (editar nome, duração e descrição de um filme já cadastrado)
@app.put("/api/admin/filmes/{filme_id}")
async def atualizar_filme_db(request: Request, filme_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    nome     = body.get("nome")
    duracao  = body.get("duracao")
    descricao = body.get("descricao", "")
    if not nome or not duracao:
        return JSONResponse({"erro": "nome e duracao são obrigatórios"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute(
            "UPDATE Filme SET nome = %s, duracao = %s, descricao = %s WHERE id = %s",
            (nome, duracao, descricao, filme_id)
        )
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Filme não encontrado"}, status_code=404)
        return JSONResponse({"mensagem": "Filme atualizado com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# Busca filmes no TMDB pelo nome (para o admin encontrar o tmdb_id correto)
@app.get("/api/admin/buscar-tmdb")
async def buscar_tmdb(q: str, request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    url_busca = f"https://api.themoviedb.org/3/search/movie?api_key={API_KEY}&language=pt-BR&query={q}"
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_busca)
        dados = resposta.json()
        resultados = dados.get("results", [])[:8]
        filmes = [
            {
                "tmdb_id": r["id"],
                "nome": r.get("title", ""),
                "descricao": r.get("overview", ""),
                "data_lancamento": r.get("release_date", ""),
            }
            for r in resultados
        ]
    return filmes


# Busca os detalhes completos de um filme no TMDB pelo tmdb_id (inclui duração)
@app.get("/api/admin/tmdb-detalhes/{tmdb_id}")
async def tmdb_detalhes_admin(tmdb_id: int, request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    url_det = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={API_KEY}&language=pt-BR"
    async with httpx.AsyncClient(verify=False) as client:
        resposta = await client.get(url_det)
        dados = resposta.json()
    return {
        "tmdb_id": tmdb_id,
        "nome": dados.get("title", ""),
        "duracao": dados.get("runtime", 0),
        "descricao": dados.get("overview", ""),
    }


#  CRUD de Sessões (para o admin criar, listar e deletar as sessões do cinema)

# CRUD de Sessões - Get (para listar as sessões já criadas, mostrando o nome do filme, sala, horário e se é dub ou leg)
@app.get("/api/admin/sessoes")
async def listar_sessoes(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = """
            SELECT s.id, f.nome AS filme_nome,
                   sa.id AS sala_id, sa.qtde_assentos,
                   s.fk_Sala_id, s.fk_Filme_id,
                   s.horario_inicio, s.dub_leg
            FROM sessao s
            JOIN Filme f  ON s.fk_Filme_id = f.id
            JOIN Sala  sa ON s.fk_Sala_id  = sa.id
            ORDER BY s.horario_inicio DESC
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        # Serializa datetime para string
        for r in rows:
            if r.get("horario_inicio"):
                r["horario_inicio"] = r["horario_inicio"].strftime("%Y-%m-%d %H:%M")
        return rows
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Sessões - Post (criar nova sessão, informando o id da sala, id do filme, horário e se é dub ou leg)
@app.post("/api/admin/sessoes")
async def criar_sessao(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    fk_sala   = body.get("fk_Sala_id")
    fk_filme  = body.get("fk_Filme_id")
    horario   = body.get("horario_inicio")   # "YYYY-MM-DDTHH:MM"
    dub_leg   = body.get("dub_leg")
    if not all([fk_sala, fk_filme, horario, dub_leg]):
        return JSONResponse({"erro": "Todos os campos são obrigatórios"}, status_code=400)
    if dub_leg not in ("DUB", "LEG"):
        return JSONResponse({"erro": "dub_leg deve ser DUB ou LEG"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute(
            "INSERT INTO sessao (fk_Sala_id, fk_Filme_id, horario_inicio, dub_leg) VALUES (%s, %s, %s, %s)",
            (fk_sala, fk_filme, horario, dub_leg)
        )
        conexao.commit()
        return JSONResponse({"id": cursor.lastrowid}, status_code=201)
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Sessões - Delete (remover sessão, informando o id da sessão)
@app.delete("/api/admin/sessoes/{sessao_id}")
async def deletar_sessao(request: Request, sessao_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM sessao WHERE id = %s", (sessao_id,))
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Sessão não encontrada"}, status_code=404)
        return JSONResponse({"mensagem": "Sessão removida com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": "Não é possível remover: existem ingressos vinculados a esta sessão."}, status_code=409)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Sessões - Put (editar sala, filme, horário e tipo de uma sessão já cadastrada)
@app.put("/api/admin/sessoes/{sessao_id}")
async def atualizar_sessao(request: Request, sessao_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    fk_sala  = body.get("fk_Sala_id")
    fk_filme = body.get("fk_Filme_id")
    horario  = body.get("horario_inicio")
    dub_leg  = body.get("dub_leg")
    if not all([fk_sala, fk_filme, horario, dub_leg]):
        return JSONResponse({"erro": "Todos os campos são obrigatórios"}, status_code=400)
    if dub_leg not in ("DUB", "LEG"):
        return JSONResponse({"erro": "dub_leg deve ser DUB ou LEG"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute(
            "UPDATE sessao SET fk_Sala_id=%s, fk_Filme_id=%s, horario_inicio=%s, dub_leg=%s WHERE id=%s",
            (fk_sala, fk_filme, horario, dub_leg, sessao_id)
        )
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Sessão não encontrada"}, status_code=404)
        return JSONResponse({"mensagem": "Sessão atualizada com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Ingressos - Put (atualizar apenas o assento de um ingresso)
@app.put("/api/admin/ingressos/{ingresso_id}/assento")
async def atualizar_assento(request: Request, ingresso_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    numero_assento = body.get("numero_assento", "").strip().upper()
    if not numero_assento:
        return JSONResponse({"erro": "numero_assento é obrigatório"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute(
            "UPDATE Ingresso SET numero_assento = %s WHERE id = %s",
            (numero_assento, ingresso_id)
        )
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Ingresso não encontrado"}, status_code=404)
        return JSONResponse({"mensagem": "Assento atualizado com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# Assentos por Sessão - Get (lista os ingressos/assentos ocupados de uma sessão específica)
@app.get("/api/admin/sessoes/{sessao_id}/assentos")
async def listar_assentos_sessao(request: Request, sessao_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = """
            SELECT
                i.id            AS ingresso_id,
                i.numero_assento,
                u.nome          AS usuario_nome,
                u.cpf           AS usuario_cpf,
                p.status        AS status_pagamento
            FROM Ingresso i
            JOIN Pagamento p ON i.fk_Pagamento_id = p.id
            JOIN Usuario   u ON p.fk_Usuario_cpf  = u.cpf
            WHERE i.fk_sessao_id = %s
            ORDER BY i.numero_assento
        """
        cursor.execute(sql, (sessao_id,))
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Ingresssos - Get (para listar os ingressos vendidos, mostrando o número do assento, nome do usuário, cpf, email, nome do filme, horário da sessão, sala, se é dub ou leg, 
# valor total pago, status do pagamento e método de pagamento)
@app.get("/api/admin/ingressos")
async def listar_ingressos(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor(dictionary=True)
        sql = """
            SELECT
                i.id,
                i.numero_assento,
                i.fk_sessao_id,
                p.id            AS pagamento_id,
                u.nome          AS usuario_nome,
                u.cpf           AS usuario_cpf,
                u.email         AS usuario_email,
                f.nome          AS filme_nome,
                se.horario_inicio,
                sa.id           AS sala_id,
                se.dub_leg,
                p.valor_total,
                p.status,
                p.metodo_pagamento,
                p.criado_em
            FROM Ingresso i
            JOIN Pagamento p ON i.fk_Pagamento_id = p.id
            JOIN Usuario   u ON p.fk_Usuario_cpf  = u.cpf
            JOIN sessao   se ON i.fk_sessao_id    = se.id
            JOIN Filme     f ON se.fk_Filme_id    = f.id
            JOIN Sala     sa ON se.fk_Sala_id     = sa.id
            ORDER BY p.criado_em DESC
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        for r in rows:
            if r.get("horario_inicio"):
                r["horario_inicio"] = r["horario_inicio"].strftime("%Y-%m-%d %H:%M")
            if r.get("criado_em"):
                r["criado_em"] = r["criado_em"].strftime("%Y-%m-%d %H:%M")
            if r.get("valor_total") is not None:
                r["valor_total"] = float(r["valor_total"])
        return rows
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


@app.delete("/api/admin/ingressos/{ingresso_id}")
async def cancelar_ingresso(request: Request, ingresso_id: int):
    """
    Cancela (deleta) um ingresso e marca o pagamento como ESTORNADO.
    Só cancela se o pagamento não for RECUSADO.
    """
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor(dictionary=True)
        # Busca o pagamento vinculado
        cursor.execute(
            "SELECT fk_Pagamento_id FROM Ingresso WHERE id = %s", (ingresso_id,)
        )
        row = cursor.fetchone()
        if not row:
            return JSONResponse({"erro": "Ingresso não encontrado"}, status_code=404)

        pagamento_id = row["fk_Pagamento_id"]

        # Deleta o ingresso
        cursor.execute("DELETE FROM Ingresso WHERE id = %s", (ingresso_id,))

        # Marca pagamento como ESTORNADO
        cursor.execute(
            "UPDATE Pagamento SET status = 'ESTORNADO' WHERE id = %s", (pagamento_id,)
        )
        conexao.commit()
        return JSONResponse({"mensagem": "Ingresso cancelado e pagamento estornado."})
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Ingressos - Post (criar ingresso manualmente pelo admin, com pagamento)
@app.post("/api/admin/ingressos")
async def criar_ingresso_admin(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    cpf          = body.get("fk_Usuario_cpf")
    sessao_id    = body.get("fk_sessao_id")
    valor_total  = body.get("valor_total")
    metodo       = body.get("metodo_pagamento")
    status       = body.get("status", "PENDENTE")

    if not all([cpf, sessao_id, valor_total, metodo]):
        return JSONResponse({"erro": "cpf, fk_sessao_id, valor_total e metodo_pagamento são obrigatórios"}, status_code=400)
    if metodo not in ("PIX", "CARTAO_CREDITO", "CARTAO_DEBITO"):
        return JSONResponse({"erro": "metodo_pagamento inválido"}, status_code=400)
    if status not in ("PENDENTE", "APROVADO", "RECUSADO"):
        return JSONResponse({"erro": "status inválido"}, status_code=400)

    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        # Cria o pagamento
        cursor.execute(
            "INSERT INTO Pagamento (valor_total, metodo_pagamento, status, fk_Usuario_cpf) VALUES (%s, %s, %s, %s)",
            (valor_total, metodo, status, cpf)
        )
        pagamento_id = cursor.lastrowid
        # Cria o ingresso (sem assento definido, pois é manual)
        cursor.execute(
            "INSERT INTO Ingresso (fk_Pagamento_id, fk_sessao_id) VALUES (%s, %s)",
            (pagamento_id, sessao_id)
        )
        conexao.commit()
        return JSONResponse({"id": cursor.lastrowid, "pagamento_id": pagamento_id}, status_code=201)
    except Exception as e:
        return JSONResponse({"erro": "CPF não encontrado ou sessão inválida: " + str(e)}, status_code=409)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()


# CRUD de Pagamentos - Put (alterar o status de um pagamento)
@app.put("/api/admin/pagamentos/{pagamento_id}/status")
async def atualizar_status_pagamento(request: Request, pagamento_id: int):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    body = await request.json()
    novo_status = body.get("status")
    if novo_status not in ("PENDENTE", "APROVADO", "RECUSADO", "ESTORNADO"):
        return JSONResponse({"erro": "Status inválido"}, status_code=400)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor()
        cursor.execute(
            "UPDATE Pagamento SET status = %s WHERE id = %s", (novo_status, pagamento_id)
        )
        conexao.commit()
        if cursor.rowcount == 0:
            return JSONResponse({"erro": "Pagamento não encontrado"}, status_code=404)
        return JSONResponse({"mensagem": "Status atualizado com sucesso"})
    except Exception as e:
        return JSONResponse({"erro": str(e)}, status_code=500)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

# CRUD de Usuários (para o admin listar os usuários cadastrados, alterar a permissão de algum usuário ou deletar um usuário)
# CRUD de Usuários - Get (para listar os usuários cadastrados)
@app.get("/api/admin/usuarios")
async def listar_usuarios(request: Request):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    conexao = obter_conexao()
    if not conexao:
        return JSONResponse({"erro": "Erro de conexão"}, status_code=500)
    try:
        cursor = conexao.cursor(dictionary=True)
        # Traz os usuários, mas omite a senha para segurança
        cursor.execute("SELECT cpf, nome, email, telefone, permissao FROM Usuario ORDER BY nome")
        return cursor.fetchall()
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

# CRUD de Usuários - Put (para alterar a permissão de um usuário)
@app.put("/api/admin/usuarios/{cpf}/permissao")
async def alterar_permissao(request: Request, cpf: str):
    # Verifica se quem está tentando fazer a ação é um usuário com privilégios de administrador
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    
    cpf_logado = request.cookies.get("usuario_cpf")
    
    # O servidor bloqueia caso o admin tente alterar a própria permissão
    if cpf == cpf_logado:
        return JSONResponse({"erro": "Você não pode remover seus próprios privilégios de administrador!"}, status_code=403)
    # ---------------------------------

    body = await request.json()
    nova_permissao = body.get("permissao")
    
    if nova_permissao not in ("CLIENTE", "ADMINISTRADOR"):
        return JSONResponse({"erro": "Permissão inválida"}, status_code=400)
        
    conexao = obter_conexao()
    try:
        cursor = conexao.cursor()
        cursor.execute("UPDATE Usuario SET permissao = %s WHERE cpf = %s", (nova_permissao, cpf))
        conexao.commit()
        return JSONResponse({"mensagem": "Permissão atualizada com sucesso!"})
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

# CRUD de Usuários - Delete (para deletar um usuário ao informar o cpf do usuário)
@app.delete("/api/admin/usuarios/{cpf}")
async def deletar_usuario_admin(request: Request, cpf: str):
    if not _is_admin(request):
        return JSONResponse({"erro": "Acesso negado"}, status_code=403)
    
    # Imepde o admin de deletar a própria conta com base no cookie de cpf, comparando com o cpf do usuário que se quer deletar
    cpf_logado = request.cookies.get("usuario_cpf")
    if cpf == cpf_logado:
        return JSONResponse({"erro": "Você não pode eliminar a sua própria conta através do painel de administração!"}, status_code=403)
    # ---------------------------------------------------

    conexao = obter_conexao()
    try:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM Usuario WHERE cpf = %s", (cpf,))
        conexao.commit()
        return JSONResponse({"mensagem": "Usuário removido"})
    except Exception as e:
        return JSONResponse({"erro": "Não pode deletar o Usuário! O usuário possui pagamentos/ingressos vinculados."}, status_code=409)
    finally:
        if conexao.is_connected():
            cursor.close()
            conexao.close()

#  CRUD de Perfil e Compras (para o usuário atualizar seus dados, ver seus ingressos comprados e cancelar algum ingresso)
@app.get("/perfil")
async def carregar_perfil(request: Request):
    cpf_logado = request.cookies.get("usuario_cpf")

    if not cpf_logado:
        return RedirectResponse(url="/login", status_code=303)
    
    conexao = obter_conexao()
    if not conexao:
        return RedirectResponse(url="/", status_code=303)
    
    try:
        cursor = conexao.cursor(dictionary=True)

        # Aqui a parte do READ do CRUD
        sql = "SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s"
        cursor.execute(sql, (cpf_logado,))
        usuario_dados = cursor.fetchone()

        return templates.TemplateResponse(
            request=request,
            name="perfil.html",
            context={"request": request, "usuario": usuario_dados}
        )
    
    except Exception as e:
        print(f"Erro ao carregar perfil: {e}")
        return RedirectResponse(url="/", status_code=303)
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

# Crud de Perfil - Update (para atualizar os dados do usuário, informando nome, email, telefone e data de nascimento)
@app.post("/atualizar_perfil")
async def atualizar_perfil(
    request: Request,
    nome: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(...),
    data_nasc: str = Form(...)
):
    cpf_logado = request.cookies.get("usuario_cpf")
    if not cpf_logado:
        return RedirectResponse(url="/login", status_code=303)
    
    conexao = obter_conexao()
    if not conexao:
        return RedirectResponse(url="/", status_code=303)
    
    try:
        cursor = conexao.cursor(dictionary=True)

        # Aqui que rola o update
        sql_update = """
            UPDATE Usuario
            SET nome = %s, email = %s, telefone = %s, data_nasc = %s
            WHERE cpf = %s
        """
        cursor.execute(sql_update, (nome, email, telefone, data_nasc, cpf_logado))
        conexao.commit()

        cursor.execute("SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s", (cpf_logado,))
        usuario_atualizado = cursor.fetchone()

        resposta = RedirectResponse(url="/perfil", status_code=303)
        resposta = templates.TemplateResponse(
            request = request,
            name = "perfil.html",
            context = {"request": request, "usuario": usuario_atualizado, "mensagem": "Dados atualizados com sucesso!"}
        )
        
        resposta.set_cookie(key="usuario_nome", value = nome)

        return resposta
    
    except Exception as e:
        print(f"Erro ao atualizar: {e}")

        return RedirectResponse(url="perfil", status_code=303)
    
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

@app.post("/atualizar_foto_perfil")
async def atualizar_foto_perfil(
    request: Request,
    excluir_foto: str = Form(None),
    foto_perfil: UploadFile = File(None)
):
    cpf_logado = request.cookies.get("usuario_cpf")
    if not cpf_logado:
        return RedirectResponse(url="/login", status_code=303)
    
    conexao = obter_conexao()
    if not conexao:
        return RedirectResponse(url="/", status_code=303)
    
    # Caso o usuário enviou uma NOVA FOTO
    elif foto_perfil and foto_perfil.filename:
        os.makedirs("assets/uploads", exist_ok=True)
        extensao = os.path.splitext(foto_perfil.filename)[1]
        nome_arquivo = f"{cpf_logado}{extensao}"
        caminho_disco = os.path.join("assets/uploads", nome_arquivo)
        
        with open(caminho_disco, "wb") as buffer:
            shutil.copyfileobj(foto_perfil.file, buffer)
        
        caminho_foto = f"assets/uploads/{nome_arquivo}"

    # Caso o usuário clicou em EXCLUIR
    if excluir_foto == "true":
        caminho_foto = "assets/fotoPerfilDefault.png"


    try:
        cursor = conexao.cursor(dictionary=True)

        # Aqui que rola o update
        sql_update = """
            UPDATE Usuario
            SET caminho_final = %s
            WHERE cpf = %s
        """
        cursor.execute(sql_update, (caminho_foto, cpf_logado))
        conexao.commit()

        cursor.execute("SELECT cpf FROM Usuario WHERE cpf = %s", (cpf_logado,))
        usuario_atualizado = cursor.fetchone()

        resposta = RedirectResponse(url="/perfil", status_code=303)
        resposta = templates.TemplateResponse(
            request = request,
            name = "perfil.html",
            context = {"request": request, "usuario": usuario_atualizado, "mensagem": "Imagem de perfil atualizada com sucesso!"}
        )
        
        resposta.set_cookie(key="usuario_caminho_final", value=caminho_foto)

        return resposta
    
    except Exception as e:
        print(f"Erro ao atualizar: {e}")

        return RedirectResponse(url="perfil", status_code=303)
    
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


# Crud de Perfil - Delete (para deletar a conta do usuário, informando o cpf)
@app.post("/deletar_conta")
async def deletar_conta(request: Request):
    cpf_logado = request.cookies.get("usuario_cpf")

    if not cpf_logado:
        return RedirectResponse(url = "/login", status_code=303)
    
    conexao = obter_conexao()
    if not conexao:
        return RedirectResponse(url="/", status_code=303)
    
    try:
        cursor = conexao.cursor()

        cursor.execute("DELETE FROM Usuario WHERE cpf = %s", (cpf_logado,)) 
        conexao.commit()

        resposta = RedirectResponse(url="/", status_code=303)
        resposta.delete_cookie("usuario_nome")
        resposta.delete_cookie("usuario_cpf")
        resposta.delete_cookie("usuario_permissao")
        return resposta

    except Exception as e:
        print(f"Erro ao deletar conta: {e}")

        cursor.execute("SELECT cpf, nome, email, telefone, data_nasc FROM Usuario WHERE cpf = %s", (cpf_logado,))
        usuario_atualizado = cursor.fetchone()

        return templates.TemplateResponse(
            request = request,
            name="perfil.html",
            context={
                "request": request,
                "usuario": usuario_atualizado,
                "mensagem": "Erro: Não é possível excluir a conta pois existem ingressos vinculados a ela."
                }
        )
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()

# Crud de Pagamentos (para o usuário escolher o método de pagamento, ver o resumo da compra e confirmar a compra do ingresso)

# Crud de Pagamentos - Get (para mostrar a página de pagamento, onde o usuário escolhe o método de pagamento, vê o resumo da compra e confirma a compra do ingresso)
@app.get("/pagamento")
async def pagamento(request: Request):
    # Verifica se o usuário tem o cookie de CPF (ou seja, se está logado)
    usuario_logado = request.cookies.get("usuario_cpf")

    if not usuario_logado:
        # Se não estiver logado, redireciona para a página de login
        # Você pode passar um parâmetro 'proxima' para voltar aqui depois do login
        return RedirectResponse(url="/login", status_code=303)

    return templates.TemplateResponse(
        request=request,
        name="pagamento.html",
        context={"request": request}
    )

@app.get("/assentos")
async def assentos(request: Request):
    # Verifica se o usuário tem o cookie de CPF (ou seja, se está logado)
    usuario_logado = request.cookies.get("usuario_cpf")

    if not usuario_logado:
        # Se não estiver logado, redireciona para a página de login
        return RedirectResponse(url="/login", status_code=303)

    return templates.TemplateResponse(
        request=request,
        name="assentos.html",
        context={"request": request}
    )
