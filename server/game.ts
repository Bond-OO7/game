import { WebSocket } from "ws";
import { storage } from "./storage";
import { Period } from "@shared/schema";

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
    this.currentPeriod = await storage.getCurrentPeriod();
    this.schedulePeriodEnd();
  }

  private schedulePeriodEnd() {
    if (!this.currentPeriod) return;

    const now = new Date().getTime();
    const endTime = this.currentPeriod.endTime.getTime();
    const timeLeft = Math.max(0, endTime - now);

    this.periodTimer = setTimeout(() => this.endPeriod(), timeLeft);
  }

  private async endPeriod() {
    if (!this.currentPeriod) return;

    // Generate random result
    const number = Math.floor(Math.random() * 10);
    let colors: ("red" | "green" | "violet")[] = [];

    // Violet appears on 0 and 5
    if (number === 0 || number === 5) {
      colors.push("violet");
    }

    // Red appears on odd numbers
    if (number % 2 === 1) {
      colors.push("red");
    }
    // Green appears on even numbers
    else {
      colors.push("green");
    }

    const color = colors.length > 1 ? colors.join("+") : colors[0];
    const price = parseFloat((Math.random() * 100 + 50).toFixed(2));

    // Update period with results
    const completedPeriod = await storage.setPeriodResult(this.currentPeriod.id, {
      number,
      color,
      price,
      isActive: false
    });

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
    this.schedulePeriodEnd();

    this.broadcast({
      type: "periodStart",
      period: this.currentPeriod
    });
  }

  addClient(ws: WebSocket) {
    this.clients.add(ws);

    // Send current game state
    if (this.currentPeriod) {
      ws.send(JSON.stringify({
        type: "gameState",
        period: this.currentPeriod
      }));
    }

    ws.on("close", () => {
      this.clients.delete(ws);
    });
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    Array.from(this.clients).forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

export const gameServer = new GameServer();