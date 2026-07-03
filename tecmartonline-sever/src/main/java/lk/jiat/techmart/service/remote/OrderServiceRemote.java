package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.OrderDTO;
import lk.jiat.techmart.dto.OrderRequestDTO;
import lk.jiat.techmart.dto.OrderItemDTO;
import lk.jiat.techmart.dto.PickListDTO;
import lk.jiat.techmart.dto.PickListRequestDTO;
import lk.jiat.techmart.dto.PackingItemDTO;
import lk.jiat.techmart.dto.PackItemRequestDTO;
import java.util.List;

@Remote
public interface OrderServiceRemote {
    boolean placeOrder(OrderRequestDTO orderRequest);
    List<OrderDTO> getOrdersByUserId(Long userId);
    List<OrderDTO> getAllOrders();
    List<OrderItemDTO> getOrderItems(Long orderId);
    boolean createPickList(PickListRequestDTO request);
    List<PickListDTO> getPickListsByWarehouseId(Long warehouseId);
    List<PickListDTO> getAllPickLists();
    List<PackingItemDTO> getPackingDetails(Long picklistId);
    boolean packItem(PackItemRequestDTO request);
    boolean updateOrderStatus(Long orderId, String statusName);
}
