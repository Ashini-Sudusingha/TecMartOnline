package lk.jiat.techmart.dto;

import java.io.Serializable;

public class WarehouseLocationDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String location;
    private int maxCapacity;
    private int quantity;
    private String warehouseId;
    private String warehouseName;

    public WarehouseLocationDTO() {}

    public WarehouseLocationDTO(Long id, String location, int maxCapacity, int quantity, Long warehouseId, String warehouseName) {
        this.id = id != null ? id.toString() : null;
        this.location = location;
        this.maxCapacity = maxCapacity;
        this.quantity = quantity;
        this.warehouseId = warehouseId != null ? warehouseId.toString() : null;
        this.warehouseName = warehouseName;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getIdAsLong() {
        return id != null ? Long.valueOf(id) : null;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(int maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(String warehouseId) {
        this.warehouseId = warehouseId;
    }

    public Long getWarehouseIdAsLong() {
        return warehouseId != null ? Long.valueOf(warehouseId) : null;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }
}
