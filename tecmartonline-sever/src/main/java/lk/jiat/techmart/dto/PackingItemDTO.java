package lk.jiat.techmart.dto;

import java.io.Serializable;
import java.util.List;

public class PackingItemDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer orderItemId;
    private Long orderId;
    private Long productId;
    private String productName;
    private int orderedQty;
    private boolean packed;
    private List<InventorySlot> inventorySlots;

    public PackingItemDTO() {}

    public PackingItemDTO(Integer orderItemId, Long orderId, Long productId, String productName, int orderedQty, boolean packed) {
        this.orderItemId = orderItemId;
        this.orderId = orderId;
        this.productId = productId;
        this.productName = productName;
        this.orderedQty = orderedQty;
        this.packed = packed;
    }

    public Integer getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Integer orderItemId) {
        this.orderItemId = orderItemId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getOrderedQty() {
        return orderedQty;
    }

    public void setOrderedQty(int orderedQty) {
        this.orderedQty = orderedQty;
    }

    public boolean isPacked() {
        return packed;
    }

    public void setPacked(boolean packed) {
        this.packed = packed;
    }

    public List<InventorySlot> getInventorySlots() {
        return inventorySlots;
    }

    public void setInventorySlots(List<InventorySlot> inventorySlots) {
        this.inventorySlots = inventorySlots;
    }

    public static class InventorySlot implements Serializable {
        private static final long serialVersionUID = 1L;

        private Integer inventoryId;
        private String locationName;
        private int availableQty;
        private double buyingPrice;

        public InventorySlot() {}

        public InventorySlot(Integer inventoryId, String locationName, int availableQty, double buyingPrice) {
            this.inventoryId = inventoryId;
            this.locationName = locationName;
            this.availableQty = availableQty;
            this.buyingPrice = buyingPrice;
        }

        public Integer getInventoryId() {
            return inventoryId;
        }

        public void setInventoryId(Integer inventoryId) {
            this.inventoryId = inventoryId;
        }

        public String getLocationName() {
            return locationName;
        }

        public void setLocationName(String locationName) {
            this.locationName = locationName;
        }

        public int getAvailableQty() {
            return availableQty;
        }

        public void setAvailableQty(int availableQty) {
            this.availableQty = availableQty;
        }

        public double getBuyingPrice() {
            return buyingPrice;
        }

        public void setBuyingPrice(double buyingPrice) {
            this.buyingPrice = buyingPrice;
        }
    }
}
