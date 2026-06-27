package lk.jiat.techmart.dto;

import java.io.Serializable;
import java.util.Date;

public class WarehouseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String contactPhone;
    private String email;
    private Date createdAt;
    private boolean isActive;
    private String location;

    public WarehouseDTO() {}

    public WarehouseDTO(Long id, String name, String contactPhone, String email, Date createdAt, boolean isActive, String location) {
        this.id = id;
        this.name = name;
        this.contactPhone = contactPhone;
        this.email = email;
        this.createdAt = createdAt;
        this.isActive = isActive;
        this.location = location;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
