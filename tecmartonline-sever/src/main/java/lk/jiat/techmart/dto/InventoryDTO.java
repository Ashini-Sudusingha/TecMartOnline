package lk.jiat.techmart.dto;

import java.io.Serializable;

public class InventoryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer id;
    private Long productId;
    private String productName;
    private Long warehouseId;
    private String warehouseName;
    private String warehouseLocationId;
    private String location;
    private int stockQuantity;
    private double buyingPrice;
    private Long invoiceId;
    private String statusName;

    public InventoryDTO() {}

    public InventoryDTO(Integer id, Long productId, String productName, Long warehouseId, String warehouseName, Long warehouseLocationId, String location, int stockQuantity, double buyingPrice, Long invoiceId, String statusName) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
        this.warehouseLocationId = warehouseLocationId != null ? warehouseLocationId.toString() : null;
        this.location = location;
        this.stockQuantity = stockQuantity;
        this.buyingPrice = buyingPrice;
        this.invoiceId = invoiceId;
        this.statusName = statusName;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getWarehouseLocationId() {
        return warehouseLocationId;
    }

    public void setWarehouseLocationId(String warehouseLocationId) {
        this.warehouseLocationId = warehouseLocationId;
    }

    public Long getWarehouseLocationIdAsLong() {
        return warehouseLocationId != null ? Long.valueOf(warehouseLocationId) : null;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public double getBuyingPrice() {
        return buyingPrice;
    }

    public void setBuyingPrice(double buyingPrice) {
        this.buyingPrice = buyingPrice;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public String getStatusName() {
        return statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }
}
