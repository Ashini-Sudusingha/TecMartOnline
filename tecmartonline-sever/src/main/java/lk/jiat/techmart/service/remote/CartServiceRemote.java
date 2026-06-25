package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.CartDTO;
import java.util.List;

@Remote
public interface CartServiceRemote {
    boolean addToCart(Long userId, Long productId, int quantity);
    List<CartDTO> getCartByUserId(Long userId);
    boolean removeFromCart(Long cartItemId);
}
