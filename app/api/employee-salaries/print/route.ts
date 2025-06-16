export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");

  if (!employeeId) {
    return new Response(JSON.stringify({ error: "employeeId is required" }), { status: 400 });
  }

  // داده تستی
  const data = {
    employeeId,
    employeeName: "کاربر تستی",
    position: "برنامه‌نویس",
    baseSalary: 10000000,
    additions: 2000000,
    deductions: 500000,
    totalCommission: 1500000,
    totalPayment: 11000000,
    date: "1404/03/24"
  };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
