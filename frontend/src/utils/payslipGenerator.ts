import type { PayrollRecord } from '../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function downloadPayslip(record: PayrollRecord, companyName = 'WorkNest'): void {
  const [monthLabel, yearLabel] = record.monthYear.split(' ');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslip — ${record.employeeName} — ${record.monthYear}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #1e1b4b; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #7e22ce; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 800; color: #7e22ce; }
    .meta { text-align: right; font-size: 12px; color: #475569; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #ddd6fe; padding: 10px 12px; text-align: left; }
    th { background: #f5f0ff; }
    .total { font-size: 18px; font-weight: 800; color: #7e22ce; margin-top: 24px; }
    .footer { margin-top: 40px; font-size: 11px; color: #64748b; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${companyName}</div>
      <div style="font-size:12px;color:#64748b;">Salary Payslip</div>
    </div>
    <div class="meta">
      <div><strong>Period:</strong> ${monthLabel ?? record.monthYear} ${yearLabel ?? ''}</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>

  <h1>${record.employeeName}</h1>
  <div style="font-size:13px;color:#475569;">
    Employee ID: ${record.employeeId} · Department: ${record.department}
  </div>

  <table>
    <thead><tr><th>Component</th><th>Amount (INR)</th></tr></thead>
    <tbody>
      <tr><td>Base Salary</td><td>${formatCurrency(record.baseSalary)}</td></tr>
      <tr><td>Overtime Pay (${record.overtimeHours} hrs)</td><td>${formatCurrency(record.overtimePay)}</td></tr>
      <tr><td>Unpaid Leave Deduction (${record.unpaidLeaveDays} days)</td><td>-${formatCurrency(record.unpaidLeaveDeduction)}</td></tr>
      <tr><td><strong>Net Payable</strong></td><td><strong>${formatCurrency(record.netPayable)}</strong></td></tr>
    </tbody>
  </table>

  <div class="total">Net Payable: ${formatCurrency(record.netPayable)}</div>
  <div class="footer">This is a system-generated payslip from WorkNest HRMS. For queries contact your HR department.</div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Allow pop-ups to download payslip.');
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

export function getCurrentPayrollPeriod(): { year: number; month: number; label: string } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    label: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
  };
}
