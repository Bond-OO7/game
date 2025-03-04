import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
});

export type User = typeof users.$inferSelect;
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Period = {
  id: string;
  startTime: Date;
  endTime: Date;
  number?: number;
  color?: "red" | "green" | "violet";
  price?: number;
  isActive: boolean;
};

export type Bet = {
  id: number;
  userId: number;
  periodId: string;
  type: "color" | "number";
  value: string;
  amount: number;
  multiplier: number;
  result?: "win" | "loss";
  payout?: number;
  createdAt: Date;
};

export type Transaction = {
  id: number;
  userId: number;
  type: "deposit" | "withdrawal" | "win" | "loss";
  amount: number;
  createdAt: Date;
};

export const betSchema = z.object({
  type: z.enum(["color", "number"]),
  value: z.string(),
  amount: z.number().positive(),
});

export const transactionSchema = z.object({
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.number().positive(),
});
