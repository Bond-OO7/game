import { InsertUser, User, Period, Bet, Transaction } from "@shared/schema";
import { SessionStore } from "express-session";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;

  // Period operations
  getCurrentPeriod(): Promise<Period>;
  getPeriodHistory(limit: number): Promise<Period[]>;
  setPeriodResult(periodId: string, result: Partial<Period>): Promise<Period>;

  // Bet operations
  createBet(bet: Omit<Bet, "id" | "createdAt">): Promise<Bet>;
  getUserBets(userId: number, limit: number): Promise<Bet[]>;

  // Transaction operations
  createTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  getUserTransactions(userId: number, limit: number): Promise<Transaction[]>;

  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private periods: Map<string, Period>;
  private bets: Bet[];
  private transactions: Transaction[];
  private currentId: number;
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.periods = new Map();
    this.bets = [];
    this.transactions = [];
    this.currentId = 1;
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, balance: "0" };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const newBalance = parseFloat(user.balance) + amount;
    const updatedUser = { ...user, balance: newBalance.toFixed(2) };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getCurrentPeriod(): Promise<Period> {
    const now = new Date();
    // Find the current active period or create a new one
    const currentPeriod = Array.from(this.periods.values()).find(p => p.isActive);
    if (currentPeriod) return currentPeriod;
    
    const newPeriod = this.createNewPeriod(now);
    this.periods.set(newPeriod.id, newPeriod);
    return newPeriod;
  }

  async getPeriodHistory(limit: number): Promise<Period[]> {
    return Array.from(this.periods.values())
      .filter(p => !p.isActive)
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
      .slice(0, limit);
  }

  async setPeriodResult(periodId: string, result: Partial<Period>): Promise<Period> {
    const period = this.periods.get(periodId);
    if (!period) throw new Error("Period not found");
    
    const updatedPeriod = { ...period, ...result };
    this.periods.set(periodId, updatedPeriod);
    return updatedPeriod;
  }

  async createBet(bet: Omit<Bet, "id" | "createdAt">): Promise<Bet> {
    const newBet: Bet = {
      ...bet,
      id: this.bets.length + 1,
      createdAt: new Date()
    };
    this.bets.push(newBet);
    return newBet;
  }

  async getUserBets(userId: number, limit: number): Promise<Bet[]> {
    return this.bets
      .filter(bet => bet.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.transactions.length + 1,
      createdAt: new Date()
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async getUserTransactions(userId: number, limit: number): Promise<Transaction[]> {
    return this.transactions
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private createNewPeriod(now: Date): Period {
    const startTime = new Date(now);
    const endTime = new Date(startTime.getTime() + 3 * 60 * 1000);
    
    const periodId = `${startTime.getFullYear()}${
      String(startTime.getMonth() + 1).padStart(2, '0')}${
      String(startTime.getDate()).padStart(2, '0')}${
      Math.floor(startTime.getHours() * 60 + startTime.getMinutes() / 3)}`;
    
    return {
      id: periodId,
      startTime,
      endTime,
      isActive: true
    };
  }
}

export const storage = new MemStorage();