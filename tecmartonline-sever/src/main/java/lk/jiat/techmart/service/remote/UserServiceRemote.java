package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.UserDTO;
import java.util.List;

@Remote
public interface UserServiceRemote {
    List<UserDTO> getAllUsers();
    UserDTO getUserById(Long id);
}
