package com.bookwise.infrastructure.schema;

import java.util.List;

/**
 * Metadados estruturais do banco de dados da aplicacao.
 */
public record SchemaResponse(
        Database database,
        List<Table> tables) {

    public record Database(
            String productName,
            String productVersion,
            String schemaName) {
    }

    public record Table(
            String name,
            List<Column> columns,
            List<String> primaryKey,
            List<ForeignKey> foreignKeys,
            List<String> uniqueConstraints) {
    }

    public record Column(
            String name,
            String type,
            Integer size,
            boolean nullable,
            boolean primaryKey,
            boolean autoIncrement,
            boolean unique) {
    }

    public record ForeignKey(
            String name,
            String column,
            String referencedTable,
            String referencedColumn) {
    }
}
