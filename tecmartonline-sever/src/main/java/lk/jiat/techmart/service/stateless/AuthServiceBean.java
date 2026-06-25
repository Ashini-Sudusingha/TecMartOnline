package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.LoginRequest;
import lk.jiat.techmart.dto.LoginResponse;
import lk.jiat.techmart.dto.SignupRequest;
import lk.jiat.techmart.dto.UserDTO;
import lk.jiat.techmart.entity.Role;
import lk.jiat.techmart.entity.User;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.security.PasswordHasher;
import lk.jiat.techmart.service.remote.AuthServiceRemote;

import java.util.Date;

@Stateless
@Interceptors({LoggingInterceptor.class, PerformanceInterceptor.class})
public class AuthServiceBean implements AuthServiceRemote {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @Override
    public boolean register(SignupRequest request) {
        try {
            // Check if user already exists
            TypedQuery<Long> query = em.createQuery("SELECT COUNT(u) FROM User u WHERE u.email = :email", Long.class);
            query.setParameter("email", request.getEmail());
            if (query.getSingleResult() > 0) {
                return false;
            }

            // Fetch default role (CUSTOMER)
            TypedQuery<Role> roleQuery = em.createQuery("SELECT r FROM Role r WHERE r.name = :name", Role.class);
            roleQuery.setParameter("name", "CUSTOMER");
            Role customerRole;
            try {
                customerRole = roleQuery.getSingleResult();
            } catch (Exception e) {
                // If role doesn't exist, create it for demo
                customerRole = new Role();
                customerRole.setName("CUSTOMER");
                customerRole.setPassword("customer123");
                customerRole.setPermissions("{}");
                customerRole.setIsActive(true);
                em.persist(customerRole);
            }

            // Create new User entity
            User user = new User();
            user.setId(System.currentTimeMillis()); // generate pseudo id
            user.setFname(request.getFirstName());
            user.setLname(request.getLastName());
            user.setEmail(request.getEmail());
            user.setPassword(PasswordHasher.hashPassword(request.getPassword()));
            user.setMobile(request.getMobile());
            user.setIsActive(true);
            user.setCreatedAt(new Date());
            user.setRole(customerRole);

            em.persist(user);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            TypedQuery<User> query = em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class);
            query.setParameter("email", request.getEmail());
            User user = query.getSingleResult();

            if (user != null) {
                // Validate using the Role password instead of the User's personal password
                String rolePassword = user.getRole().getPassword();
                if (request.getPassword().equals(rolePassword)) {
                    if (!user.isIsActive()) {
                        return null;
                    }

                    // Update last login
                    user.setLastLogin(new Date());
                    em.merge(user);

                    // Generate Token
                    String roleName = user.getRole().getName();
                    String token = JWTUtil.generateToken(user.getEmail(), roleName);

                    UserDTO userDTO = new UserDTO(
                            user.getId(),
                            user.getFname(),
                            user.getLname(),
                            user.getEmail(),
                            user.getMobile(),
                            roleName
                    );

                    return new LoginResponse(token, roleName, userDTO);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
