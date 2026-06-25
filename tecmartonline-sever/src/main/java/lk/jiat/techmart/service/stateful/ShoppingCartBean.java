package lk.jiat.techmart.service.stateful;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.ejb.Remove;
import jakarta.ejb.Stateful;
import lk.jiat.techmart.dto.CartDTO;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Stateful
public class ShoppingCartBean implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<CartDTO> items;

    @PostConstruct
    public void init() {
        items = new ArrayList<>();
        System.out.println("ShoppingCartBean: Stateful Session Bean created.");
    }

    public void addItem(CartDTO item) {
        // Check if product is already in cart
        for (CartDTO existing : items) {
            if (existing.getProduct().getId().equals(item.getProduct().getId())) {
                existing.setQuantity(existing.getQuantity() + item.getQuantity());
                return;
            }
        }
        items.add(item);
    }

    public void removeItem(Long productId) {
        items.removeIf(item -> item.getProduct().getId().equals(productId));
    }

    public List<CartDTO> getItems() {
        return items;
    }

    public void clear() {
        items.clear();
    }

    @Remove
    public void checkout() {
        System.out.println("ShoppingCartBean: Checkout executed. Destroying Stateful Session Bean.");
        items.clear();
    }

    @PreDestroy
    public void destroy() {
        System.out.println("ShoppingCartBean: Stateful Session Bean about to be destroyed.");
    }
}
