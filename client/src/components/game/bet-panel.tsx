import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useGame } from "@/hooks/use-game";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const COLORS = [
  { name: "red", class: "bg-red-500" },
  { name: "green", class: "bg-green-500" },
  { name: "violet", class: "bg-violet-500" }
] as const;

const NUMBERS = Array.from({ length: 10 }, (_, i) => i);

export default function BetPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isCooldown } = useGame();
  const [amount, setAmount] = useState("");
  const [betType, setBetType] = useState<"color" | "number">("color");

  const betMutation = useMutation({
    mutationFn: async (data: { type: "color" | "number"; value: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/bets", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bet placed successfully",
        description: `Placed ${amount} on ${betType}`,
      });
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBet = (value: string) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid betting amount",
        variant: "destructive",
      });
      return;
    }

    betMutation.mutate({
      type: betType,
      value,
      amount: Number(amount)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Your Bet</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={betType} onValueChange={(v) => setBetType(v as "color" | "number")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="color">Colors</TabsTrigger>
            <TabsTrigger value="number">Numbers</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isCooldown || betMutation.isPending}
              />
              <Button
                variant="outline"
                onClick={() => setAmount(user?.balance ?? "0")}
                disabled={isCooldown || betMutation.isPending}
              >
                Max
              </Button>
            </div>

            <TabsContent value="color" className="mt-0">
              <div className="grid grid-cols-3 gap-4">
                {COLORS.map((color) => (
                  <Button
                    key={color.name}
                    className={cn("h-16", color.class)}
                    onClick={() => handleBet(color.name)}
                    disabled={isCooldown || betMutation.isPending}
                  >
                    {color.name}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="number" className="mt-0">
              <div className="grid grid-cols-5 gap-4">
                {NUMBERS.map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    onClick={() => handleBet(num.toString())}
                    disabled={isCooldown || betMutation.isPending}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
