-- Prisma Migrate needs to create/drop a temporary "shadow database" to
-- compute schema diffs. The default MYSQL_USER grant from the official
-- mysql image only covers the app database itself, so grant the minimal
-- global DDL privileges needed for that shadow database lifecycle.
GRANT CREATE, DROP, ALTER, INDEX, REFERENCES, CREATE TEMPORARY TABLES ON *.* TO 'mead'@'%';
FLUSH PRIVILEGES;
