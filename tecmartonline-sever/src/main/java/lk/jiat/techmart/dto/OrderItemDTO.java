package lk.jiat.techmart.dto;

import java.io.Serializable;

public class OrderItemDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long productId;
    private String productName;
    private int quantity;
    private double sellingPrice;

    public OrderItemDTO() {}

    public OrderItemDTO(Long productId, String productName, int quantity, double sellingPrice) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.sellingPrice = sellingPrice;
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

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(double sellingPrice) {
        this.sellingPrice = sellingPrice;
    }
}
