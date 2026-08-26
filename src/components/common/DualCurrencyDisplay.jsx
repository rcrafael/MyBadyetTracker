import { useCurrency } from '../../context/CurrencyContext';

/**
 * Dual Currency Display Component
 * Renders the primary/main currency prominently (bigger) and the secondary/converted currency below it (smaller)
 * when dual currency is enabled. When disabled, renders only the single currency.
 */
export default function DualCurrencyDisplay({
  amount = 0,
  fromCurrency = null,
  primaryMode = 'assigned', // 'main' | 'assigned'
  align = 'right', // 'left' | 'right' | 'center'
  mainClassName = '',
  secondaryClassName = '',
  suffix = '',
  prefix = '',
  showApprox = true,
}) {
  const { formatDualCurrency, isDualCurrencyEnabled } = useCurrency();

  const {
    primaryFormatted,
    secondaryFormatted,
    primaryCode,
    secondaryCode,
  } = formatDualCurrency({
    amount,
    fromCurrency,
    primaryMode,
  });

  const alignClasses = {
    left: 'items-start text-left',
    right: 'items-end text-right',
    center: 'items-center text-center',
  };

  const isSameCurrency = primaryCode === secondaryCode;
  const showSecondary = isDualCurrencyEnabled && !isSameCurrency;

  return (
    <div className={`flex flex-col ${alignClasses[align] || alignClasses.right} leading-tight`}>
      {/* Primary / Bigger Currency */}
      <span className={`font-mono font-bold text-on-surface ${mainClassName || 'text-sm sm:text-base'}`}>
        {prefix}{primaryFormatted}{suffix ? ` ${suffix}` : ''}
      </span>

      {/* Secondary / Smaller Converted Currency (Only when Dual Currency is Enabled) */}
      {showSecondary && (
        <span className={`font-mono font-medium text-[11px] text-on-surface-variant/80 ${secondaryClassName || ''}`}>
          {showApprox ? '≈ ' : ''}{prefix}{secondaryFormatted}{suffix ? ` ${suffix}` : ''}
        </span>
      )}
    </div>
  );
}
