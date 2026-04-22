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
pip install fastapi uvicorn pydantic mysql-connector-python bcrypt httpx python-multipart

# Inicie a backend
uvicorn main:app --reload

```
