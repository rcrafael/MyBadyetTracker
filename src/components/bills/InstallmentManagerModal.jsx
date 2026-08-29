import { useState, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import DualCurrencyDisplay from '../common/DualCurrencyDisplay';

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
  const {
    mainCurrency,
    secondaryCurrency,
    convertToMain,
    formatCurrency,
  } = useCurrency();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [confirmPayInFullPlan, setConfirmPayInFullPlan] = useState(null);

  // Parse and calculate plan metrics
  const processedPlans = useMemo(() => {
    return plans.map((p) => {
      const planCurrency = p.currency || mainCurrency;
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

      // Converted metrics to Main Currency for accurate global aggregation
      const monthlyAmountInMain = convertToMain(monthlyAmount, planCurrency);
      const totalAmountInMain = convertToMain(totalAmount, planCurrency);
      const paidBalanceInMain = convertToMain(paidBalance, planCurrency);
      const remainingBalanceInMain = convertToMain(remainingBalance, planCurrency);

      return {
        ...p,
        currency: planCurrency,
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
        monthlyAmountInMain,
        totalAmountInMain,
        paidBalanceInMain,
        remainingBalanceInMain,
      };
    }).sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (a.remainingMonths !== b.remainingMonths) return a.remainingMonths - b.remainingMonths;
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    });
  }, [plans, mainCurrency, convertToMain]);

  // Summary Metrics aggregated in Main Currency
  const activePlansList = processedPlans.filter((p) => !p.isCompleted);
  const completedPlansList = processedPlans.filter((p) => p.isCompleted);

  const totalMonthlyCommitmentInMain = activePlansList.reduce(
    (sum, p) => sum + p.monthlyAmountInMain,
    0
  );
  const totalOutstandingBalanceInMain = activePlansList.reduce(
    (sum, p) => sum + p.remainingBalanceInMain,
    0
  );
  const totalPaidToDateInMain = processedPlans.reduce(
    (sum, p) => sum + p.paidBalanceInMain,
    0
  );

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (activeFilter === 'active') return activePlansList;
    if (activeFilter === 'completed') return completedPlansList;
    return processedPlans;
  }, [activeFilter, processedPlans, activePlansList, completedPlansList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="app-card max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-secondary/40 max-h-[85vh] sm:max-h-[88vh] flex flex-col relative space-y-3.5 my-auto"
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

        {/* Filter Tabs & Add Action — sticky below header */}
        <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap pb-3 border-b border-outline-variant/20">
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

        {/* Unified Scrollable Body: summary + confirm + plans */}
        <div className="overflow-y-auto flex-1 custom-scrollbar space-y-3.5 pr-1 pt-1">
          {/* Global Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              <DualCurrencyDisplay
                amount={totalMonthlyCommitmentInMain}
                fromCurrency={mainCurrency}
                primaryMode="main"
                align="left"
                mainClassName="text-sm sm:text-base font-mono font-bold text-secondary truncate"
                secondaryClassName="text-[10px] font-mono text-outline truncate"
              />
              <span className="text-[10px] text-outline block">Total / month</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
                Total Outstanding
              </span>
              <DualCurrencyDisplay
                amount={totalOutstandingBalanceInMain}
                fromCurrency={mainCurrency}
                primaryMode="main"
                align="left"
                mainClassName="text-sm sm:text-base font-mono font-bold text-error truncate"
                secondaryClassName="text-[10px] font-mono text-outline truncate"
              />
              <span className="text-[10px] text-outline block">Remaining balance</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
                Settled to Date
              </span>
              <DualCurrencyDisplay
                amount={totalPaidToDateInMain}
                fromCurrency={mainCurrency}
                primaryMode="main"
                align="left"
                mainClassName="text-sm sm:text-base font-mono font-bold text-success truncate"
                secondaryClassName="text-[10px] font-mono text-outline truncate"
              />
              <span className="text-[10px] text-outline block">Total payments made</span>
            </div>
          </div>

          {/* Pay In Full Confirmation Dialog */}
          {confirmPayInFullPlan && (
            <div className="p-4 bg-secondary/15 border border-secondary/40 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-2xl shrink-0">
                  savings
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-on-surface">
                    Settle "{confirmPayInFullPlan.name}" in Full Early?
                  </h4>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    This will settle all remaining {confirmPayInFullPlan.remainingMonths} months (total of{' '}
                    <DualCurrencyDisplay
                      amount={confirmPayInFullPlan.remainingBalance}
                      fromCurrency={confirmPayInFullPlan.currency}
                      primaryMode="assigned"
                      align="left"
                      mainClassName="font-mono font-bold text-on-surface inline"
                      secondaryClassName="text-[10px] font-mono text-outline inline ml-1"
                    />
                    ) and mark this plan as completed.
                  </div>
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
          <div className="space-y-3">
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
                        <h4 className="text-sm font-bold text-on-surface font-headline break-words leading-tight">
                          {plan.name}
                        </h4>
                        {plan.bankOrMerchant && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary/15 text-secondary border border-secondary/20 shrink-0">
                            {plan.bankOrMerchant}
                          </span>
                        )}
                        {plan.currency && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant shrink-0">
                            {plan.currency}
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

                    {/* Monthly amount and Balance */}
                    <div className="text-right shrink-0 space-y-1">
                      <DualCurrencyDisplay
                        amount={plan.monthlyAmount}
                        fromCurrency={plan.currency}
                        primaryMode="assigned"
                        align="right"
                        mainClassName="font-mono text-sm sm:text-base font-bold text-on-surface"
                        secondaryClassName="text-[10px] font-mono text-outline"
                        suffix="/ mo"
                      />

                      <div className="flex flex-col items-end text-[11px] text-on-surface-variant leading-tight">
                        <span className="text-[10px] text-outline">Balance:</span>
                        <DualCurrencyDisplay
                          amount={plan.remainingBalance}
                          fromCurrency={plan.currency}
                          primaryMode="assigned"
                          align="right"
                          mainClassName={`font-mono font-bold text-xs ${
                            plan.isCompleted ? 'text-success' : 'text-error'
                          }`}
                          secondaryClassName="text-[10px] font-mono text-outline"
                        />
                      </div>
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
        </div>

        {/* Footer — sticky */}
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
