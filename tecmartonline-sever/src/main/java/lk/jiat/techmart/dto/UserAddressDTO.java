package lk.jiat.techmart.dto;

import java.io.Serializable;

public class UserAddressDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private int cityId;
    private String cityName;
    private String line1;
    private String line2;
    private String postalCode;
    private String mobile;
    private Long userId;

    public UserAddressDTO() {}

    public UserAddressDTO(Long id, int cityId, String cityName, String line1, String line2, String postalCode, String mobile, Long userId) {
        this.id = id;
        this.cityId = cityId;
        this.cityName = cityName;
        this.line1 = line1;
        this.line2 = line2;
        this.postalCode = postalCode;
        this.mobile = mobile;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getCityId() {
        return cityId;
    }

    public void setCityId(int cityId) {
        this.cityId = cityId;
    }

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public String getLine1() {
        return line1;
    }

    public void setLine1(String line1) {
        this.line1 = line1;
    }

    public String getLine2() {
        return line2;
    }

    public void setLine2(String line2) {
        this.line2 = line2;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
