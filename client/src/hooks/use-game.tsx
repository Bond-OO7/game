import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Period } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type GameContextType = {
  period: Period | null;
  remainingTime: number;
  isCooldown: boolean;
  isConnected: boolean;
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: period } = useQuery<Period>({
    queryKey: ["/api/periods/current"],
  });

  const [remainingTime, setRemainingTime] = useState(180); // 3 minutes
  const [isCooldown, setIsCooldown] = useState(false);

  // WebSocket connection
  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setWs(socket);
        toast({
          title: "Connected to game server",
        });
      };

      socket.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        setWs(null);
        toast({
          title: "Disconnected from game server",
          description: "Attempting to reconnect...",
          variant: "destructive",
        });
        // Try to reconnect after a delay
        setTimeout(connect, 5000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        toast({
          title: "Connection error",
          description: "Failed to connect to game server",
          variant: "destructive",
        });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case "gameState":
            case "periodStart":
              queryClient.setQueryData(["/api/periods/current"], data.period);
              break;
            case "periodEnd":
              queryClient.invalidateQueries({ queryKey: ["/api/periods/history"] });
              queryClient.invalidateQueries({ queryKey: ["/api/bets/history"] });
              queryClient.invalidateQueries({ queryKey: ["/api/transactions/history"] });
              window.location.reload(); // Refresh the page when period ends
              break;
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };
    }

    connect();

    return () => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient, toast]);

  // Timer logic
  useEffect(() => {
    if (!period) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(period.endTime).getTime();
      const timeLeft = Math.max(0, end - now);

      setRemainingTime(Math.floor(timeLeft / 1000));
      setIsCooldown(timeLeft < 30000); // Last 30 seconds
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [period]);

  return (
    <GameContext.Provider
      value={{
        period: period ?? null,
        remainingTime,
        isCooldown,
        isConnected,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}