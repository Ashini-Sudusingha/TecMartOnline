package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.UserDTO;
import lk.jiat.techmart.dto.UserAddressDTO;
import lk.jiat.techmart.dto.CityDTO;
import lk.jiat.techmart.dto.ProvinceDTO;
import lk.jiat.techmart.dto.DistrictDTO;
import lk.jiat.techmart.entity.User;
import lk.jiat.techmart.entity.City;
import lk.jiat.techmart.entity.UserAddress;
import lk.jiat.techmart.entity.Province;
import lk.jiat.techmart.entity.District;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.service.remote.UserServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.ArrayList;
import java.util.List;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @EJB
    private UserServiceRemote userService;

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @GET
    public Response getAllUsers(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        List<UserDTO> users = userService.getAllUsers();
        return ResponseUtil.buildSuccessResponse("Users list retrieved successfully", users);
    }

    @GET
    @Path("/{userId}/addresses")
    public Response getUserAddresses(@HeaderParam("Authorization") String authHeader, @PathParam("userId") Long userId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<UserAddress> query = em.createQuery(
                "SELECT ua FROM UserAddress ua WHERE ua.user.id = :userId", 
                UserAddress.class
            );
            query.setParameter("userId", userId);
            List<UserAddress> addresses = query.getResultList();
            
            List<UserAddressDTO> dtos = new ArrayList<>();
            for (UserAddress ua : addresses) {
                dtos.add(new UserAddressDTO(
                    ua.getId(),
                    ua.getCity().getId(),
                    ua.getCity().getName(),
                    ua.getLine1(),
                    ua.getLine2(),
                    ua.getPostalCode(),
                    ua.getMobile(),
                    ua.getUser().getId()
                ));
            }
            return ResponseUtil.buildSuccessResponse("Addresses retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving user addresses.");
        }
    }

    @POST
    @Path("/{userId}/addresses")
    @jakarta.transaction.Transactional
    public Response addUserAddress(@HeaderParam("Authorization") String authHeader, @PathParam("userId") Long userId, UserAddressDTO dto) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        if (dto == null || dto.getLine1() == null || dto.getLine1().trim().isEmpty() || 
            dto.getLine2() == null || dto.getLine2().trim().isEmpty() || dto.getPostalCode() == null ||
            dto.getPostalCode().trim().isEmpty() || dto.getCityId() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Required address details are missing.");
        }

        try {
            User user = em.find(User.class, userId);
            City city = em.find(City.class, dto.getCityId());

            if (user == null || city == null) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Invalid user or city referenced.");
            }

            UserAddress ua = new UserAddress();
            ua.setUser(user);
            ua.setCity(city);
            ua.setLine1(dto.getLine1().trim());
            ua.setLine2(dto.getLine2().trim());
            ua.setPostalCode(dto.getPostalCode().trim());
            ua.setMobile(dto.getMobile() != null ? dto.getMobile().trim() : null);

            em.persist(ua);

            return ResponseUtil.buildSuccessResponse("Address added successfully", new UserAddressDTO(
                ua.getId(),
                ua.getCity().getId(),
                ua.getCity().getName(),
                ua.getLine1(),
                ua.getLine2(),
                ua.getPostalCode(),
                ua.getMobile(),
                ua.getUser().getId()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error saving address.");
        }
    }

    @GET
    @Path("/cities")
    public Response getAllCities(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<City> query = em.createQuery("SELECT c FROM City c ORDER BY c.name ASC", City.class);
            List<City> cities = query.getResultList();
            
            List<CityDTO> dtos = new ArrayList<>();
            for (City c : cities) {
                dtos.add(new CityDTO(c.getId(), c.getName()));
            }
            return ResponseUtil.buildSuccessResponse("Cities list retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving cities list.");
        }
    }

    @GET
    @Path("/provinces")
    public Response getAllProvinces(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<Province> query = em.createQuery("SELECT p FROM Province p ORDER BY p.name ASC", Province.class);
            List<Province> provinces = query.getResultList();
            
            List<ProvinceDTO> dtos = new ArrayList<>();
            for (Province p : provinces) {
                dtos.add(new ProvinceDTO(p.getId(), p.getName()));
            }
            return ResponseUtil.buildSuccessResponse("Provinces list retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving provinces.");
        }
    }

    @GET
    @Path("/provinces/{provinceId}/districts")
    public Response getDistrictsByProvince(@HeaderParam("Authorization") String authHeader, @PathParam("provinceId") Integer provinceId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<District> query = em.createQuery("SELECT d FROM District d WHERE d.province.id = :provinceId ORDER BY d.name ASC", District.class);
            query.setParameter("provinceId", provinceId);
            List<District> districts = query.getResultList();
            
            List<DistrictDTO> dtos = new ArrayList<>();
            for (District d : districts) {
                dtos.add(new DistrictDTO(d.getId(), d.getName(), d.getProvince().getId()));
            }
            return ResponseUtil.buildSuccessResponse("Districts list retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving districts.");
        }
    }

    @GET
    @Path("/districts/{districtId}/cities")
    public Response getCitiesByDistrict(@HeaderParam("Authorization") String authHeader, @PathParam("districtId") Integer districtId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<City> query = em.createQuery("SELECT c FROM City c WHERE c.district.id = :districtId ORDER BY c.name ASC", City.class);
            query.setParameter("districtId", districtId);
            List<City> cities = query.getResultList();
            
            List<CityDTO> dtos = new ArrayList<>();
            for (City c : cities) {
                dtos.add(new CityDTO(c.getId(), c.getName()));
            }
            return ResponseUtil.buildSuccessResponse("Cities list retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving cities.");
        }
    }
}
