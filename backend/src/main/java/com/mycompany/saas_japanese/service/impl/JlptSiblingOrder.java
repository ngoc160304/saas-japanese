package com.mycompany.saas_japanese.service.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.mycompany.saas_japanese.util.error.BadRequestException;

final class JlptSiblingOrder {
  private JlptSiblingOrder() {
  }

  static <T> void insert(List<T> siblings, T item, Integer position, BiConsumer<T, Integer> setOrder) {
    List<T> ordered = new ArrayList<>(siblings);
    int target = position == null ? ordered.size() : position;
    requirePosition(target, ordered.size());
    ordered.add(target, item);
    assign(ordered, setOrder);
  }

  static <T> void move(List<T> siblings, T item, Integer position, BiConsumer<T, Integer> setOrder) {
    List<T> ordered = new ArrayList<>(siblings);
    ordered.remove(item);
    if (position == null) {
      throw new BadRequestException("Sort order is required");
    }
    requirePosition(position, ordered.size());
    ordered.add(position, item);
    assign(ordered, setOrder);
  }

  static <T> void reorder(List<T> siblings, List<Long> ids, Function<T, Long> getId,
      BiConsumer<T, Integer> setOrder) {
    Map<Long, T> byId = siblings.stream().collect(Collectors.toMap(getId, Function.identity()));
    if (ids == null || ids.stream().anyMatch(id -> id == null || id <= 0)
        || ids.size() != byId.size() || new HashSet<>(ids).size() != ids.size()
        || !byId.keySet().equals(new HashSet<>(ids))) {
      throw new BadRequestException("Include every current sibling ID exactly once, without foreign or unknown IDs");
    }
    assign(ids.stream().map(byId::get).toList(), setOrder);
  }

  static <T> void assign(List<T> siblings, BiConsumer<T, Integer> setOrder) {
    for (int index = 0; index < siblings.size(); index++) {
      setOrder.accept(siblings.get(index), index);
    }
  }

  static void requirePosition(int position, int maximum) {
    if (position < 0 || position > maximum) {
      throw new BadRequestException("Sort order must be between 0 and " + maximum);
    }
  }
}
