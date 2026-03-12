-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'untriaged',
    "priority" TEXT NOT NULL DEFAULT 'unprioritized',
    "complexity" TEXT NOT NULL DEFAULT 'unknown',
    "source_url" TEXT,
    "repo" TEXT NOT NULL,
    "labels" TEXT NOT NULL DEFAULT '[]',
    "assignee" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "scoping_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issue_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "affected_files" TEXT NOT NULL DEFAULT '[]',
    "root_cause_hypothesis" TEXT NOT NULL,
    "suggested_approach" TEXT NOT NULL,
    "estimated_effort" TEXT NOT NULL,
    "datadog_findings" TEXT,
    "data_layer_findings" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "open_questions" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scoping_reports_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issue_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "scoping_reports_issue_id_key" ON "scoping_reports"("issue_id");
