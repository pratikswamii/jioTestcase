package com.testmo.model;

import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "testcases")
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private String name;
    private String type;
    private String state;
    private String automationType;
    private String folderId;
    
    // Additional UI fields
    private String priority;
    private String owner;
    private String automationScript;
    private String precondition;
    private Boolean isAutomated;
    private String tags;
    
    @OneToMany(mappedBy = "testCase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Step> steps;

    private Date createdAt;
    private Date modifiedAt;

    public TestCase() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getAutomationType() { return automationType; }
    public void setAutomationType(String automationType) { this.automationType = automationType; }

    public String getFolderId() { return folderId; }
    public void setFolderId(String folderId) { this.folderId = folderId; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public String getAutomationScript() { return automationScript; }
    public void setAutomationScript(String automationScript) { this.automationScript = automationScript; }

    public String getPrecondition() { return precondition; }
    public void setPrecondition(String precondition) { this.precondition = precondition; }

    public Boolean getIsAutomated() { return isAutomated; }
    public void setIsAutomated(Boolean isAutomated) { this.isAutomated = isAutomated; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public List<Step> getSteps() { return steps; }
    public void setSteps(List<Step> steps) { this.steps = steps; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getModifiedAt() { return modifiedAt; }
    public void setModifiedAt(Date modifiedAt) { this.modifiedAt = modifiedAt; }
}

