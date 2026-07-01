package lk.jiat.techmart.dto;

import java.io.Serializable;

public class WarehouseInventoryTransferDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String productName;
    private int qty;
    private String oldLocationName;
    private String newLocationName;
    private String sourceWarehouseName;
    private String destWarehouseName;
    private Long createdAt;
    private String userName;
    private String statusName;

    public WarehouseInventoryTransferDTO() {}

    public WarehouseInventoryTransferDTO(Long id, String productName, int qty, String oldLocationName, String newLocationName, String sourceWarehouseName, String destWarehouseName, Long createdAt, String userName, String statusName) {
        this.id = id;
        this.productName = productName;
        this.qty = qty;
        this.oldLocationName = oldLocationName;
        this.newLocationName = newLocationName;
        this.sourceWarehouseName = sourceWarehouseName;
        this.destWarehouseName = destWarehouseName;
        this.createdAt = createdAt;
        this.userName = userName;
        this.statusName = statusName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getQty() {
        return qty;
    }

    public void setQty(int qty) {
        this.qty = qty;
    }

    public String getOldLocationName() {
        return oldLocationName;
    }

    public void setOldLocationName(String oldLocationName) {
        this.oldLocationName = oldLocationName;
    }

    public String getNewLocationName() {
        return newLocationName;
    }

    public void setNewLocationName(String newLocationName) {
        this.newLocationName = newLocationName;
    }

    public String getSourceWarehouseName() {
        return sourceWarehouseName;
    }

    public void setSourceWarehouseName(String sourceWarehouseName) {
        this.sourceWarehouseName = sourceWarehouseName;
    }

    public String getDestWarehouseName() {
        return destWarehouseName;
    }

    public void setDestWarehouseName(String destWarehouseName) {
        this.destWarehouseName = destWarehouseName;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getStatusName() {
        return statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }
}
