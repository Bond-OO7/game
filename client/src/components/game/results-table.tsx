import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Period, Bet } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

export default function ResultsTable() {
  const [parityPage, setParityPage] = useState(1);
  const [resultsPage, setResultsPage] = useState(1);

  const { data: periods } = useQuery<Period[]>({
    queryKey: ["/api/periods/history", parityPage],
    queryFn: async () => {
      const res = await fetch(`/api/periods/history?page=${parityPage}&limit=${PAGE_SIZE}`);
      return res.json();
    },
  });

  const { data: bets } = useQuery<Bet[]>({
    queryKey: ["/api/bets/history", resultsPage],
    queryFn: async () => {
      const res = await fetch(`/api/bets/history?page=${resultsPage}&limit=${PAGE_SIZE}`);
      return res.json();
    },
  });

  const renderColorIndicator = (color: string) => {
    const colors = color.split("+");
    return (
      <div className="flex gap-1">
        {colors.map((c, i) => (
          <span
            key={i}
            className={`inline-block w-4 h-4 rounded-full bg-${c}-500`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Parity Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Color</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods?.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>{period.id}</TableCell>
                  <TableCell>{period.price?.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">{period.number}</TableCell>
                  <TableCell>
                    {period.color && renderColorIndicator(period.color)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setParityPage(p => Math.max(1, p - 1))}
                    disabled={parityPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setParityPage(p => p + 1)}
                    disabled={!periods || periods.length < PAGE_SIZE}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bets?.map((bet) => (
                <TableRow key={bet.id}>
                  <TableCell>{bet.periodId}</TableCell>
                  <TableCell>
                    {bet.type === "color" ? (
                      renderColorIndicator(bet.value)
                    ) : (
                      bet.value
                    )}
                  </TableCell>
                  <TableCell>{bet.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        bet.result === "win"
                          ? "text-green-500"
                          : bet.result === "loss"
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      {bet.result
                        ? `${bet.result === "win" ? "+" : "-"}${bet.payout?.toFixed(
                            2,
                          )}`
                        : "Pending"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setResultsPage(p => Math.max(1, p - 1))}
                    disabled={resultsPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setResultsPage(p => p + 1)}
                    disabled={!bets || bets.length < PAGE_SIZE}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}