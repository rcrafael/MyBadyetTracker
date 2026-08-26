import { useState, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';

export default function InstallmentManagerModal({
  isOpen,
  onClose,
  plans = [],
  onPay,
  onPayInFull,
  onEdit,
  onDelete,
  onAddNewPlan,
  onViewPlan,
}) {
  const { formatCurrency } = useCurrency();
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [confirmPayInFullPlan, setConfirmPayInFullPlan] = useState(null);

  // Parse and calculate plan metrics
  const processedPlans = useMemo(() => {
    return plans.map((p) => {
      const totalMonths = parseInt(p.totalMonths, 10) || 1;
      const currentInstallment = parseInt(p.currentInstallment, 10) || 1;
      const paidInstallments =
        p.paidInstallments !== undefined
          ? parseInt(p.paidInstallments, 10)
          : p.status === 'paid'
          ? currentInstallment
          : currentInstallment - 1;

      const remainingMonths = Math.max(0, totalMonths - paidInstallments);
      const monthlyAmount = parseFloat(p.monthlyAmount || p.amount) || 0;
      const totalAmount = parseFloat(p.totalAmount) || monthlyAmount * totalMonths;
      const paidBalance = Math.min(totalAmount, paidInstallments * monthlyAmount);
      const remainingBalance = Math.max(0, totalAmount - paidBalance);
      const percentPaid = Math.min(100, Math.round((paidInstallments / totalMonths) * 100));
      const isCompleted = paidInstallments >= totalMonths || (p.status === 'paid' && currentInstallment >= totalMonths);

      return {
        ...p,
        totalMonths,
        currentInstallment,
        paidInstallments,
        remainingMonths,
        monthlyAmount,
        totalAmount,
        paidBalance,
        remainingBalance,
        percentPaid,
        isCompleted,
      };
    });
  }, [plans]);

  // Summary Metrics
  const activePlansList = processedPlans.filter((p) => !p.isCompleted);
  const completedPlansList = processedPlans.filter((p) => p.isCompleted);

  const totalMonthlyCommitment = activePlansList.reduce((sum, p) => sum + p.monthlyAmount, 0);
  const totalOutstandingBalance = activePlansList.reduce((sum, p) => sum + p.remainingBalance, 0);
  const totalPaidToDate = processedPlans.reduce((sum, p) => sum + p.paidBalance, 0);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (activeFilter === 'active') return activePlansList;
    if (activeFilter === 'completed') return completedPlansList;
    return processedPlans;
  }, [activeFilter, processedPlans, activePlansList, completedPlansList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="app-card max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-secondary/40 max-h-[92vh] flex flex-col relative space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="installment-manager-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-secondary text-2xl">
                account_balance
              </span>
            </div>
            <div>
              <h3 id="installment-manager-title" className="font-headline text-base sm:text-lg font-bold text-on-surface">
                Installment Plans Hub
              </h3>
              <p className="text-xs text-on-surface-variant">
                Manage, edit, delete, or settle your loans and installment purchases
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
              Active Plans
            </span>
            <p className="font-mono text-base sm:text-lg font-bold text-on-surface">
              {activePlansList.length}
            </p>
            <span className="text-[10px] text-on-surface-variant block truncate">
              {completedPlansList.length} completed
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
              Monthly Commitment
            </span>
            <p className="font-mono text-base sm:text-lg font-bold text-secondary truncate">
              {formatCurrency(totalMonthlyCommitment)}
            </p>
            <span className="text-[10px] text-outline block">Total / month</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
              Total Outstanding
            </span>
            <p className="font-mono text-base sm:text-lg font-bold text-error truncate">
              {formatCurrency(totalOutstandingBalance)}
            </p>
            <span className="text-[10px] text-outline block">Remaining balance</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
              Settled to Date
            </span>
            <p className="font-mono text-base sm:text-lg font-bold text-success truncate">
              {formatCurrency(totalPaidToDate)}
            </p>
            <span className="text-[10px] text-outline block">Total payments made</span>
          </div>
        </div>

        {/* Filter Tabs & Add Action */}
        <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex p-1 bg-surface-container rounded-xl gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Plans ({processedPlans.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'active'
                  ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Active ({activePlansList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeFilter === 'completed'
                  ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Completed ({completedPlansList.length})
            </button>
          </div>

          {onAddNewPlan && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewPlan();
              }}
              className="text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-base">add_card</span>
              <span>New Plan</span>
            </button>
          )}
        </div>

        {/* Pay In Full Confirmation Dialog */}
        {confirmPayInFullPlan && (
          <div className="p-4 bg-secondary/15 border border-secondary/40 rounded-2xl space-y-3 animate-fadeIn shrink-0">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-2xl shrink-0">
                savings
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-on-surface">
                  Settle "{confirmPayInFullPlan.name}" in Full Early?
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  This will settle all remaining {confirmPayInFullPlan.remainingMonths} months (total of{' '}
                  <strong className="text-on-surface font-mono">
                    {formatCurrency(confirmPayInFullPlan.remainingBalance)}
                  </strong>
                  ) and mark this plan as completed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmPayInFullPlan(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onPayInFull?.(confirmPayInFullPlan);
                  setConfirmPayInFullPlan(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Confirm Early Settlement</span>
              </button>
            </div>
          </div>
        )}

        {/* Plans List */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1 custom-scrollbar">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12 app-card space-y-2">
              <span className="material-symbols-outlined text-outline text-4xl block">
                credit_card_off
              </span>
              <p className="text-sm font-semibold text-on-surface">
                {activeFilter === 'active'
                  ? 'No active installment plans'
                  : activeFilter === 'completed'
                  ? 'No completed installment plans'
                  : 'No installment plans found'}
              </p>
              <p className="text-xs text-outline">
                Create installment plans to track loans, gadgets, and 0% card amortizations.
              </p>
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 rounded-2xl bg-surface-container/40 hover:bg-surface-container/70 border border-outline-variant/20 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-on-surface font-headline truncate">
                        {plan.name}
                      </h4>
                      {plan.bankOrMerchant && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary/15 text-secondary border border-secondary/20 shrink-0">
                          {plan.bankOrMerchant}
                        </span>
                      )}
                      {plan.isCompleted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-success/15 text-success flex items-center gap-0.5 shrink-0">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Completed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-warning/15 text-warning shrink-0">
                          Month {plan.currentInstallment}/{plan.totalMonths}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-on-surface-variant mt-1">
                      {plan.isCompleted ? (
                        <span>Fully settled ({plan.totalMonths} of {plan.totalMonths} months paid)</span>
                      ) : (
                        <span>
                          {plan.remainingMonths} months left • Ends:{' '}
                          {plan.endDate
                            ? new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'N/A'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-bold text-on-surface block">
                      {formatCurrency(plan.monthlyAmount)}
                      <span className="text-[11px] font-normal text-outline"> / mo</span>
                    </span>
                    <span className="text-[11px] text-on-surface-variant block">
                      Balance: <strong className={plan.isCompleted ? 'text-success' : 'text-error'}>{formatCurrency(plan.remainingBalance)}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-on-surface-variant">
                    <span>{plan.paidInstallments} of {plan.totalMonths} paid</span>
                    <span className="font-bold text-secondary">{plan.percentPaid}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${plan.isCompleted ? 'bg-success' : 'bg-secondary'}`}
                      style={{ width: `${plan.percentPaid}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onViewPlan?.(plan)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>Schedule</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit?.(plan)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-secondary/15 hover:text-secondary transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(plan.id, plan.name)}
                      className="p-1 text-outline hover:text-error rounded-md hover:bg-error-container/20 transition-colors"
                      title="Delete Plan"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>

                  {!plan.isCompleted && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmPayInFullPlan(plan)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-secondary hover:bg-secondary/15 border border-secondary/30 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">savings</span>
                        <span>Pay in Full</span>
                      </button>
                      {plan.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => onPay?.(plan)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">payments</span>
                          <span>Pay Month {plan.currentInstallment}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-outline-variant/20 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
