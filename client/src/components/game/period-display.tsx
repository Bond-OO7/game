import { useGame } from "@/hooks/use-game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PeriodDisplay() {
  const { period, remainingTime, isCooldown, isConnected } = useGame();
  const queryClient = useQueryClient();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/periods/current"] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl">Current Period</CardTitle>
        <div className="flex items-center gap-4">
          {!isConnected && (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Period ID</p>
            <p className="text-2xl font-bold">{period?.id || "Loading..."}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Time Remaining</p>
            <p className={`text-2xl font-bold ${isCooldown ? "text-destructive" : ""}`}>
              {formatTime(remainingTime)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
