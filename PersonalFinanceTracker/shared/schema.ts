import { pgTable, text, serial, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
});

// Expense schema
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  note: text("note"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create the base schema and then customize it to accept both number and string for amount
const baseExpenseSchema = createInsertSchema(expenses);

export const insertExpenseSchema = baseExpenseSchema.pick({
  userId: true,
  category: true,
  description: true,
  note: true,
  date: true,
}).extend({
  // Allow amount to be either a number or a string that can be parsed to a number
  amount: z.union([
    z.number().min(0.01, "Amount must be greater than 0"),
    z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a valid positive number"
    })
  ])
});

// Goal schema
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").notNull().default("0"),
  targetDate: date("target_date"),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  name: true,
  targetAmount: true,
  currentAmount: true,
  targetDate: true,
  status: true,
});

// Types for the schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// Expense category enum
export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Bills",
  "Other"
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Goal status enum
export const GOAL_STATUSES = [
  "in_progress",
  "on_track",
  "behind_schedule",
  "completed"
] as const;

export type GoalStatus = typeof GOAL_STATUSES[number];
