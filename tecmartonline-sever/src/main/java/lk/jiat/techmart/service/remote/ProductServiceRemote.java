package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.ProductDTO;
import java.util.List;

@Remote
public interface ProductServiceRemote {
    List<ProductDTO> getAllProducts();
    ProductDTO getProductById(Long id);
    boolean addProduct(ProductDTO dto);
    boolean updateProduct(ProductDTO dto);
    boolean deleteProduct(Long id);
}
