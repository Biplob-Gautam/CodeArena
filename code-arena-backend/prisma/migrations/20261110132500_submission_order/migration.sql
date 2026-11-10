CREATE SEQUENCE "Submission_submissionOrder_seq";

ALTER TABLE "Submission"
ADD COLUMN "submissionOrder" INTEGER;

WITH ordered_submissions AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "submittedAt" ASC, "id" ASC)::INTEGER AS "submissionOrder"
    FROM "Submission"
)
UPDATE "Submission" AS submission
SET "submissionOrder" = ordered_submissions."submissionOrder"
FROM ordered_submissions
WHERE submission."id" = ordered_submissions."id";

SELECT setval(
    '"Submission_submissionOrder_seq"',
    COALESCE((SELECT MAX("submissionOrder") FROM "Submission"), 0) + 1,
    false
);

ALTER SEQUENCE "Submission_submissionOrder_seq"
OWNED BY "Submission"."submissionOrder";

ALTER TABLE "Submission"
ALTER COLUMN "submissionOrder" SET DEFAULT nextval('"Submission_submissionOrder_seq"'),
ALTER COLUMN "submissionOrder" SET NOT NULL;

CREATE UNIQUE INDEX "Submission_submissionOrder_key"
ON "Submission"("submissionOrder");

CREATE INDEX "Submission_participantId_submissionOrder_idx"
ON "Submission"("participantId", "submissionOrder");
