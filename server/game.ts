import { WebSocket } from "ws";
import { storage } from "./storage";
import { Period } from "@shared/schema";
import { log } from "./vite";

const PERIOD_LENGTH = 3 * 60 * 1000; // 3 minutes
const COOLDOWN_PERIOD = 30 * 1000; // 30 seconds

export class GameServer {
  private clients: Set<WebSocket>;
  private currentPeriod?: Period;
  private periodTimer?: NodeJS.Timeout;

  constructor() {
    this.clients = new Set();
    this.initializeGame();
  }

  private async initializeGame() {
    log("Initializing game server...");
    this.currentPeriod = await storage.getCurrentPeriod();
    this.schedulePeriodEnd();
    log(`Game initialized with period: ${this.currentPeriod?.id}`); // Added ?. for safety
  }

  private schedulePeriodEnd() {
    if (!this.currentPeriod) return;

    const now = new Date().getTime();
    const endTime = this.currentPeriod.endTime.getTime();
    const timeLeft = Math.max(0, endTime - now);

    log(`Scheduling period end in ${timeLeft}ms`);
    this.periodTimer = setTimeout(() => this.endPeriod(), timeLeft);
  }

  private async endPeriod() {
    if (!this.currentPeriod) return;

    log(`Ending period ${this.currentPeriod.id}`);

    // Generate random result
    const number = Math.floor(Math.random() * 10);
    let colors: ("red" | "green" | "violet")[] = [];

    // Special color combinations for 0 and 5
    if (number === 0) {
      colors = ["violet", "red"];
    } else if (number === 5) {
      colors = ["violet", "green"];
    } else {
      // For other numbers
      colors = [number % 2 === 0 ? "green" : "red"];
    }

    const color = colors.join("+");
    const price = parseFloat((Math.random() * 100 + 50).toFixed(2));

    log(`Generated result: number=${number}, color=${color}, price=${price}`);

    // Update period with results
    const completedPeriod = await storage.setPeriodResult(this.currentPeriod.id, {
      number,
      color,
      price,
      isActive: false
    });

    // Process all bets for this period
    const bets = await storage.getPeriodBets(this.currentPeriod.id);
    log(`Processing ${bets.length} bets for period ${this.currentPeriod.id}`);

    for (const bet of bets) {
      let isWin = false;
      let payout = 0;

      if (bet.type === "color") {
        // Color bet wins if any of the result colors match the bet
        isWin = colors.includes(bet.value as any);
        payout = isWin ? bet.amount * 2 : 0;
      } else {
        // Number bet
        isWin = number.toString() === bet.value;
        payout = isWin ? bet.amount * 9 : 0;
      }

      // Update bet result and user balance
      await storage.updateBetResult(bet.id, {
        result: isWin ? "win" : "loss",
        payout
      });

      if (isWin) {
        await storage.updateUserBalance(bet.userId, payout);
        await storage.createTransaction({
          userId: bet.userId,
          type: "win",
          amount: payout
        });
      }

      log(`Processed bet ${bet.id}: ${isWin ? 'win' : 'loss'}, payout=${payout}`);
    }

    // Start new period after cooldown
    setTimeout(() => this.startNewPeriod(), COOLDOWN_PERIOD);

    // Notify clients
    this.broadcast({
      type: "periodEnd",
      period: completedPeriod
    });
  }

  private async startNewPeriod() {
    this.currentPeriod = await storage.getCurrentPeriod();
    log(`Starting new period: ${this.currentPeriod?.id}`); // Added ?. for safety
    this.schedulePeriodEnd();

    this.broadcast({
      type: "periodStart",
      period: this.currentPeriod
    });
  }

  addClient(ws: WebSocket) {
    this.clients.add(ws);
    log(`Client added. Total clients: ${this.clients.size}`);

    // Send current game state
    if (this.currentPeriod) {
      ws.send(JSON.stringify({
        type: "gameState",
        period: this.currentPeriod
      }));
    }

    ws.on("close", () => {
      this.removeClient(ws);
    });
  }

  removeClient(ws: WebSocket) {
    this.clients.delete(ws);
    log(`Client removed. Total clients: ${this.clients.size}`);
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    log(`Broadcasting message: ${messageStr}`);

    Array.from(this.clients).forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

export const gameServer = new GameServer();