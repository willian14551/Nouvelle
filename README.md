# Nouvelle 🚀

Projeto desenvolvido para a disciplina de **Experiência Criativa: Implementação de Sistemas de Informação** do curso de **Sistemas de Informação da PUCPR**. 

O Nouvelle é uma aplicação full-stack que integra um frontend dinâmico com um backend robusto em FastAPI.

## Como Executar o Projeto

Certifique-se de ter o Python e o Node.js instalados em sua máquina antes de começar.

### 1. Configurando o programa

Navegue até a pasta do nouvelle e configure o ambiente virtual:

```CMD
# Entre na pasta
cd nouvelle

# Crie o ambiente virtual
python -m venv venv

# Ative o ambiente (Windows)
.\venv\Scripts\activate

# Ative o ambiente (Linux/macOS)
source venv/bin/activate

# Instale as dependências
pip install fastapi uvicorn pydantic pydantic-core mysql-connector-python bcrypt httpx python-multipart jinja2

# Inicie a backend
uvicorn main:app --reload

```
### 2. Usuário Default ADMIN

```
E-mail: admin@nouvelle.com
Senha: Admin@123
```

### Engenharia Reversa do Banco de Dados
<img width="568" height="781" alt="image" src="https://github.com/user-attachments/assets/bae0a12b-0c8d-4628-b383-38d41d4c18ae" />

