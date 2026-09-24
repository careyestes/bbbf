import type { PublicStock } from "./inventory";
import { getProduct, type ProductId } from "./products";
import type { CartLine } from "./shipping";

export type CartStockIssue = {
  productId: ProductId;
  productName: string;
  requested: number;
  available: number;
  kind: "sold_out" | "insufficient";
};

export function getCartStockIssues(
  lines: CartLine[],
  stock: Record<ProductId, PublicStock> | null | undefined,
): CartStockIssue[] {
  if (!stock) return [];

  const issues: CartStockIssue[] = [];

  for (const line of lines) {
    const available = stock[line.productId]?.quantity ?? 0;
    const productName = getProduct(line.productId)?.name ?? line.productId;

    if (available <= 0) {
      issues.push({
        productId: line.productId,
        productName,
        requested: line.quantity,
        available: 0,
        kind: "sold_out",
      });
      continue;
    }

    if (line.quantity > available) {
      issues.push({
        productId: line.productId,
        productName,
        requested: line.quantity,
        available,
        kind: "insufficient",
      });
    }
  }

  return issues;
}

export function cartStockIssueMessage(issue: CartStockIssue): string {
  if (issue.kind === "sold_out") {
    return `${issue.productName} is sold out`;
  }
  return `Only ${issue.available} ${issue.productName} jar${issue.available === 1 ? "" : "s"} left`;
}

export function cartStockSummary(issues: CartStockIssue[]): string {
  if (issues.length === 0) return "";
  if (issues.length === 1) return cartStockIssueMessage(issues[0]);
  return issues.map(cartStockIssueMessage).join(". ");
}
