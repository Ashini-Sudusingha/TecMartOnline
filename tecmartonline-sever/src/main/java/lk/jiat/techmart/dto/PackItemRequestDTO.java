package lk.jiat.techmart.dto;

import java.io.Serializable;

public class PackItemRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long picklistId;
    private Long orderId;
    private Integer orderItemId;
    private Integer inventoryId;
    private int pickQty;

    public PackItemRequestDTO() {}

    public Long getPicklistId() {
        return picklistId;
    }

    public void setPicklistId(Long picklistId) {
        this.picklistId = picklistId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Integer getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Integer orderItemId) {
        this.orderItemId = orderItemId;
    }

    public Integer getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Integer inventoryId) {
        this.inventoryId = inventoryId;
    }

    public int getPickQty() {
        return pickQty;
    }

    public void setPickQty(int pickQty) {
        this.pickQty = pickQty;
    }
}
