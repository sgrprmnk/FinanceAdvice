import { expenses, goals, users, type User, type InsertUser, type Expense, type InsertExpense, type Goal, type InsertGoal } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Expense operations
  getExpenses(userId: number): Promise<Expense[]>;
  getExpensesByCategory(userId: number, category: string): Promise<Expense[]>;
  getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoalById(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
  
  // Optional initialization for test data
  initializeTestData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    console.log("DatabaseStorage initialized with PostgreSQL");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      createdAt: new Date()
    }).returning();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Expense operations
  async getExpenses(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getExpensesByCategory(userId: number, category: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(
      and(
        eq(expenses.userId, userId),
        eq(expenses.category, category)
      )
    );
  }

  async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await db.select().from(expenses).where(
      and(
        eq(expenses.userId, userId),
        sql`${expenses.date} >= ${startDateStr}`,
        sql`${expenses.date} <= ${endDateStr}`
      )
    );
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    // Convert amount to string if it's a number (PostgreSQL expects numeric as string)
    const expenseData = {
      ...insertExpense,
      amount: String(insertExpense.amount)
    };
    
    // Remove any properties that aren't in the expenses schema
    delete (expenseData as any).createdAt;
    
    const [expense] = await db.insert(expenses).values(expenseData).returning();
    
    return expense;
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const [updatedExpense] = await db.update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id))
      .returning();
    
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoalById(id: number): Promise<Goal | undefined> {
    const result = await db.select().from(goals).where(eq(goals.id, id));
    return result[0];
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    // Convert numeric values to strings for PostgreSQL
    const goalData = {
      ...insertGoal,
      targetAmount: String(insertGoal.targetAmount),
      currentAmount: insertGoal.currentAmount ? String(insertGoal.currentAmount) : "0",
      status: insertGoal.status || "in_progress"
    };
    
    // Remove any properties that aren't in the goals schema
    delete (goalData as any).createdAt;
    
    const [goal] = await db.insert(goals).values(goalData).returning();
    
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db.update(goals)
      .set(goalData)
      .where(eq(goals.id, id))
      .returning();
    
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db.delete(goals).where(eq(goals.id, id)).returning();
    return result.length > 0;
  }
  
  // Initialize test data for development
  async initializeTestData(): Promise<void> {
    try {
      // Check if test user already exists
      const existingUser = await this.getUserByUsername("testuser");
      
      if (!existingUser) {
        console.log("Creating test user: testuser / password");
        
        // Import password hashing function from auth.ts
        const { hashPassword } = await import('./auth');
        
        // Create a test user with hashed password
        const user = await this.createUser({
          username: "testuser",
          password: await hashPassword("password"), // Hash the password properly
          firstName: "Test",
          lastName: "User",
          email: "test@example.com"
        });
        
        console.log(`Test user created with ID: ${user.id}`);
      } else {
        console.log("Test user already exists, skipping creation");
      }
    } catch (error) {
      console.error("Failed to initialize test data:", error);
    }
  }
}

export const storage = new DatabaseStorage();
