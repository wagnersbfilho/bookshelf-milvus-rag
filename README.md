# bookshelf.js

[![NPM Version](https://img.shields.io/npm/v/bookshelf.svg?style=flat)](https://www.npmjs.com/package/bookshelf)

Bookshelf is a JavaScript ORM for Node.js, built on the [Knex](http://knexjs.org) SQL query builder. It features both Promise-based and traditional callback interfaces, transaction support, eager/nested-eager relation loading, polymorphic associations, and support for one-to-one, one-to-many, and many-to-many relations.

It is designed to work with PostgreSQL, MySQL, and SQLite3.

[Website and documentation](http://bookshelfjs.org). The project is [hosted on GitHub](http://github.com/bookshelf/bookshelf/), and has a comprehensive [test suite](https://travis-ci.org/bookshelf/bookshelf).

## Evolução acadêmica: MySQL + Milvus + busca vetorial

Este fork foi desenvolvido a partir do repositorio original [`bookshelf/bookshelf`](https://github.com/bookshelf/bookshelf). A biblioteca original foi preservada como base de estudo, e foram adicionadas camadas demonstrativas para a disciplina **Desenvolvimento de Aplicacoes em Nuvem**.

O objetivo da evolucao foi transformar o projeto em uma pequena aplicacao híbrida:

- **MySQL**: base relacional como fonte de conhecimento.
- **Bookshelf/Knex**: camada ORM para acesso a tabela `books` em MySQL.
- **OpenAI Embeddings**: transformacao de texto em vetor semântico.
- **Milvus**: base vetorial para busca por proximidade.
- **Node.js HTTP**: páginas simples para consulta relacional e busca vetorial.

### 1. Camada Relacional adicionada

A camada relacional usa MySQL local e cria uma tabela `books` com livros de diferentes temas. Essa tabela é a base de conhecimento da aplicação.

Arquivos principais:

- `scripts/api-db.js`: centraliza a conexao MySQL com Knex e Bookshelf.
- `scripts/api-setup.js`: cria o banco `bookshelf`, cria/atualiza a tabela `books` e insere dados de exemplo.
- `scripts/api-page.js`: sobe uma pagina HTTP simples em `localhost:3000` listando os livros.

Estrutura principal da tabela `books`:

```text
id
title
author
category
description
status
created_at
```

### 2. Camada Vetorial adicionada

A camada vetorial usa Milvus para armazenar embeddings dos livros e permitir consultas por similaridade semântica.

Arquivos principais:

- `scripts/embedding-openai.js`: gera embeddings com o modelo `text-embedding-3-small` do OpenAI.
- `scripts/milvus-db.js`: cria/conecta na collection `book_embeddings` no Milvus.
- `scripts/hybrid-service.js`: orquestra MySQL, OpenAI Embeddings e Milvus.
- `scripts/hybrid-index-books.js`: indexa os livros do MySQL no Milvus.
- `scripts/hybrid-page.js`: sobe uma pagina de busca semantica em `localhost:3001`.

Collection vetorial:

```text
collection: book_embeddings
book_id: referencia ao books.id no MySQL
text: texto estruturado usado para gerar o embedding
vector: embedding de 1536 dimensoes
metric: COSINE
```

### 3. Fluxo implementado

Indexação:

```text
MySQL books
  -> texto estruturado com titulo, autor, tema, descricao e status
  -> OpenAI embedding text-embedding-3-small
  -> vetor de 1536 dimensoes
  -> insert no Milvus
```

Busca:

```text
prompt do usuario
  -> embedding da consulta
  -> busca vetorial no Milvus
  -> retorno de book_id similares
  -> consulta dos detalhes no MySQL
  -> exibicao dos resultados na pagina HTTP
```

Esta solução implementa a camada de **RETRIEVAL** de uma arquitetura **RAG simples**. Ela ainda não gera uma resposta final com LLM; apenas recupera os livros semanticamente mais próximos.

### 4. Dependências de infraestrutura

#### MySQL

A aplicacao espera um MySQL acessivel em:

```text
127.0.0.1:3306
```

Imagem Docker sugerida:

```text
mysql:5.7
```

Exemplo com Docker:

```bash
docker run --name bookshelf-mysql \
  -p 3306:3306 \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=bookshelf \
  -d mysql:5.7
```

Se preferir usar o `docker-compose.yml` deste projeto:

```bash
docker compose up -d mysql
```

Tambem e possivel usar MySQL local via XAMPP, desde que esteja ativo na porta `3306`.

#### Milvus

A aplicacao espera um Milvus acessivel em:

```text
127.0.0.1:19530
```

Imagem Docker principal:

```text
milvusdb/milvus
```

Em modo standalone, o Milvus normalmente usa tambem servicos auxiliares como `etcd` e `minio`. A forma mais simples e usar o compose ou script standalone oficial do Milvus, garantindo que a porta `19530` fique exposta para a aplicacao Node.js.

Variavel opcional:

```bash
MILVUS_ADDRESS=127.0.0.1:19530
```

### Variáveis de ambiente

Obrigatoria para embeddings reais:

```bash
OPENAI_API_KEY=sua_chave_openai
```

Opcionais:

```bash
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=bookshelf
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_CHARSET=utf8

MILVUS_COLLECTION=book_embeddings
MILVUS_ADDRESS=127.0.0.1:19530

EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
MIN_SIMILARITY=0.25
PORT=3001
```

### 5. Setup local

Instale as dependências. Como este é um projeto antigo e usa dependencias nativas legadas, pode ser necessario ignorar scripts de build do `sqlite3`:

```bash
npm install --ignore-scripts --legacy-peer-deps
```

Configure a chave OpenAI:

PowerShell:

```powershell
$env:OPENAI_API_KEY="sua_chave_openai"
```

Bash:

```bash
export OPENAI_API_KEY="sua_chave_openai"
```

Prepare o MySQL:

```bash
npm run api:setup
```

Prepare a collection no Milvus:

```bash
npm run hybrid:setup
```

Gere embeddings e indexe os livros no Milvus:

```bash
npm run hybrid:index
```

Suba a pagina de busca semantica:

```bash
npm run hybrid:start
```

Acesse:

```text
http://localhost:3001
```

Pagina relacional simples:

```bash
npm run api:start
```

```text
http://localhost:3000
```

### 6. Consultas sugeridas para teste

As categorias foram enriquecidas para testar proximidade vetorial entre temas distintos e termos ambiguos.

Exemplos:

```text
arquitetura de software
redes protocolos internet roteadores
redes sociais conexoes entre pessoas comunidades
historia das civilizacoes
universo estrelas planetas
alimentacao saudavel
romance classico e critica social
```

Essas consultas ajudam a demonstrar que o Milvus nao faz busca textual exata; ele recupera livros semanticamente proximos a partir dos embeddings.
