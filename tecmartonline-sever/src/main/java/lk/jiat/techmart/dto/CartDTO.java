package lk.jiat.techmart.dto;

import java.io.Serializable;

public class CartDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private int quantity;
    private ProductDTO product;

    public CartDTO() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public ProductDTO getProduct() {
        return product;
    }

    public void setProduct(ProductDTO product) {
        this.product = product;
    }
}
