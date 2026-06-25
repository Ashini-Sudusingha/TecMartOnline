package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.ProductDTO;
import lk.jiat.techmart.entity.Brand;
import lk.jiat.techmart.entity.Category;
import lk.jiat.techmart.entity.Color;
import lk.jiat.techmart.entity.Product;
import lk.jiat.techmart.service.remote.ProductServiceRemote;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Stateless
@Interceptors({LoggingInterceptor.class, PerformanceInterceptor.class})
public class ProductServiceBean implements ProductServiceRemote {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @Override
    public List<ProductDTO> getAllProducts() {
        try {
            TypedQuery<Product> query = em.createQuery("SELECT p FROM Product p WHERE p.isActive = true", Product.class);
            List<Product> products = query.getResultList();
            return products.stream().map(this::convertToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public ProductDTO getProductById(Long id) {
        try {
            Product product = em.find(Product.class, id);
            if (product != null && product.isIsActive()) {
                return convertToDTO(product);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public boolean addProduct(ProductDTO dto) {
        try {
            Product product = new Product();
            product.setId(dto.getId() != null ? dto.getId() : System.currentTimeMillis());
            product.setName(dto.getName());
            product.setDescription(dto.getDescription());
            product.setPrice(dto.getPrice());
            product.setBarcode(dto.getBarcode());
            product.setWeight(dto.getWeight());
            product.setBlockQty(dto.getBlockQty());
            product.setDimensions(dto.getDimensions());
            product.setIsActive(true);
            product.setCreatedAt(new Date());

            // Fetch color (default to color ID 1 if not provided, or search)
            Color color = em.find(Color.class, 1);
            if (color == null) {
                color = new Color();
                color.setId(1);
                color.setColor("Default");
                em.persist(color);
            }
            product.setColor(color);

            // Fetch or create Category
            TypedQuery<Category> catQuery = em.createQuery("SELECT c FROM Category c WHERE c.name = :name", Category.class);
            catQuery.setParameter("name", dto.getCategory());
            Category category;
            try {
                category = catQuery.getSingleResult();
            } catch (Exception e) {
                category = new Category();
                category.setName(dto.getCategory());
                category.setDescription(dto.getCategory() + " Description");
                em.persist(category);
            }
            product.setCategory(category);

            // Fetch or create Brand
            TypedQuery<Brand> brandQuery = em.createQuery("SELECT b FROM Brand b WHERE b.name = :name", Brand.class);
            brandQuery.setParameter("name", dto.getBrand());
            Brand brand;
            try {
                brand = brandQuery.getSingleResult();
            } catch (Exception e) {
                brand = new Brand();
                brand.setName(dto.getBrand());
                brand.setDescription(dto.getBrand() + " Description");
                em.persist(brand);
            }
            product.setBrand(brand);

            em.persist(product);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean updateProduct(ProductDTO dto) {
        try {
            Product product = em.find(Product.class, dto.getId());
            if (product == null) return false;

            product.setName(dto.getName());
            product.setDescription(dto.getDescription());
            product.setPrice(dto.getPrice());
            product.setBarcode(dto.getBarcode());
            product.setWeight(dto.getWeight());
            product.setBlockQty(dto.getBlockQty());
            product.setDimensions(dto.getDimensions());

            em.merge(product);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean deleteProduct(Long id) {
        try {
            Product product = em.find(Product.class, id);
            if (product != null) {
                product.setIsActive(false);
                em.merge(product);
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    private ProductDTO convertToDTO(Product p) {
        ProductDTO dto = new ProductDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setPrice(p.getPrice());
        dto.setBarcode(p.getBarcode());
        dto.setWeight(p.getWeight());
        dto.setBlockQty(p.getBlockQty());
        dto.setDimensions(p.getDimensions());
        dto.setIsActive(p.isIsActive());
        dto.setColor(p.getColor().getColor());
        dto.setCategory(p.getCategory().getName());
        dto.setBrand(p.getBrand().getName());
        if (p.getImages() != null) {
            dto.setImages(p.getImages().stream().map(img -> img.getUrl()).collect(Collectors.toList()));
        } else {
            dto.setImages(new ArrayList<>());
        }
        return dto;
    }
}
