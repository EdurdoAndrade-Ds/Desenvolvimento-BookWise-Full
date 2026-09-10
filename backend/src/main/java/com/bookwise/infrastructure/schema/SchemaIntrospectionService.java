package com.bookwise.infrastructure.schema;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import javax.sql.DataSource;
import org.springframework.stereotype.Service;

/**
 * Le os metadados do schema real por meio da introspeccao JDBC.
 */
@Service
public class SchemaIntrospectionService {

    private final DataSource dataSource;

    public SchemaIntrospectionService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public SchemaResponse inspect() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            String schemaName = resolveSchema(connection.getSchema());
            List<String> tableNames = findTableNames(metadata, schemaName);
            List<SchemaResponse.Table> tables = tableNames.stream()
                    .map(tableName -> inspectTable(metadata, schemaName, tableName))
                    .toList();

            return new SchemaResponse(
                    new SchemaResponse.Database(
                            metadata.getDatabaseProductName(),
                            metadata.getDatabaseProductVersion(),
                            normalize(schemaName)),
                    tables);
        } catch (SQLException exception) {
            throw new IllegalStateException("Nao foi possivel ler o schema do banco.", exception);
        }
    }

    private List<String> findTableNames(DatabaseMetaData metadata, String schemaName) {
        List<String> tableNames = new ArrayList<>();
        try (ResultSet resultSet = metadata.getTables(null, schemaName, "%", new String[] {"TABLE"})) {
            while (resultSet.next()) {
                String tableName = resultSet.getString("TABLE_NAME");
                if (isApplicationTable(tableName)) {
                    tableNames.add(tableName);
                }
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Nao foi possivel listar as tabelas do banco.", exception);
        }
        return tableNames.stream()
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    private SchemaResponse.Table inspectTable(
            DatabaseMetaData metadata,
            String schemaName,
            String tableName) {
        Map<String, ColumnMetadata> columns = readColumns(metadata, schemaName, tableName);
        List<String> primaryKeys = readPrimaryKeys(metadata, schemaName, tableName);
        List<SchemaResponse.ForeignKey> foreignKeys = readForeignKeys(metadata, schemaName, tableName);
        UniqueMetadata uniqueMetadata = readUniqueMetadata(metadata, schemaName, tableName, new HashSet<>(primaryKeys));

        List<SchemaResponse.Column> responseColumns = columns.values().stream()
                .sorted(Comparator
                        .comparing((ColumnMetadata column) ->
                                !primaryKeys.contains(normalize(column.name())))
                        .thenComparingInt(ColumnMetadata::ordinal))
                .map(column -> new SchemaResponse.Column(
                        normalize(column.name()),
                        column.type(),
                        column.size(),
                        column.nullable(),
                        primaryKeys.contains(normalize(column.name())),
                        column.autoIncrement(),
                        uniqueMetadata.columns().contains(normalize(column.name()))))
                .toList();

        return new SchemaResponse.Table(
                normalize(tableName),
                responseColumns,
                primaryKeys,
                foreignKeys,
                uniqueMetadata.constraints());
    }

    private Map<String, ColumnMetadata> readColumns(
            DatabaseMetaData metadata,
            String schemaName,
            String tableName) {
        Map<String, ColumnMetadata> columns = new HashMap<>();
        try (ResultSet resultSet = metadata.getColumns(null, schemaName, tableName, "%")) {
            while (resultSet.next()) {
                String name = resultSet.getString("COLUMN_NAME");
                int size = resultSet.getInt("COLUMN_SIZE");
                Integer normalizedSize = resultSet.wasNull() ? null : size;
                columns.put(
                        normalize(name),
                        new ColumnMetadata(
                                name,
                                normalize(resultSet.getString("TYPE_NAME")),
                                normalizedSize,
                                resultSet.getInt("NULLABLE") != DatabaseMetaData.columnNoNulls,
                                "YES".equalsIgnoreCase(resultSet.getString("IS_AUTOINCREMENT")),
                                resultSet.getInt("ORDINAL_POSITION")));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Nao foi possivel listar os atributos da tabela.", exception);
        }
        return columns;
    }

    private List<String> readPrimaryKeys(
            DatabaseMetaData metadata,
            String schemaName,
            String tableName) {
        List<IndexedName> keys = new ArrayList<>();
        try (ResultSet resultSet = metadata.getPrimaryKeys(null, schemaName, tableName)) {
            while (resultSet.next()) {
                keys.add(new IndexedName(
                        resultSet.getShort("KEY_SEQ"),
                        normalize(resultSet.getString("COLUMN_NAME"))));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Nao foi possivel ler a chave primaria.", exception);
        }
        return keys.stream()
                .sorted(Comparator.comparingInt(IndexedName::order))
                .map(IndexedName::name)
                .toList();
    }

    private List<SchemaResponse.ForeignKey> readForeignKeys(
            DatabaseMetaData metadata,
            String schemaName,
            String tableName) {
        List<SchemaResponse.ForeignKey> foreignKeys = new ArrayList<>();
        try (ResultSet resultSet = metadata.getImportedKeys(null, schemaName, tableName)) {
            while (resultSet.next()) {
                foreignKeys.add(new SchemaResponse.ForeignKey(
                        normalize(resultSet.getString("FK_NAME")),
                        normalize(resultSet.getString("FKCOLUMN_NAME")),
                        normalize(resultSet.getString("PKTABLE_NAME")),
                        normalize(resultSet.getString("PKCOLUMN_NAME"))));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Nao foi possivel ler as chaves estrangeiras.", exception);
        }
        return foreignKeys.stream()
                .sorted(Comparator.comparing(SchemaResponse.ForeignKey::column))
                .toList();
    }

    private UniqueMetadata readUniqueMetadata(
            DatabaseMetaData metadata,
            String schemaName,
            String tableName,
            Set<String> primaryKeys) {
        Set<String> constraints = new LinkedHashSet<>();
        Set<String> columns = new HashSet<>();
        try (ResultSet resultSet = metadata.getIndexInfo(null, schemaName, tableName, true, false)) {
            while (resultSet.next()) {
                short type = resultSet.getShort("TYPE");
                String indexName = resultSet.getString("INDEX_NAME");
                String columnName = resultSet.getString("COLUMN_NAME");
                if (type == DatabaseMetaData.tableIndexStatistic || indexName == null || columnName == null) {
                    continue;
                }
                String normalizedColumn = normalize(columnName);
                if (primaryKeys.contains(normalizedColumn)) {
                    continue;
                }
                String normalizedIndexName = normalize(indexName);
                if (!isGeneratedConstraintName(normalizedIndexName)) {
                    constraints.add(normalizedIndexName);
                }
                columns.add(normalizedColumn);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Nao foi possivel ler as restricoes unicas.", exception);
        }
        return new UniqueMetadata(
                constraints.stream().sorted().toList(),
                Set.copyOf(columns));
    }

    private boolean isApplicationTable(String tableName) {
        String name = normalize(tableName);
        return !name.equals("flyway_schema_history")
                && !name.startsWith("flyway_")
                && !name.startsWith("information_schema")
                && !name.startsWith("pg_")
                && !name.startsWith("sqlite_")
                && !name.startsWith("system_");
    }

    private String resolveSchema(String value) {
        return value == null || value.isBlank() ? "PUBLIC" : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private boolean isGeneratedConstraintName(String name) {
        return name.startsWith("constraint_index_")
                || name.startsWith("primary_key_");
    }

    private record ColumnMetadata(
            String name,
            String type,
            Integer size,
            boolean nullable,
            boolean autoIncrement,
            int ordinal) {
    }

    private record IndexedName(int order, String name) {
    }

    private record UniqueMetadata(
            List<String> constraints,
            Set<String> columns) {
    }
}
