package lk.jiat.techmart.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "warehouse_inventory_transfer")
public class WarehouseInventoryTransfer implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "old_warehouses_location_id", nullable = false)
    private WarehouseLocation oldLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_warehouses_location_id1", nullable = false)
    private WarehouseLocation newLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    @Column(name = "created_at", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    public WarehouseInventoryTransfer() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public WarehouseLocation getOldLocation() {
        return oldLocation;
    }

    public void setOldLocation(WarehouseLocation oldLocation) {
        this.oldLocation = oldLocation;
    }

    public WarehouseLocation getNewLocation() {
        return newLocation;
    }

    public void setNewLocation(WarehouseLocation newLocation) {
        this.newLocation = newLocation;
    }

    public Inventory getInventory() {
        return inventory;
    }

    public void setInventory(Inventory inventory) {
        this.inventory = inventory;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
