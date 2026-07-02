package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.MessageDTO;
import lk.jiat.techmart.dto.UserDTO;
import java.util.List;

@Remote
public interface MessageServiceRemote {
    boolean sendMessage(MessageDTO dto);
    List<MessageDTO> getDirectMessages(Long userId1, Long userId2);
    List<MessageDTO> getRoleMessages(String roleName);
    List<UserDTO> getConversations(Long userId);
    boolean markAsRead(Long messageId);
}
