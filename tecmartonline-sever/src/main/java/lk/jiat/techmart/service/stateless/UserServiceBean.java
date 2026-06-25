package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.UserDTO;
import lk.jiat.techmart.entity.User;
import lk.jiat.techmart.service.remote.UserServiceRemote;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Stateless
@Interceptors({LoggingInterceptor.class, PerformanceInterceptor.class})
public class UserServiceBean implements UserServiceRemote {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @Override
    public List<UserDTO> getAllUsers() {
        try {
            TypedQuery<User> query = em.createQuery("SELECT u FROM User u WHERE u.isActive = true", User.class);
            List<User> users = query.getResultList();
            return users.stream().map(this::convertToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public UserDTO getUserById(Long id) {
        try {
            User user = em.find(User.class, id);
            if (user != null && user.isIsActive()) {
                return convertToDTO(user);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private UserDTO convertToDTO(User u) {
        return new UserDTO(
                u.getId(),
                u.getFname(),
                u.getLname(),
                u.getEmail(),
                u.getMobile(),
                u.getRole().getName()
        );
    }
}
