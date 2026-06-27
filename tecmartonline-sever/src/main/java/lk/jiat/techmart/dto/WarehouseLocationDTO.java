package lk.jiat.techmart.dto;

import java.io.Serializable;

public class WarehouseLocationDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String location;
    private int maxCapacity;
    private int quantity;
    private Long warehouseId;
    private String warehouseName;

    public WarehouseLocationDTO() {}

    public WarehouseLocationDTO(Long id, String location, int maxCapacity, int quantity, Long warehouseId, String warehouseName) {
        this.id = id;
        this.location = location;
        this.maxCapacity = maxCapacity;
        this.quantity = quantity;
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Long warehouseId) {
        this.warehouseId = warehouseId;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }
}
