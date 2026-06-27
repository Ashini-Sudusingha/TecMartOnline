package lk.jiat.techmart.dto;

import java.io.Serializable;
import java.util.Date;

public class InvoiceDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long supplierId;
    private String supplierName;
    private double totalAmount;
    private Long createdAt;

    public InvoiceDTO() {}

    public InvoiceDTO(Long id, Long supplierId, String supplierName, double totalAmount, Long createdAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }
}
