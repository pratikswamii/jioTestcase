package com.testmo.controller;

import com.testmo.model.TestCase;
import com.testmo.repository.TestCaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import com.testmo.model.Step;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
@RestController
@RequestMapping("/api/testcases")
@CrossOrigin(origins = "http://localhost:4200")
public class TestCaseController {

    @Autowired
    private TestCaseRepository repository;

    @GetMapping
    public List<TestCase> getAllTestCases() {
        return repository.findAll();
    }

    @PostMapping
    public TestCase createTestCase(@RequestBody TestCase testCase) {
        if (testCase.getCreatedAt() == null) {
            testCase.setCreatedAt(new Date());
        }
        testCase.setModifiedAt(new Date());
        return repository.save(testCase);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestCase> updateTestCase(@PathVariable Long id, @RequestBody TestCase updated) {
        Optional<TestCase> optional = repository.findById(id);
        if (optional.isPresent()) {
            TestCase existing = optional.get();
            
            // Update fields
            if (updated.getName() != null) existing.setName(updated.getName());
            if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            if (updated.getType() != null) existing.setType(updated.getType());
            if (updated.getState() != null) existing.setState(updated.getState());
            if (updated.getAutomationType() != null) existing.setAutomationType(updated.getAutomationType());
            if (updated.getFolderId() != null) existing.setFolderId(updated.getFolderId());
            if (updated.getPriority() != null) existing.setPriority(updated.getPriority());
            if (updated.getOwner() != null) existing.setOwner(updated.getOwner());
            if (updated.getAutomationScript() != null) existing.setAutomationScript(updated.getAutomationScript());
            if (updated.getPrecondition() != null) existing.setPrecondition(updated.getPrecondition());
            if (updated.getIsAutomated() != null) existing.setIsAutomated(updated.getIsAutomated());
            if (updated.getTags() != null) existing.setTags(updated.getTags());

            // Steps update
            if (existing.getSteps() != null) {
                existing.getSteps().clear();
            }
            if (updated.getSteps() != null) {
                for (Step step : updated.getSteps()) {
                    step.setTestCase(existing);
                    if (existing.getSteps() != null) {
                        existing.getSteps().add(step);
                    }
                }
                if (existing.getSteps() == null) {
                    existing.setSteps(updated.getSteps());
                }
            }

            existing.setModifiedAt(new Date());
            return ResponseEntity.ok(repository.save(existing));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestCase(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    public static class BulkStateUpdateRequest {
        private List<Long> ids;
        private String state;

        public List<Long> getIds() { return ids; }
        public void setIds(List<Long> ids) { this.ids = ids; }

        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
    }

    @PutMapping("/bulk-update-state")
    public ResponseEntity<List<TestCase>> bulkUpdateState(@RequestBody BulkStateUpdateRequest request) {
        if (request.getIds() == null || request.getIds().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        List<TestCase> testCasesToUpdate = repository.findAllById(request.getIds());
        for (TestCase tc : testCasesToUpdate) {
            tc.setState(request.getState());
            tc.setModifiedAt(new Date());
        }
        
        List<TestCase> saved = repository.saveAll(testCasesToUpdate);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/import")
    public ResponseEntity<List<TestCase>> importExcel(@RequestParam("file") MultipartFile file) {
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
             
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            
            List<TestCase> testCases = new ArrayList<>();
            int rowNumber = 0;
            
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                if (rowNumber == 0) {
                    rowNumber++;
                    continue;
                }
                
                TestCase tc = new TestCase();
                
                Cell titleCell = currentRow.getCell(0);
                if (titleCell != null && titleCell.getCellType() == CellType.STRING) {
                    tc.setTitle(titleCell.getStringCellValue());
                } else if (titleCell != null && titleCell.getCellType() == CellType.NUMERIC) {
                    tc.setTitle(String.valueOf(titleCell.getNumericCellValue()));
                }
                
                if (tc.getTitle() == null || tc.getTitle().trim().isEmpty()) {
                    continue;
                }
                tc.setName(tc.getTitle());
                
                Cell descCell = currentRow.getCell(1);
                if (descCell != null) tc.setDescription(getCellValueAsString(descCell));
                
                Cell preCell = currentRow.getCell(2);
                if (preCell != null) tc.setPrecondition(getCellValueAsString(preCell));
                
                String stepDesc = getCellValueAsString(currentRow.getCell(3));
                String expRes = getCellValueAsString(currentRow.getCell(4));
                
                if (stepDesc != null || expRes != null) {
                    List<Step> steps = new ArrayList<>();
                    Step s = new Step();
                    s.setDescription(stepDesc);
                    s.setExpectedResult(expRes);
                    s.setTestCase(tc);
                    steps.add(s);
                    tc.setSteps(steps);
                }
                
                Cell typeCell = currentRow.getCell(5);
                if (typeCell != null) tc.setType(getCellValueAsString(typeCell));
                
                Cell prioCell = currentRow.getCell(6);
                if (prioCell != null) tc.setPriority(getCellValueAsString(prioCell));
                
                Cell stateCell = currentRow.getCell(7);
                if (stateCell != null) tc.setState(getCellValueAsString(stateCell));
                
                Cell autoCell = currentRow.getCell(8);
                if (autoCell != null) {
                   String autoStr = getCellValueAsString(autoCell);
                   tc.setIsAutomated("true".equalsIgnoreCase(autoStr) || "yes".equalsIgnoreCase(autoStr));
                }
                
                Cell tagCell = currentRow.getCell(9);
                if (tagCell != null) tc.setTags(getCellValueAsString(tagCell));
                
                tc.setCreatedAt(new Date());
                tc.setModifiedAt(new Date());
                testCases.add(tc);
            }
            
            return ResponseEntity.ok(repository.saveAll(testCases));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf(cell.getNumericCellValue());
        if (cell.getCellType() == CellType.BOOLEAN) return String.valueOf(cell.getBooleanCellValue());
        return null;
    }
}
