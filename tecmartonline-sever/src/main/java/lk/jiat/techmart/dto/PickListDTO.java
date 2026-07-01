package lk.jiat.techmart.dto;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

public class PickListDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String userName;
    private String warehouseName;
    private Date createdAt;
    private List<OrderDTO> orders;

    public PickListDTO() {}

    public PickListDTO(Long id, String userName, String warehouseName, Date createdAt) {
        this.id = id;
        this.userName = userName;
        this.warehouseName = warehouseName;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public List<OrderDTO> getOrders() {
        return orders;
    }

    public void setOrders(List<OrderDTO> orders) {
        this.orders = orders;
    }
}
