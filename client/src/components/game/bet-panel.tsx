import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useGame } from "@/hooks/use-game";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const COLORS = [
  { name: "red", class: "bg-red-500" },
  { name: "green", class: "bg-green-500" },
  { name: "violet", class: "bg-violet-500" }
] as const;

const NUMBERS = Array.from({ length: 10 }, (_, i) => ({
  value: i,
  colors: i === 0
    ? ["violet", "red"]
    : i === 5
    ? ["violet", "green"]
    : [i % 2 === 0 ? "green" : "red"]
}));

export default function BetPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isCooldown } = useGame();
  const [amount, setAmount] = useState("");
  const [confirmBet, setConfirmBet] = useState<{
    type: "color" | "number";
    value: string;
  } | null>(null);

  const betMutation = useMutation({
    mutationFn: async (data: { type: "color" | "number"; value: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/bets", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bet placed successfully",
      });
      setAmount("");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBetConfirm = (type: "color" | "number", value: string) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid betting amount",
        variant: "destructive",
      });
      return;
    }

    setConfirmBet({ type, value });
  };

  const handleBetConfirmed = () => {
    if (!confirmBet) return;

    betMutation.mutate({
      type: confirmBet.type,
      value: confirmBet.value,
      amount: Number(amount)
    });
    setConfirmBet(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Place Your Bet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
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

          {/* Colors */}
          <div>
            <h3 className="font-medium mb-3">Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {COLORS.map((color) => (
                <Button
                  key={color.name}
                  className={cn("h-16", color.class)}
                  onClick={() => handleBetConfirm("color", color.name)}
                  disabled={isCooldown || betMutation.isPending}
                >
                  {color.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Numbers */}
          <div>
            <h3 className="font-medium mb-3">Numbers</h3>
            <div className="grid grid-cols-5 gap-4">
              {NUMBERS.map(({ value, colors }) => (
                <Button
                  key={value}
                  className={cn(
                    "h-16 relative overflow-hidden",
                    colors.length > 1 && "border-4 border-violet-500"
                  )}
                  onClick={() => handleBetConfirm("number", value.toString())}
                  disabled={isCooldown || betMutation.isPending}
                >
                  <div className={cn(
                    "absolute inset-0",
                    colors[0] === "red" ? "bg-red-500" : "bg-green-500"
                  )} />
                  <span className="relative z-10 text-white text-xl font-bold">
                    {value}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmBet} onOpenChange={() => setConfirmBet(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to place a bet of ${amount} on{" "}
              {confirmBet?.type === "color" ? (
                <span className={`font-bold text-${confirmBet.value}-500`}>
                  {confirmBet.value}
                </span>
              ) : (
                <span className="font-bold">number {confirmBet?.value}</span>
              )}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBetConfirmed}>
              Place Bet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}