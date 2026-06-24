const db = require('./api-db');

const seedBooks = [
  {
    title: 'Domain-Driven Design',
    author: 'Eric Evans',
    category: 'Engenharia de software',
    description:
      'Livro sobre modelagem de software, linguagem ubiqua, entidades, agregados, repositorios e desenho orientado ao dominio.',
    status: 'available'
  },
  {
    title: 'Refactoring',
    author: 'Martin Fowler',
    category: 'Engenharia de software',
    description:
      'Livro sobre melhoria incremental de codigo, refatoracao, legibilidade, testes e qualidade interna de sistemas.',
    status: 'checked_out'
  },
  {
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    category: 'Engenharia de software',
    description:
      'Livro sobre arquitetura de software, regras de negocio, camadas, independencia de frameworks e organizacao de sistemas.',
    status: 'available'
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    category: 'Historia e sociedade',
    description:
      'Livro sobre historia da humanidade, evolucao cultural, sociedades antigas, revolucao cognitiva, agricultura e formacao das civilizacoes.',
    status: 'available'
  },
  {
    title: 'Guns, Germs, and Steel',
    author: 'Jared Diamond',
    category: 'Historia e sociedade',
    description:
      'Livro sobre historia global, geografia, agricultura, tecnologia, doencas e fatores que influenciaram o desenvolvimento das sociedades.',
    status: 'available'
  },
  {
    title: 'Cosmos',
    author: 'Carl Sagan',
    category: 'Astronomia e ciencia',
    description:
      'Livro sobre astronomia, universo, planetas, estrelas, exploracao espacial, ciencia, origem da vida e curiosidade humana.',
    status: 'available'
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Astronomia e ciencia',
    description:
      'Livro sobre cosmologia, buracos negros, origem do universo, tempo, espaco, fisica teorica e perguntas fundamentais da ciencia.',
    status: 'available'
  },
  {
    title: "The Omnivore's Dilemma",
    author: 'Michael Pollan',
    category: 'Alimentacao e saude',
    description:
      'Livro sobre alimentacao, agricultura, industria alimentar, escolhas de consumo, saude, comida natural e impacto ambiental.',
    status: 'available'
  },
  {
    title: 'In Defense of Food',
    author: 'Michael Pollan',
    category: 'Alimentacao e saude',
    description:
      'Livro sobre nutricao, habitos alimentares, dieta, comida de verdade, saude publica e critica aos alimentos ultraprocessados.',
    status: 'checked_out'
  },
  {
    title: 'Dom Quixote',
    author: 'Miguel de Cervantes',
    category: 'Literatura',
    description:
      'Romance classico sobre aventura, imaginacao, idealismo, critica social, cavalaria, humor e personagens da literatura universal.',
    status: 'available'
  },
  {
    title: 'Memorias Postumas de Bras Cubas',
    author: 'Machado de Assis',
    category: 'Literatura',
    description:
      'Romance brasileiro sobre ironia, sociedade, morte, memoria, narrador defunto, critica social e literatura realista.',
    status: 'available'
  },
  {
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James F. Kurose e Keith W. Ross',
    category: 'Tecnologia e computacao',
    description:
      'Livro sobre redes de computadores, internet, protocolos TCP IP, roteadores, pacotes, servidores, camadas de rede e comunicacao entre sistemas.',
    status: 'available'
  },
  {
    title: 'Redes de Computadores',
    author: 'Andrew S. Tanenbaum',
    category: 'Tecnologia e computacao',
    description:
      'Livro sobre infraestrutura de redes, arquitetura de protocolos, enderecamento IP, transmissao de dados, seguranca, servidores e sistemas distribuidos.',
    status: 'available'
  },
  {
    title: 'Linked: The New Science of Networks',
    author: 'Albert-Laszlo Barabasi',
    category: 'Sociologia e sociedade',
    description:
      'Livro sobre redes sociais, conexoes humanas, ciencia das redes, influencia, comunidades, comportamento coletivo e relacoes entre pessoas.',
    status: 'available'
  },
  {
    title: 'The Strength of Weak Ties',
    author: 'Mark Granovetter',
    category: 'Sociologia e sociedade',
    description:
      'Estudo sobre lacos sociais, redes de relacionamento, conexoes fracas, oportunidades, mobilidade social, influencia e pontes entre grupos.',
    status: 'available'
  }
];

function createDatabase() {
  const knex = db.createKnex();

  return knex
    .raw('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8 COLLATE utf8_general_ci', [db.database])
    .then(function() {
      return knex.destroy();
    });
}

function createTables(knex) {
  return knex.schema.hasTable('books').then(function(exists) {
    if (exists) return;

    return knex.schema.createTable('books', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('author').notNullable();
      table.string('category').notNullable();
      table.text('description').notNullable();
      table
        .string('status')
        .notNullable()
        .defaultTo('available');
      table
        .timestamp('created_at')
        .notNullable()
        .defaultTo(knex.fn.now());
    });
  });
}

function ensureDescriptionColumn(knex) {
  return knex.schema.hasColumn('books', 'description').then(function(exists) {
    if (exists) return;

    return knex.schema.table('books', function(table) {
      table.text('description').nullable();
    });
  });
}

function ensureCategoryColumn(knex) {
  return knex.schema.hasColumn('books', 'category').then(function(exists) {
    if (exists) return;

    return knex.schema.table('books', function(table) {
      table.string('category').nullable();
    });
  });
}

function seedTable(knex) {
  return Promise.all(
    seedBooks.map(function(book) {
      return knex('books')
        .where({title: book.title})
        .first()
        .then(function(existing) {
          if (existing) {
            return knex('books')
              .where({id: existing.id})
              .update({
                author: book.author,
                category: book.category,
                description: book.description,
                status: book.status
              });
          }

          return knex('books').insert(book);
        });
    })
  );
}

function backfillCategory(knex) {
  return knex('books')
    .whereNull('category')
    .update({category: 'Sem categoria'});
}

function backfillDescription(knex) {
  return knex('books')
    .whereNull('description')
    .update({description: 'Registro criado antes da ampliacao da base de livros.'});
}

function prepareExistingRows(knex) {
  return Promise.all([backfillCategory(knex), backfillDescription(knex)]);
}

createDatabase()
  .then(function() {
    const api = db.createBookshelf();

    return createTables(api.knex)
      .then(function() {
        return ensureDescriptionColumn(api.knex);
      })
      .then(function() {
        return ensureCategoryColumn(api.knex);
      })
      .then(function() {
        return prepareExistingRows(api.knex);
      })
      .then(function() {
        return seedTable(api.knex);
      })
      .then(function() {
        console.log('Database ready: ' + api.database);
        console.log('Table ready: books');
        return api.knex.destroy();
      });
  })
  .catch(function(error) {
    console.error(error.stack || error.message);
    process.exit(1);
  });
