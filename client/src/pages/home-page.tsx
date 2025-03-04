import { useAuth } from "@/hooks/use-auth";
import { GameProvider } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import BetPanel from "@/components/game/bet-panel";
import PeriodDisplay from "@/components/game/period-display";
import ResultsTable from "@/components/game/results-table";
import WalletPanel from "@/components/game/wallet-panel";
import { LogOut } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <GameProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold">BetGame</h1>
            <div className="flex items-center gap-4">
              <span>{user?.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-8">
              <PeriodDisplay />
              <BetPanel />
              <ResultsTable />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4">
              <WalletPanel />
            </div>
          </div>
        </main>
      </div>
    </GameProvider>
  );
}
