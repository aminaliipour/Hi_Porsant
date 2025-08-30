import React from "react";

interface ReportSummaryProps {
  totalCommission: number;
  totalRawIncome: number;
  totalSystemShare: number;
  totalOfficeShare: number;
  netSystemShare: number;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({
  totalCommission,
  totalRawIncome,
  totalSystemShare,
  totalOfficeShare,
  netSystemShare,
}) => {
  return (
    <div className="mt-8 p-4 rounded-lg border bg-muted text-muted-foreground space-y-2">
      <div className="flex flex-wrap gap-4 justify-between">
        <div>مجموع کل پورسانت‌ها: <b>{totalCommission.toLocaleString()} ریال</b></div>
        <div>کل درآمد شرکت: <b>{totalRawIncome.toLocaleString()} ریال</b></div>
        <div>سهم سیستم: <b>{totalSystemShare.toLocaleString()} ریال</b></div>
        <div>سهم دفتر: <b>{totalOfficeShare.toLocaleString()} ریال</b></div>
        <div>سهم خالص سیستم (بعد از کسر حقوق پایه و بیمه): <b>{netSystemShare.toLocaleString()} ریال</b></div>
      </div>
    </div>
  );
};

export default ReportSummary;
