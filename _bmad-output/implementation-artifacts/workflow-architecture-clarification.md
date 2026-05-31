# Workflow Architecture Clarification

**Date:** 2026-05-23  
**Purpose:** Clarify the distinction between workflows and workflow documents, and unify naming conventions

## Current State (Confusing)

### Existing Services:
- `backend/services/workflowService.js` - Handles Workflow model (workflow instances without documents)
- `backend/services/workflowDocumentService.js` - Handles WorkflowDocument model (documents with workflow status)

### Existing Routes:
- `backend/routes/workflows.js` - API routes for Workflow model
- `backend/routes/workflow-documents.js` - API routes for WorkflowDocument model

## Problem

The naming is confusing because:
1. "workflow service" could refer to either Workflow or WorkflowDocument
2. "workflow routes" vs "workflow documents routes" is inconsistent
3. It's unclear when to use Workflow vs WorkflowDocument
4. The relationship between the two models needs clarification

## Proposed Architecture

### Two Distinct Concepts:

**1. Workflow (without document)**
- **Purpose:** Process flows and approvals that don't require file attachments
- **Use Cases:** Approval processes, task assignments, status transitions
- **Model:** `Workflow` (existing)
- **Service:** `workflowService.js` (keep as-is)
- **Routes:** `workflows.js` (keep as-is)
- **Example:** HR approval process for a request

**2. Workflow Document (with document)**
- **Purpose:** Document-centric workflows with file attachments
- **Use Cases:** Attendance reports, scanned documents, file submissions
- **Model:** `WorkflowDocument` (existing)
- **Service:** `workflowDocumentService.js` (keep as-is)
- **Routes:** `workflow-documents.js` (keep as-is)
- **Example:** Daily attendance report submitted for HR review

### Naming Convention Proposal

**Option A: Keep Current (Explicit)**
- Service: `workflowService.js` vs `workflowDocumentService.js`
- Routes: `workflows.js` vs `workflow-documents.js`
- API: `/api/v1/workflows` vs `/api/v1/workflow-documents`
- **Pros:** Explicit, clear distinction
- **Cons:** Longer names, slightly verbose

**Option B: Unified Naming (Simpler)**
- Service: `workflowService.js` vs `documentWorkflowService.js`
- Routes: `workflows.js` vs `document-workflows.js`
- API: `/api/v1/workflows` vs `/api/v1/document-workflows`
- **Pros:** Consistent "workflow" suffix
- **Cons:** Still two services, "document-workflow" is awkward

**Option C: Context-Based (Recommended)**
- Keep current naming as-is
- Add clear documentation in ARCHITECTURE_GUIDE.md
- Use comments in code to clarify usage
- **Pros:** No breaking changes, explicit is better
- **Cons:** Requires documentation

## Relationship Between Models

```
Workflow (process without file)
├── WorkflowInstance (execution instance)
├── WorkflowStep (approval steps)
└── WorkflowHistory (audit trail)

WorkflowDocument (document with workflow)
├── File (attached document in MinIO)
├── WorkflowComment (comments on document)
└── WorkflowStatusHistory (status transitions)
```

## Decision Needed

**Question 1:** Should we keep the current naming (Option A) or rename to Option B?

**Question 2:** Should we add a cleanup task to Story 1.3 to:
- Add documentation clarifying the distinction
- Add code comments in both services
- Update ARCHITECTURE_GUIDE.md with clear examples?

**Question 3:** Are there any cases where a Workflow should have a File, or WorkflowDocument should not have a File? If so, we may need to reconsider the model separation.

## Recommendation

**Keep current naming (Option A)** because:
1. Explicit is better than implicit
2. No breaking changes required
3. The distinction is meaningful (document vs process)
4. Renaming would require updating all API consumers

**Add documentation task to Story 1.3** to:
1. Update ARCHITECTURE_GUIDE.md with clear examples
2. Add JSDoc comments to both services
3. Create a decision matrix for when to use each model
