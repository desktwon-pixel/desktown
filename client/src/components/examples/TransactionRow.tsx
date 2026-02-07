import { TransactionRow } from "../TransactionRow";

export default function TransactionRowExample() {
  return (
    <div className="border rounded-md bg-card">
      <TransactionRow
        id="1"
        description="Software subscription"
        amount={-299.00}
        category="Software"
        date="Dec 1, 2024"
        status="approved"
      />
      <TransactionRow
        id="2"
        description="Team lunch expense"
        amount={-156.50}
        category="Meals"
        date="Nov 28, 2024"
        status="pending"
        showApprovalActions
        onApprove={(id) => console.log("Approved:", id)}
        onReject={(id) => console.log("Rejected:", id)}
      />
      <TransactionRow
        id="3"
        description="Client payment received"
        amount={5000.00}
        category="Revenue"
        date="Nov 25, 2024"
        status="approved"
      />
      <TransactionRow
        id="4"
        description="Office supplies"
        amount={-89.99}
        category="Supplies"
        date="Nov 20, 2024"
        status="pending"
        showApprovalActions
        onApprove={(id) => console.log("Approved:", id)}
        onReject={(id) => console.log("Rejected:", id)}
      />
    </div>
  );
}
