package com.mycompany.saas_japanese.repository;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;
import lombok.AccessLevel;

/** Protect option references in deployed schemas, including legacy ON DELETE SET NULL foreign keys. */
@Repository
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class QuizOptionReferenceRepository {
  private final JdbcTemplate jdbc;

  public boolean hasReferences(List<Long> optionIds) {
    if (optionIds.isEmpty()) {
      return false;
    }
    return Boolean.TRUE.equals(jdbc.execute((ConnectionCallback<Boolean>) connection -> {
      var metadata = connection.getMetaData();
      try (ResultSet tables = metadata.getTables(connection.getCatalog(), null, "%", new String[] {"TABLE"})) {
        while (tables.next()) {
          if ("quiz_options".equalsIgnoreCase(tables.getString("TABLE_NAME"))) {
            try (ResultSet keys = metadata.getExportedKeys(tables.getString("TABLE_CAT"),
                tables.getString("TABLE_SCHEM"), tables.getString("TABLE_NAME"))) {
              while (keys.next()) {
                if (referencesExist(connection, keys, optionIds)) {
                  return true;
                }
              }
            }
          }
        }
      }
      return false;
    }));
  }

  private boolean referencesExist(Connection connection, ResultSet key, List<Long> optionIds) throws SQLException {
    String quote = connection.getMetaData().getIdentifierQuoteString().strip();
    String table = quoted(key.getString("FKTABLE_NAME"), quote);
    String schema = key.getString("FKTABLE_SCHEM");
    if (schema == null) {
      schema = key.getString("FKTABLE_CAT");
    }
    if (schema != null && !schema.isBlank()) {
      table = quoted(schema, quote) + "." + table;
    }
    String sql = "select 1 from " + table + " where " + quoted(key.getString("FKCOLUMN_NAME"), quote)
        + " in (" + String.join(",", Collections.nCopies(optionIds.size(), "?")) + ")";
    // Identifiers come exclusively from database metadata; JdbcTemplate binds all values
    // and reuses the transaction's connection, closing the statement/result set afterward.
    ResultSetExtractor<Boolean> hasRows = ResultSet::next;
    return Boolean.TRUE.equals(jdbc.query(sql, hasRows, optionIds.toArray()));
  }

  private String quoted(String identifier, String quote) {
    return quote + identifier.replace(quote, quote + quote) + quote;
  }
}
