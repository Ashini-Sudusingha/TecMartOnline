package lk.jiat.techmart.dto;

import java.io.Serializable;
import java.util.List;

public class PickListRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long userId;
    private Long warehouseId;
    private List<Long> orderIds;

    public PickListRequestDTO() {}

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Long warehouseId) {
        this.warehouseId = warehouseId;
    }

    public List<Long> getOrderIds() {
        return orderIds;
    }

    public void setOrderIds(List<Long> orderIds) {
        this.orderIds = orderIds;
    }
}
