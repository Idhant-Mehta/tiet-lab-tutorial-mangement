import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["teacher", "student"] }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  problems: jsonb("problems").notNull(), // Array of problem objects
  timeLimit: integer("time_limit"), // in minutes
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  problemIndex: integer("problem_index").notNull(),
  code: text("code").notNull(),
  status: text("status", { enum: ["pending", "passed", "failed", "error"] }).default("pending"),
  testResults: jsonb("test_results"), // Array of test case results
  score: integer("score"), // out of 100
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  name: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// Problem structure for assignments
export const problemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  inputFormat: z.string(),
  outputFormat: z.string(),
  constraints: z.string(),
  sampleInput: z.string(),
  sampleOutput: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimit: z.number(), // in seconds
  memoryLimit: z.number(), // in MB
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
  })),
});

export type Problem = z.infer<typeof problemSchema>;
