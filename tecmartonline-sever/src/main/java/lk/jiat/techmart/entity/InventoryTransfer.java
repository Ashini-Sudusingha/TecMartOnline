package lk.jiat.techmart.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "inventory_transfers")
public class InventoryTransfer implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    @Column(name = "pick_qty", length = 45)
    private String pickQty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pick_list_orders_id", nullable = false)
    private PickListOrder pickListOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_items_id", nullable = false)
    private OrderItem orderItem;

    @Column(name = "created_at", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    public InventoryTransfer() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Inventory getInventory() {
        return inventory;
    }

    public void setInventory(Inventory inventory) {
        this.inventory = inventory;
    }

    public String getPickQty() {
        return pickQty;
    }

    public void setPickQty(String pickQty) {
        this.pickQty = pickQty;
    }

    public PickListOrder getPickListOrder() {
        return pickListOrder;
    }

    public void setPickListOrder(PickListOrder pickListOrder) {
        this.pickListOrder = pickListOrder;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
