import { db } from "./db";
import { eq, and, between, sql, desc, asc } from "drizzle-orm";
import type { Request, Response } from "express";

// Types for reports
export interface GeneralLedgerParams {
  accountId: number;
  dateFrom: string;
  dateTo: string;
  branchId?: number;
}

export interface GeneralLedgerLine {
  entryDate: Date;
  transactionType: string;
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerReport {
  account: {
    code: string;
    name: string;
  };
  dateFrom: string;
  dateTo: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  mutation: number;
  lines: GeneralLedgerLine[];
}

/**
 * Generate General Ledger Report (Buku Besar - Mutasi)
 * This is the most important accounting report
 */
export async function generateGeneralLedger(
  params: GeneralLedgerParams
): Promise<GeneralLedgerReport> {
  const { accountId, dateFrom, dateTo, branchId } = params;

  // Get account info
  const account = await db.query.accounts.findFirst({
    where: (accounts, { eq }) => eq(accounts.id, accountId),
  });

  if (!account) {
    throw new Error("Account not found");
  }

  // Calculate opening balance (all transactions before dateFrom)
  const openingBalanceResult = await db.execute(sql`
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as balance
    FROM journal_entries je
    JOIN journal_lines jl ON je.id = jl.journal_entry_id
    WHERE jl.account_id = ${accountId}
      AND je.entry_date < ${dateFrom}
      AND je.posted = TRUE
      ${branchId ? sql`AND je.branch_id = ${branchId}` : sql``}
  `);

  const openingBalance = Number(openingBalanceResult.rows[0]?.balance || 0);

  // Get all transactions in the period
  const transactions = await db.execute(sql`
    SELECT 
      je.entry_date,
      je.transaction_type,
      je.reference_no,
      je.description,
      jl.debit,
      jl.credit
    FROM journal_entries je
    JOIN journal_lines jl ON je.id = jl.journal_entry_id
    WHERE jl.account_id = ${accountId}
      AND je.entry_date BETWEEN ${dateFrom} AND ${dateTo}
      AND je.posted = TRUE
      ${branchId ? sql`AND je.branch_id = ${branchId}` : sql``}
    ORDER BY je.entry_date, je.id
  `);

  // Calculate running balance
  let runningBalance = openingBalance;
  const lines: GeneralLedgerLine[] = transactions.rows.map((row: any) => {
    const debit = Number(row.debit || 0);
    const credit = Number(row.credit || 0);
    runningBalance += debit - credit;

    return {
      entryDate: new Date(row.entry_date),
      transactionType: row.transaction_type,
      referenceNo: row.reference_no,
      description: row.description,
      debit,
      credit,
      balance: runningBalance,
    };
  });

  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const mutation = totalDebit - totalCredit;
  const closingBalance = openingBalance + mutation;

  return {
    account: {
      code: account.code,
      name: account.name,
    },
    dateFrom,
    dateTo,
    openingBalance,
    closingBalance,
    totalDebit,
    totalCredit,
    mutation,
    lines,
  };
}

/**
 * Generate Balance Sheet Report
 */
export async function generateBalanceSheet(
  dateAsOf: string,
  branchId?: number
): Promise<any> {
  // Get all accounts with their balances
  const accountBalances = await db.execute(sql`
    WITH account_balances AS (
      SELECT 
        a.id,
        a.code,
        a.name,
        a.account_type,
        a.parent_id,
        a.is_header,
        COALESCE(SUM(jl.debit - jl.credit), 0) as balance
      FROM accounts a
      LEFT JOIN journal_lines jl ON a.id = jl.account_id
      LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
      WHERE je.entry_date <= ${dateAsOf}
        AND je.posted = TRUE
        ${branchId ? sql`AND je.branch_id = ${branchId}` : sql``}
      GROUP BY a.id, a.code, a.name, a.account_type, a.parent_id, a.is_header
    )
    SELECT * FROM account_balances
    WHERE balance != 0 OR is_header = TRUE
    ORDER BY code
  `);

  // Organize into Assets, Liabilities, Equity
  const assets = accountBalances.rows.filter(
    (row: any) => row.account_type === "Asset"
  );
  const liabilities = accountBalances.rows.filter(
    (row: any) => row.account_type === "Liability"
  );
  const equity = accountBalances.rows.filter(
    (row: any) => row.account_type === "Equity"
  );

  const totalAssets = assets.reduce(
    (sum: number, row: any) => sum + Number(row.balance),
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum: number, row: any) => sum + Number(row.balance),
    0
  );
  const totalEquity = equity.reduce(
    (sum: number, row: any) => sum + Number(row.balance),
    0
  );

