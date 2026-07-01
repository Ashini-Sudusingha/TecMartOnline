package lk.jiat.techmart.dto;

import java.io.Serializable;

public class LocationTransferRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer inventoryId;
    private String newLocationId;
    private Long userId;

    public LocationTransferRequestDTO() {}

    public Integer getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Integer inventoryId) {
        this.inventoryId = inventoryId;
    }

    public String getNewLocationId() {
        return newLocationId;
    }

    public void setNewLocationId(String newLocationId) {
        this.newLocationId = newLocationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
