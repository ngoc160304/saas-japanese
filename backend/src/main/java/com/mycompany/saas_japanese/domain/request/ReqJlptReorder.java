package com.mycompany.saas_japanese.domain.request;

import java.util.List;
import java.util.ArrayList;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ReqJlptReorder {
  @NotNull(message = "Ordered sibling IDs are required")
  private List<@NotNull @Positive Long> ids;

  public List<Long> getIds() {
    return ids == null ? null : new ArrayList<>(ids);
  }

  public void setIds(List<Long> ids) {
    this.ids = ids == null ? null : new ArrayList<>(ids);
  }
}
