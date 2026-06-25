package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.OrderDTO;
import java.util.List;

@Remote
public interface OrderServiceRemote {
    boolean placeOrder(Long userId, Long addressId, int paymentMethodId, double total, double subtotal);
    List<OrderDTO> getOrdersByUserId(Long userId);
}
