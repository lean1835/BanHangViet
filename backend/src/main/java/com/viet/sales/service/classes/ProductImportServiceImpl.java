package com.viet.sales.service.classes;

import com.viet.sales.dto.response.ImportProductResultResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ProductGroupRepository;
import com.viet.sales.repository.ProductRepository;
import com.viet.sales.repository.TaxRateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.ProductImportService;
import com.viet.sales.utils.ExcelParserUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImportServiceImpl implements ProductImportService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductGroupRepository productGroupRepository;
    private final TaxRateRepository taxRateRepository;

    @Override
    public byte[] getImportTemplate() throws Exception {
        return ExcelParserUtils.generateProductImportTemplate();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ImportProductResultResponse importProducts(String currentUsername, MultipartFile file) {
        // 1. Validate file basic constraints
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_IMPORT_FILE);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        // 2. Validate user & role
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String roleCode = currentUser.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"OWNER".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // 3. Pre-fetch tax rates, SKUs, and groups to eliminate N+1 queries
        List<TaxRate> activeTaxRates = taxRateRepository.findByHouseholdIdAndIsActiveTrue(household.getId());
        TaxRate defaultTaxRate = activeTaxRates.isEmpty() ? null : activeTaxRates.get(0);

        Set<String> existingSkusInDb = new HashSet<>(productRepository.findSkusByHouseholdId(household.getId()));

        Map<String, ProductGroup> existingGroupsMap = productGroupRepository.findByHouseholdIdAndDeletedAtIsNull(household.getId())
                .stream()
                .collect(java.util.stream.Collectors.toMap(ProductGroup::getName, g -> g, (g1, g2) -> g1));

        List<ImportProductResultResponse.RowErrorDetail> errors = new ArrayList<>();
        List<Product> productBatch = new ArrayList<>();
        Set<String> processedSkusInFile = new HashSet<>();

        int totalRows = 0;
        int successCount = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();

            for (int rowIndex = 1; rowIndex <= lastRowNum; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (isRowEmpty(row)) {
                    continue;
                }

                totalRows++;
                int actualRowNumber = rowIndex + 1; // 1-based line number for user feedback

                String sku = ExcelParserUtils.getCellValueAsString(row.getCell(0));
                String name = ExcelParserUtils.getCellValueAsString(row.getCell(1));
                String unit = ExcelParserUtils.getCellValueAsString(row.getCell(2));
                BigDecimal price = ExcelParserUtils.getCellValueAsBigDecimal(row.getCell(4));
                String taxRateStr = ExcelParserUtils.getCellValueAsString(row.getCell(5));
                String groupName = ExcelParserUtils.getCellValueAsString(row.getCell(6));
                BigDecimal stock = ExcelParserUtils.getCellValueAsBigDecimal(row.getCell(7));

                // Auto generate SKU if empty
                if (!StringUtils.hasText(sku)) {
                    sku = "SP" + System.currentTimeMillis() + String.format("%03d", rowIndex);
                }

                // Row validations
                if (!StringUtils.hasText(name)) {
                    errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name, "Tên hàng hóa không được để trống"));
                    continue;
                }
                if (!StringUtils.hasText(unit)) {
                    errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name, "Đơn vị tính không được để trống"));
                    continue;
                }
                if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                    errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name, "Giá bán phải lớn hơn 0"));
                    continue;
                }
                if (processedSkusInFile.contains(sku)) {
                    errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name, "Trùng mã sản phẩm (SKU) tại dòng tương ứng trong tệp"));
                    continue;
                }
                if (existingSkusInDb.contains(sku)) {
                    errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name, "Mã hàng (SKU) đã tồn tại trong hộ kinh doanh"));
                    continue;
                }

                // Resolve TaxRate from cell 5 or fallback to default
                TaxRate resolvedTaxRate = null;
                if (StringUtils.hasText(taxRateStr)) {
                    try {
                        BigDecimal targetRate = new BigDecimal(taxRateStr.replace("%", "").trim());
                        resolvedTaxRate = activeTaxRates.stream()
                                .filter(tr -> tr.getRatePercentage().compareTo(targetRate) == 0)
                                .findFirst()
                                .orElse(null);
                        if (resolvedTaxRate == null) {
                            errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name,
                                    "Không tìm thấy thuế suất (" + taxRateStr + "%) phù hợp trong danh mục thuế suất của hộ kinh doanh"));
                            continue;
                        }
                    } catch (Exception e) {
                        errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name,
                                "Thuế suất nhập vào không đúng định dạng số"));
                        continue;
                    }
                } else {
                    resolvedTaxRate = defaultTaxRate;
                }

                if (resolvedTaxRate == null) {
                    errors.add(new ImportProductResultResponse.RowErrorDetail(actualRowNumber, name,
                            "Chưa cấu hình thuế suất cho hàng hóa và không có thuế suất mặc định"));
                    continue;
                }

                // Match or auto-create ProductGroup from in-memory cache
                ProductGroup group = null;
                if (StringUtils.hasText(groupName)) {
                    group = existingGroupsMap.get(groupName);
                    if (group == null) {
                        group = productGroupRepository.save(ProductGroup.builder()
                                .household(household)
                                .name(groupName)
                                .build());
                        existingGroupsMap.put(groupName, group);
                    }
                }

                Product product = Product.builder()
                        .household(household)
                        .sku(sku)
                        .name(name)
                        .unit(unit)
                        .price(price)
                        .stockQuantity(stock != null ? stock : BigDecimal.ZERO)
                        .group(group)
                        .taxRate(resolvedTaxRate)
                        .status("ACTIVE")
                        .build();

                productBatch.add(product);
                processedSkusInFile.add(sku);
                existingSkusInDb.add(sku);
                successCount++;

                // Batching 100 items per batch to optimize MySQL IO
                if (productBatch.size() >= 100) {
                    productRepository.saveAll(productBatch);
                    productBatch.clear();
                }
            }

            if (!productBatch.isEmpty()) {
                productRepository.saveAll(productBatch);
                productBatch.clear();
            }

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi xử lý đọc tệp Excel import sản phẩm", e);
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        if (totalRows == 0) {
            throw new AppException(ErrorCode.EMPTY_IMPORT_FILE);
        }

        return ImportProductResultResponse.builder()
                .totalRows(totalRows)
                .successCount(successCount)
                .errorCount(errors.size())
                .errors(errors)
                .build();
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && StringUtils.hasText(ExcelParserUtils.getCellValueAsString(cell))) {
                return false;
            }
        }
        return true;
    }
}
