package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.ProductDTO;
import lk.jiat.techmart.dto.BrandDTO;
import lk.jiat.techmart.dto.CategoryDTO;
import lk.jiat.techmart.dto.ColorDTO;
import lk.jiat.techmart.entity.Brand;
import lk.jiat.techmart.entity.Category;
import lk.jiat.techmart.entity.Color;
import lk.jiat.techmart.entity.Product;
import lk.jiat.techmart.entity.Image;
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
            product.setBlockQty(0); // block_qty defaulted to 0 per user requirement
            product.setDimensions(dto.getDimensions());
            product.setIsActive(true);
            product.setLowStockLimit(dto.getLowStockLimit());
            product.setCreatedAt(new Date());

            // Fetch or create Color
            TypedQuery<Color> colorQuery = em.createQuery("SELECT c FROM Color c WHERE c.color = :name", Color.class);
            colorQuery.setParameter("name", dto.getColor());
            Color color;
            try {
                color = colorQuery.getSingleResult();
            } catch (Exception e) {
                color = new Color();
                color.setColor(dto.getColor());
                TypedQuery<Integer> maxIdQuery = em.createQuery("SELECT MAX(c.id) FROM Color c", Integer.class);
                Integer maxId = maxIdQuery.getSingleResult();
                color.setId(maxId != null ? maxId + 1 : 1);
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

            // Save Images
            if (dto.getImages() != null && !dto.getImages().isEmpty()) {
                java.util.List<Image> productImages = new java.util.ArrayList<>();
                for (int i = 0; i < dto.getImages().size(); i++) {
                    String base64OrUrl = dto.getImages().get(i);
                    if (base64OrUrl != null && !base64OrUrl.trim().isEmpty()) {
                        String savedUrl = saveBase64Image(base64OrUrl, i);
                        Image img = new Image();
                        img.setUrl(savedUrl);
                        img.setProduct(product);
                        em.persist(img);
                        productImages.add(img);
                    }
                }
                product.setImages(productImages);
            }

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
            product.setDimensions(dto.getDimensions());
            product.setLowStockLimit(dto.getLowStockLimit());

            // Update Color
            if (dto.getColor() != null) {
                TypedQuery<Color> colorQuery = em.createQuery("SELECT c FROM Color c WHERE c.color = :name", Color.class);
                colorQuery.setParameter("name", dto.getColor());
                Color color;
                try {
                    color = colorQuery.getSingleResult();
                } catch (Exception e) {
                    color = new Color();
                    color.setColor(dto.getColor());
                    TypedQuery<Integer> maxIdQuery = em.createQuery("SELECT MAX(c.id) FROM Color c", Integer.class);
                    Integer maxId = maxIdQuery.getSingleResult();
                    color.setId(maxId != null ? maxId + 1 : 1);
                    em.persist(color);
                }
                product.setColor(color);
            }

            // Update Category
            if (dto.getCategory() != null) {
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
            }

            // Update Brand
            if (dto.getBrand() != null) {
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
            }
            // Update Images
            if (dto.getImages() != null) {
                // Delete old images associated with this product
                em.createQuery("DELETE FROM Image img WHERE img.product.id = :prodId")
                  .setParameter("prodId", product.getId())
                  .executeUpdate();
                
                java.util.List<Image> newImages = new java.util.ArrayList<>();
                for (int i = 0; i < dto.getImages().size(); i++) {
                    String base64OrUrl = dto.getImages().get(i);
                    if (base64OrUrl != null && !base64OrUrl.trim().isEmpty()) {
                        String savedUrl = saveBase64Image(base64OrUrl, i);
                        Image img = new Image();
                        img.setUrl(savedUrl);
                        img.setProduct(product);
                        em.persist(img);
                        newImages.add(img);
                    }
                }
                product.setImages(newImages);
            }

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
        dto.setLowStockLimit(p.getLowStockLimit());
        dto.setColor(p.getColor().getColor());
        dto.setCategory(p.getCategory().getName());
        dto.setBrand(p.getBrand().getName());
        if (p.getImages() != null) {
            dto.setImages(p.getImages().stream().map(img -> img.getUrl()).collect(Collectors.toList()));
        } else {
            dto.setImages(new ArrayList<>());
        }

        // Calculate available stock count
        int stock = 0;
        try {
            TypedQuery<Object> sq = em.createQuery(
                "SELECT COALESCE(SUM(i.stockQuantity), 0L) FROM Inventory i WHERE i.product.id = :productId", 
                Object.class
            );
            sq.setParameter("productId", p.getId());
            Object res = sq.getSingleResult();
            if (res instanceof Number) {
                stock = ((Number) res).intValue();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        int availability = stock - p.getBlockQty();
        dto.setStockQty(availability);

        return dto;
    }

    @Override
    public List<BrandDTO> getAllBrands() {
        try {
            TypedQuery<Brand> query = em.createQuery("SELECT b FROM Brand b", Brand.class);
            return query.getResultList().stream()
                    .map(b -> new BrandDTO(b.getId(), b.getName(), b.getDescription()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        try {
            TypedQuery<Category> query = em.createQuery("SELECT c FROM Category c", Category.class);
            return query.getResultList().stream()
                    .map(c -> new CategoryDTO(c.getId(), c.getName(), c.getDescription()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<ColorDTO> getAllColors() {
        try {
            TypedQuery<Color> query = em.createQuery("SELECT c FROM Color c", Color.class);
            return query.getResultList().stream()
                    .map(c -> new ColorDTO(c.getId(), c.getColor()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public boolean addBrand(BrandDTO dto) {
        try {
            TypedQuery<Brand> query = em.createQuery("SELECT b FROM Brand b WHERE b.name = :name", Brand.class);
            query.setParameter("name", dto.getName());
            if (!query.getResultList().isEmpty()) {
                return false;
            }
            Brand brand = new Brand();
            brand.setName(dto.getName());
            brand.setDescription(dto.getDescription());
            em.persist(brand);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean addCategory(CategoryDTO dto) {
        try {
            TypedQuery<Category> query = em.createQuery("SELECT c FROM Category c WHERE c.name = :name", Category.class);
            query.setParameter("name", dto.getName());
            if (!query.getResultList().isEmpty()) {
                return false;
            }
            Category category = new Category();
            category.setName(dto.getName());
            category.setDescription(dto.getDescription());
            em.persist(category);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean addColor(ColorDTO dto) {
        try {
            TypedQuery<Color> query = em.createQuery("SELECT c FROM Color c WHERE c.color = :name", Color.class);
            query.setParameter("name", dto.getColor());
            if (!query.getResultList().isEmpty()) {
                return false;
            }
            Color color = new Color();
            color.setColor(dto.getColor());
            TypedQuery<Integer> maxQuery = em.createQuery("SELECT MAX(c.id) FROM Color c", Integer.class);
            Integer maxId = maxQuery.getSingleResult();
            color.setId(maxId != null ? maxId + 1 : 1);
            em.persist(color);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private String saveBase64Image(String base64Str, int index) {
        try {
            if (base64Str.startsWith("data:image/")) {
                int commaIdx = base64Str.indexOf(",");
                String metadata = base64Str.substring(0, commaIdx);
                String data = base64Str.substring(commaIdx + 1);
                
                String ext = "png";
                if (metadata.contains("jpeg") || metadata.contains("jpg")) {
                    ext = "jpg";
                } else if (metadata.contains("gif")) {
                    ext = "gif";
                } else if (metadata.contains("webp")) {
                    ext = "webp";
                }
                
                byte[] bytes = java.util.Base64.getDecoder().decode(data);
                
                String homeDir = System.getProperty("user.home");
                java.io.File uploadDir = new java.io.File(homeDir, "techmart_uploads");
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs();
                }
                
                String filename = java.util.UUID.randomUUID().toString() + "_" + index + "." + ext;
                java.io.File targetFile = new java.io.File(uploadDir, filename);
                try (java.io.FileOutputStream fos = new java.io.FileOutputStream(targetFile)) {
                    fos.write(bytes);
                }
                
                return "http://localhost:8080/tecmartonline-sever/api/products/images/" + filename;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return base64Str;
    }
}
