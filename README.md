# 🛢️ dbdump

A lightweight, TypeScript-powered utility to generate **MySQL database dumps** as SQL files with clean `INSERT` statements. Ideal for backups, migrations, and data snapshots in Node.js projects.

---

## ✨ Features

- ✅ Dump full MySQL tables with data as `.sql` files  
- 🔒 Handles escaping and nulls safely  
- 🔧 Fully typed with TypeScript  
- 📦 Easily used as an npm package in Node.js apps  
- 🚀 Fast and minimal dependencies  

---

## 📦 Installation

```bash
npm install dbdump
```

---

## 🚀 Usage

### 1. Import & Use in Node.js App

```ts
import { MySQLDumper } from 'dbdump';

const dumper = new MySQLDumper({
  host: 'localhost',
  user: 'root',
  password: 'your-password',
  database: 'your-database',
  outputFile: './dump.sql'
});

await dumper.dump();
```

---

## 📂 Output Example (`dump.sql`)

```sql
-- Dump of database mydb

INSERT INTO `users` (`id`, `name`, `email`) VALUES (1, 'Alice', 'alice@example.com');
INSERT INTO `users` (`id`, `name`, `email`) VALUES (2, 'Bob', 'bob@example.com');
```

---

## ⚙️ Configuration Options

| Option       | Type     | Description                        |
|--------------|----------|------------------------------------|
| `host`       | string   | MySQL host (default: `localhost`)  |
| `port`       | number   | MySQL port (default: `3306`)       |
| `user`       | string   | MySQL username                     |
| `password`   | string   | MySQL password                     |
| `database`   | string   | Database name to dump              |
| `outputFile` | string   | Path to output `.sql` file         |

---

## 🔧 Future Plans

- [ ] CLI tool support (`npx dbdump ...`)
- [ ] Table filtering (`includeTables`, `excludeTables`)
- [ ] Option to dump `CREATE TABLE` statements
- [ ] Add support for PostgreSQL, MongoDB, and more

---

## 🧑‍💻 Author

Made with 💻 and ☕ by **Dhanush S**

[GitHub](https://github.com/your-username) • [npm](https://www.npmjs.com/package/dbdump)

---

## 📝 License

MIT © Dhanush S
