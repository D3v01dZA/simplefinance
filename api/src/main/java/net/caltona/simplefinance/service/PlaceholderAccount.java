package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.db.model.DAccountConfig;
import net.caltona.simplefinance.service.calculator.BalanceCalculator;
import net.caltona.simplefinance.service.calculator.PlaceholderBalanceCalculator;
import net.caltona.simplefinance.service.transaction.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class PlaceholderAccount implements Account {

    @NonNull
    private final String id;

    @NonNull
    private final String name;

    @NonNull
    private final Supplier<List<Transaction>> transactionsSupplier;

    public PlaceholderAccount(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
        this(id, name, transactionsSupplier);
    }

    @Override
    public BalanceCalculator.TotalType totalType() {
        return BalanceCalculator.TotalType.IGNORED;
    }

    @Override
    public BigDecimal calculateBalance(LocalDate date) {
        return new PlaceholderBalanceCalculator(transactionsSupplier.get()).balance();
    }

    @Override
    public boolean canUpdateConfig(DAccountConfig updateAccountConfig) {
        return false;
    }

    @Override
    public boolean canAddConfig(DAccountConfig newAccountConfig) {
        return false;
    }

}
