// Demo in-memory note storage module.
// In production, this would connect to a real database (DynamoDB, PostgreSQL, etc.)
// For now, we use hardcoded example data to demonstrate the Note interface.

export interface Note {
  id: string;
  title: string;
  content: string;
}

const noteStore = {
  /**
   * Returns all notes from storage.
   * In production, this would query a database.
   */
  getAll(): Note[] {
    return [
      {
        id: "note-001",
        title: "Project Kickoff Meeting",
        content: "Discussed project timeline and deliverables. Team agreed on sprint duration of 2 weeks. Next meeting scheduled for Monday 10 AM.",
      },
      {
        id: "note-002",
        title: "API Design Review",
        content: "Reviewed REST endpoints for user management. Approved authentication flow. Need to add rate limiting before production release.",
      },
      {
        id: "note-003",
        title: "Bug Fix: Login Page",
        content: "Fixed issue where password reset email was not sending. Root cause was incorrect SMTP configuration. Deployed to staging for testing.",
      },
      {
        id: "note-004",
        title: "Database Migration Plan",
        content: "Planning migration from MySQL to PostgreSQL. Estimated downtime: 2 hours. Will perform during maintenance window on Saturday night.",
      },
      {
        id: "note-005",
        title: "Customer Feedback Summary",
        content: "Users requested dark mode and offline support. Dark mode is high priority for next sprint. Offline support deferred to Q3 roadmap.",
      },
    ];
  },
};

export default noteStore;
