DROP INDEX IF EXISTS "catalog_candidate_issues_candidate_id_issue_key_field_key";

CREATE UNIQUE INDEX IF NOT EXISTS "catalog_candidate_issues_candidate_id_issue_key_field_message_key"
ON "catalog_candidate_issues"("candidate_id", "issue_key", "field", "message");
