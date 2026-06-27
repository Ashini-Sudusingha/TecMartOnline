package lk.jiat.techmart.dto;

import java.io.Serializable;

public class ColorDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer id;
    private String color;

    public ColorDTO() {}

    public ColorDTO(Integer id, String color) {
        this.id = id;
        this.color = color;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
