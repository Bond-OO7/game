import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { gameServer } from "./game";
import { betSchema, transactionSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws" // Explicitly set WebSocket path
  });

  wss.on("listening", () => {
    log("WebSocket server is listening");
  });

  wss.on("error", (error) => {
    log(`WebSocket server error: ${error.message}`);
  });

  wss.on("connection", async (ws, req) => {
    log(`New WebSocket connection from ${req.socket.remoteAddress}`);

    // Send immediate game state update
    const currentPeriod = await storage.getCurrentPeriod();
    ws.send(JSON.stringify({
      type: "gameState",
      period: currentPeriod
    }));

    gameServer.addClient(ws);

    ws.on("message", (data) => {
      log(`WebSocket message received: ${data}`);
    });

    ws.on("error", (error) => {
      log(`WebSocket client error: ${error.message}`);
    });

    ws.on("close", () => {
      log("WebSocket client disconnected");
      gameServer.removeClient(ws);
    });
  });

  // Game routes
  app.get("/api/periods/current", (req, res) => {
    storage.getCurrentPeriod().then(period => res.json(period));
  });

  app.get("/api/periods/history", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    storage.getPeriodHistory(page * limit).then(periods => {
      // Return only the last page worth of records
      const startIndex = (page - 1) * limit;
      res.json(periods.slice(startIndex, startIndex + limit));
    });
  });

  app.post("/api/bets", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const bet = betSchema.parse(req.body);
      const currentPeriod = await storage.getCurrentPeriod();

      // Verify bet timing
      const now = new Date();
      const timeLeft = currentPeriod.endTime.getTime() - now.getTime();
      if (timeLeft < 30000) { // 30 seconds before period end
        return res.status(400).json({ message: "Betting is closed for this period" });
      }

      // Verify user has sufficient balance
      if (parseFloat(req.user.balance) < bet.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Calculate multiplier based on bet type
      const multiplier = bet.type === "color" ? 2 : 9;

      const newBet = await storage.createBet({
        userId: req.user.id,
        periodId: currentPeriod.id,
        type: bet.type,
        value: bet.value,
        amount: bet.amount,
        multiplier
      });

      // Deduct bet amount from user balance
      await storage.updateUserBalance(req.user.id, -bet.amount);

      res.status(201).json(newBet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid bet data" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.get("/api/bets/history", (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    storage.getUserBets(req.user.id, page * limit).then(bets => {
      // Return only the last page worth of records
      const startIndex = (page - 1) * limit;
      res.json(bets.slice(startIndex, startIndex + limit));
    });
  });

  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const transaction = transactionSchema.parse(req.body);

      const newTransaction = await storage.createTransaction({
        userId: req.user.id,
        type: transaction.type,
        amount: transaction.amount
      });

      // Update user balance
      const multiplier = transaction.type === "withdrawal" ? -1 : 1;
      await storage.updateUserBalance(
        req.user.id,
        transaction.amount * multiplier
      );

      res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.get("/api/transactions/history", (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    storage.getUserTransactions(req.user.id, page * limit).then(transactions => {
      // Return only the last page worth of records
      const startIndex = (page - 1) * limit;
      res.json(transactions.slice(startIndex, startIndex + limit));
    });
  });

  return httpServer;
}