package net.caltona.simplefinance.service.transaction;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import net.caltona.simplefinance.db.model.DTransaction;
import net.caltona.simplefinance.service.Validation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@EqualsAndHashCode
@AllArgsConstructor
public class Balance implements Transaction {

    @NonNull
    private LocalDate date;

    @NonNull
    private BigDecimal value;

    @Override
    public DTransaction.Type type() {
        return DTransaction.Type.BALANCE;
    }

    @Override
    public LocalDate date() {
        return date;
    }

    @Override
    public BigDecimal balance(BigDecimal value) {
        return this.value;
    }

    @Override
    public BigDecimal transfer(BigDecimal value) {
        return value;
    }

    @Override
    public BigDecimal transferReverse(BigDecimal value) {
        return value;
    }

    @Override
    public Validation canAddTo(List<Transaction> transactions) {
        if (transactions.stream().anyMatch(transaction -> transaction.type() == DTransaction.Type.BALANCE && transaction.date().equals(date))) {
            return new Validation("Balance already exists on this date");
        }
        return new Validation();
    }
}