  return {
    dateAsOf,
    assets: {
      accounts: assets,
      total: totalAssets,
    },
    liabilities: {
      accounts: liabilities,
      total: totalLiabilities,
    },
    equity: {
      accounts: equity,
      total: totalEquity,
    },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
}

/**
 * Generate Profit & Loss Report
 */
export async function generateProfitLoss(
  dateFrom: string,
  dateTo: string,
  branchId?: number
): Promise<any> {
  // Get revenue and expense accounts
  const accountBalances = await db.execute(sql`
    SELECT 
      a.id,
      a.code,
      a.name,
      a.account_type,
      a.parent_id,
      a.is_header,
      COALESCE(SUM(jl.credit - jl.debit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE je.entry_date BETWEEN ${dateFrom} AND ${dateTo}
      AND je.posted = TRUE
      AND a.account_type IN ('Revenue', 'Expense', 'COGS')
      ${branchId ? sql`AND je.branch_id = ${branchId}` : sql``}
    GROUP BY a.id, a.code, a.name, a.account_type, a.parent_id, a.is_header
    ORDER BY a.code
  `);

  const revenue = accountBalances.rows.filter(
    (row: any) => row.account_type === "Revenue"
  );
  const cogs = accountBalances.rows.filter(
    (row: any) => row.account_type === "COGS"
  );
  const expenses = accountBalances.rows.filter(
    (row: any) => row.account_type === "Expense"
  );

  const totalRevenue = revenue.reduce(
    (sum: number, row: any) => sum + Number(row.balance),
    0
  );
  const totalCOGS = cogs.reduce(
    (sum: number, row: any) => sum + Number(row.balance),
    0
  );
  const totalExpenses = expenses.reduce(
    (sum: number, row: any) => sum + Number(row.balance),
    0
  );

  const grossProfit = totalRevenue - totalCOGS;
  const operatingProfit = grossProfit - totalExpenses;
  const netProfit = operatingProfit; // Simplified, can add other income/expenses

  return {
    dateFrom,
    dateTo,
    revenue: {
      accounts: revenue,
      total: totalRevenue,
    },
    cogs: {
      accounts: cogs,
      total: totalCOGS,
    },
    grossProfit,
    expenses: {
      accounts: expenses,
      total: totalExpenses,
    },
    operatingProfit,
    netProfit,
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
  };
}

/**
 * Generate Trial Balance Report
 */
export async function generateTrialBalance(
  dateAsOf: string,
  branchId?: number
): Promise<any> {
  const accountBalances = await db.execute(sql`
    SELECT 
      a.id,
      a.code,
      a.name,
      a.account_type,
      a.normal_balance,
      COALESCE(SUM(jl.debit), 0) as total_debit,
      COALESCE(SUM(jl.credit), 0) as total_credit,
      COALESCE(SUM(jl.debit - jl.credit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE je.entry_date <= ${dateAsOf}
      AND je.posted = TRUE
      AND a.is_header = FALSE
      ${branchId ? sql`AND je.branch_id = ${branchId}` : sql``}
    GROUP BY a.id, a.code, a.name, a.account_type, a.normal_balance
    HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
    ORDER BY a.code
  `);

  const accounts = accountBalances.rows.map((row: any) => {
    const balance = Number(row.balance);
    return {
      code: row.code,
      name: row.name,
      accountType: row.account_type,
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? Math.abs(balance) : 0,
    };
  });

  const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

  return {
    dateAsOf,
    accounts,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    difference: totalDebit - totalCredit,
  };
}

/**
 * Generate Stock Movement Report (Kartu Stok)
 */
export async function generateStockMovement(
  productId: number,
  dateFrom: string,
  dateTo: string,
  branchId?: number
): Promise<any> {
  // Get product info
  const product = await db.query.products.findFirst({
    where: (products, { eq }) => eq(products.id, productId),
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Calculate opening stock
  const openingStockResult = await db.execute(sql`
    SELECT COALESCE(SUM(quantity_change), 0) as stock
    FROM stock_movements
    WHERE product_id = ${productId}
      AND movement_date < ${dateFrom}
      ${branchId ? sql`AND branch_id = ${branchId}` : sql``}
  `);

  const openingStock = Number(openingStockResult.rows[0]?.stock || 0);

  // Get all movements in the period
  const movements = await db.execute(sql`
    SELECT 
      movement_date,
      movement_type,
      reference_no,
      description,
      quantity_change,
      unit_cost,
      total_cost
    FROM stock_movements
    WHERE product_id = ${productId}
      AND movement_date BETWEEN ${dateFrom} AND ${dateTo}
      ${branchId ? sql`AND branch_id = ${branchId}` : sql``}
    ORDER BY movement_date, id
  `);

  // Calculate running stock
  let runningStock = openingStock;
  const lines = movements.rows.map((row: any) => {
    const quantityChange = Number(row.quantity_change);
    runningStock += quantityChange;

    return {
      movementDate: new Date(row.movement_date),
      movementType: row.movement_type,
      referenceNo: row.reference_no,
      description: row.description,
      quantityIn: quantityChange > 0 ? quantityChange : 0,
      quantityOut: quantityChange < 0 ? Math.abs(quantityChange) : 0,
      balance: runningStock,
      unitCost: Number(row.unit_cost || 0),
      totalCost: Number(row.total_cost || 0),
    };
  });

  const totalIn = lines.reduce((sum, line) => sum + line.quantityIn, 0);
  const totalOut = lines.reduce((sum, line) => sum + line.quantityOut, 0);

  return {
    product: {
      sku: product.sku,
      name: product.name,
    },
    dateFrom,
    dateTo,
    openingStock,
    closingStock: runningStock,
    totalIn,
    totalOut,
    lines,
  };
}

// Export all report functions
export const reportFunctions = {
  generalLedger: generateGeneralLedger,
  balanceSheet: generateBalanceSheet,
  profitLoss: generateProfitLoss,
  trialBalance: generateTrialBalance,
  stockMovement: generateStockMovement,
};

// Made with Bob
