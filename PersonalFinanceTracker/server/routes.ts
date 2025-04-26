import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { InsertExpense, insertExpenseSchema, InsertGoal, insertGoalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Add a route to serve our test login page
  app.get('/test-login', (req, res) => {
    res.sendFile('test-login.html', { root: '.' });
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // EXPENSE ROUTES
  
  // Get all expenses for the authenticated user
  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    try {
      const expenses = await storage.getExpenses(userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Get expenses by category
  app.get("/api/expenses/category/:category", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    const { category } = req.params;
    
    try {
      const expenses = await storage.getExpensesByCategory(userId, category);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses by category" });
    }
  });

  // Get expenses by date range
  app.get("/api/expenses/dateRange", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }
    
    try {
      const expenses = await storage.getExpensesByDateRange(
        userId, 
        new Date(startDate), 
        new Date(endDate)
      );
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses by date range" });
    }
  });

  // Create a new expense
  app.post("/api/expenses", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    try {
      // Pre-process the request body to ensure amount is handled correctly
      const requestData = {
        ...req.body,
        userId,
        // Ensure amount is a number
        amount: typeof req.body.amount === 'string' 
          ? parseFloat(req.body.amount) 
          : req.body.amount
      };

      console.log('Processing expense data:', requestData);
      
      const validatedData = insertExpenseSchema.parse(requestData);
      
      const expense = await storage.createExpense(validatedData as InsertExpense);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Update an expense
  app.put("/api/expenses/:id", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    const expenseId = parseInt(req.params.id);
    
    try {
      const expense = await storage.getExpenseById(expenseId);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      if (expense.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this expense" });
      }
      
      const updatedExpense = await storage.updateExpense(expenseId, req.body);
      res.json(updatedExpense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  // Delete an expense
  app.delete("/api/expenses/:id", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    const expenseId = parseInt(req.params.id);
    
    try {
      const expense = await storage.getExpenseById(expenseId);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      if (expense.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this expense" });
      }
      
      const result = await storage.deleteExpense(expenseId);
      if (result) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete expense" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // GOAL ROUTES
  
  // Get all goals for the authenticated user
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    try {
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  // Create a new goal
  app.post("/api/goals", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    try {
      const validatedData = insertGoalSchema.parse({
        ...req.body,
        userId
      });
      
      const goal = await storage.createGoal(validatedData as InsertGoal);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Update a goal
  app.put("/api/goals/:id", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    const goalId = parseInt(req.params.id);
    
    try {
      const goal = await storage.getGoalById(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this goal" });
      }
      
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  // Delete a goal
  app.delete("/api/goals/:id", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    const goalId = parseInt(req.params.id);
    
    try {
      const goal = await storage.getGoalById(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this goal" });
      }
      
      const result = await storage.deleteGoal(goalId);
      if (result) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete goal" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });
    
    try {
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
