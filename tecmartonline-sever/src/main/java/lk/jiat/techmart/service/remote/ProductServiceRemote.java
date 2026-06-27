package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.ProductDTO;
import lk.jiat.techmart.dto.BrandDTO;
import lk.jiat.techmart.dto.CategoryDTO;
import lk.jiat.techmart.dto.ColorDTO;
import java.util.List;

@Remote
public interface ProductServiceRemote {
    List<ProductDTO> getAllProducts();
    ProductDTO getProductById(Long id);
    boolean addProduct(ProductDTO dto);
    boolean updateProduct(ProductDTO dto);
    boolean deleteProduct(Long id);

    List<BrandDTO> getAllBrands();
    List<CategoryDTO> getAllCategories();
    List<ColorDTO> getAllColors();
    boolean addBrand(BrandDTO dto);
    boolean addCategory(CategoryDTO dto);
    boolean addColor(ColorDTO dto);
}
