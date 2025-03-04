import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function WalletPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/history"],
  });

  const transactionMutation = useMutation({
    mutationFn: async (data: { type: "deposit" | "withdrawal"; amount: number }) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction successful",
      });
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTransaction = (type: "deposit" | "withdrawal") => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    transactionMutation.mutate({
      type,
      amount: Number(amount)
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${user?.balance}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={transactionMutation.isPending}
              />

              <TabsContent value="deposit" className="mt-0">
                <Button
                  className="w-full"
                  onClick={() => handleTransaction("deposit")}
                  disabled={transactionMutation.isPending}
                >
                  Deposit Funds
                </Button>
              </TabsContent>

              <TabsContent value="withdraw" className="mt-0">
                <Button
                  className="w-full"
                  onClick={() => handleTransaction("withdrawal")}
                  disabled={transactionMutation.isPending}
                >
                  Withdraw Funds
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="capitalize">{tx.type}</TableCell>
                  <TableCell>
                    <span
                      className={
                        tx.type === "deposit" || tx.type === "win"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {tx.type === "deposit" || tx.type === "win" ? "+" : "-"}
                      ${tx.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
