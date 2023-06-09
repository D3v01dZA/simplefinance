package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.db.model.DAccountConfig;
import net.caltona.simplefinance.service.calculator.AccountCalculator;
import net.caltona.simplefinance.service.calculator.TotalType;
import net.caltona.simplefinance.service.transaction.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class LoanAccount implements Account {

    @NonNull
    private final String id;

    @NonNull
    private final String name;

    @NonNull
    private final Supplier<Map<String, Object>> configByNameSupplier;

    @NonNull
    private final Supplier<List<Transaction>> transactionsSupplier;

    private final static String RATE = "rate";

    @Override
    public TotalType totalType() {
        return TotalType.LONG_TERM_LIABILITY;
    }

    @Override
    public BigDecimal calculateBalance(LocalDate date) {
        return new AccountCalculator(transactionsSupplier.get(), true).balance(date);
    }

    @Override
    public BigDecimal calculateTransfer(LocalDate date) {
        return new AccountCalculator(transactionsSupplier.get(), false).transfer(date);
    }

    @Override
    public boolean canUpdateConfig(DAccountConfig updateAccountConfig) {
        if (!updateAccountConfig.valid()) {
            return false;
        }
        if (rate().isPresent() && updateAccountConfig.getType().equals(DAccountConfig.Type.BIG_DECIMAL) && updateAccountConfig.getName().equals(RATE)) {
            return true;
        }
        return false;
    }

    @Override
    public boolean canAddConfig(DAccountConfig newAccountConfig) {
        if (!newAccountConfig.valid()) {
            return false;
        }
        if (rate().isEmpty() && newAccountConfig.getType().equals(DAccountConfig.Type.BIG_DECIMAL) && newAccountConfig.getName().equals(RATE)) {
            return true;
        }
        return false;
    }

    private Optional<BigDecimal> rate() {
        return Optional.ofNullable((BigDecimal) configByNameSupplier.get().get(RATE));
    }

    @Override
    public Validation canAddTransaction(Transaction transaction) {
        return transaction.canAddTo(getTransactionsSupplier().get());
    }
}
