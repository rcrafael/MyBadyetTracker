import { useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { generateInstallmentSchedule } from '../../services/firestoreService';

export default function InstallmentDetailModal({ bill, isOpen, onClose, onPay }) {
  const { formatCurrency } = useCurrency();

  const details = useMemo(() => {
    if (!bill) return null;

    const totalMonths = parseInt(bill.totalMonths, 10) || 1;
    const currentInstallment = parseInt(bill.currentInstallment, 10) || 1;
    const paidInstallments =
      bill.paidInstallments !== undefined
        ? parseInt(bill.paidInstallments, 10)
        : bill.status === 'paid'
        ? currentInstallment
        : currentInstallment - 1;

    const remainingMonths = Math.max(0, totalMonths - paidInstallments);
    const monthlyAmount = parseFloat(bill.monthlyAmount || bill.amount) || 0;
    const totalAmount = parseFloat(bill.totalAmount) || monthlyAmount * totalMonths;
    const paidBalance = Math.min(totalAmount, paidInstallments * monthlyAmount);
    const remainingBalance = Math.max(0, totalAmount - paidBalance);
    const percentPaid = Math.min(100, Math.round((paidInstallments / totalMonths) * 100));

    const startDate = bill.startDate || bill.dueDate || new Date().toISOString().split('T')[0];
    const schedule = generateInstallmentSchedule(startDate, totalMonths, monthlyAmount, paidInstallments);

    const isFullyPaid = paidInstallments >= totalMonths || bill.status === 'paid' && currentInstallment >= totalMonths;

    return {
      totalMonths,
      currentInstallment,
      paidInstallments,
      remainingMonths,
      monthlyAmount,
      totalAmount,
      paidBalance,
      remainingBalance,
      percentPaid,
      startDate,
      endDate: bill.endDate || (schedule[schedule.length - 1]?.dueDate ?? ''),
      schedule,
      isFullyPaid,
    };
  }, [bill]);

  if (!isOpen || !bill || !details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="app-card max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-secondary/40 max-h-[90vh] flex flex-col relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="installment-details-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-secondary text-2xl">
                credit_card
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="installment-details-title" className="font-headline text-base sm:text-lg font-bold text-on-surface truncate">
                  {bill.name}
                </h3>
                {bill.bankOrMerchant && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-container text-secondary border border-secondary/20 shrink-0">
                    {bill.bankOrMerchant}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {details.isFullyPaid ? (
                  <span className="text-success font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Installment plan completed
                  </span>
                ) : (
                  <span>
                    Month {details.currentInstallment} of {details.totalMonths} ({details.remainingMonths} months remaining)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 py-3 flex-1 pr-1 custom-scrollbar">
          {/* Progress Card */}
          <div className="p-3.5 bg-surface-container/60 rounded-2xl border border-outline-variant/20 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-on-surface">Payment Progress</span>
              <span className="font-mono font-bold text-secondary">{details.percentPaid}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill bg-secondary"
                style={{ width: `${details.percentPaid}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-on-surface-variant pt-1">
              <span>{details.paidInstallments} of {details.totalMonths} months paid</span>
              <span>{formatCurrency(details.paidBalance)} / {formatCurrency(details.totalAmount)}</span>
            </div>
          </div>

          {/* 4 Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/15 space-y-1">
              <p className="text-[11px] text-on-surface-variant font-medium">Monthly Payment</p>
              <p className="text-sm sm:text-base font-mono font-bold text-on-surface">
                {formatCurrency(details.monthlyAmount)}
              </p>
              <span className="text-[10px] text-outline block">Per month</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/15 space-y-1">
              <p className="text-[11px] text-on-surface-variant font-medium">Remaining Balance</p>
              <p className="text-sm sm:text-base font-mono font-bold text-error">
                {formatCurrency(details.remainingBalance)}
              </p>
              <span className="text-[10px] text-outline block">
                {details.remainingMonths} months left
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/15 space-y-1">
              <p className="text-[11px] text-on-surface-variant font-medium">Total Contract Value</p>
              <p className="text-sm sm:text-base font-mono font-bold text-on-surface">
                {formatCurrency(details.totalAmount)}
              </p>
              <span className="text-[10px] text-outline block">{details.totalMonths} installments</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/15 space-y-1">
              <p className="text-[11px] text-on-surface-variant font-medium">Schedule Period</p>
              <p className="text-xs font-semibold text-on-surface">
                {new Date(details.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                {new Date(details.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              <span className="text-[10px] text-secondary font-medium block">
                Ends: {new Date(details.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Schedule Breakdown */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Payment Schedule Breakdown ({details.totalMonths} Months)
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {details.schedule.map((item) => (
                <div
                  key={item.installmentNumber}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs border transition-colors ${
                    item.isPaid
                      ? 'bg-secondary/5 border-secondary/20 text-on-surface'
                      : item.isCurrent
                      ? 'bg-warning/10 border-warning/30 text-on-surface font-semibold'
                      : 'bg-surface-container/30 border-outline-variant/15 text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        item.isPaid
                          ? 'bg-secondary text-white'
                          : item.isCurrent
                          ? 'bg-warning text-white'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      {item.installmentNumber}
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface">
                        Month {item.installmentNumber} of {details.totalMonths}
                      </p>
                      <p className="text-[11px] text-outline">
                        Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-on-surface">
                      {formatCurrency(item.amount)}
                    </span>
                    {item.isPaid ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-secondary bg-secondary/15 px-2 py-0.5 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-xs">check</span>
                        Paid
                      </span>
                    ) : item.isCurrent ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-warning bg-warning/15 px-2 py-0.5 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-xs">pending</span>
                        Current Due
                      </span>
                    ) : (
                      <span className="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full shrink-0">
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-outline-variant/20 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Close
          </button>
          {!details.isFullyPaid && bill.status !== 'paid' && onPay && (
            <button
              type="button"
              onClick={() => {
                onPay(bill);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">payments</span>
              <span>Pay Month {details.currentInstallment} ({formatCurrency(details.monthlyAmount)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
