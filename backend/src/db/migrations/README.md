# Migrations

Migration files in this directory are executed in lexical order by `npm run db:migrate`.

The snapshot schema in ../schema.sql should be kept in sync with the migrations.

Recommended naming pattern:
- 001_extensions.sql
- 002_users.sql
- 003_driver_tables.sql

Run the migrations with:

npm run db:migrate
