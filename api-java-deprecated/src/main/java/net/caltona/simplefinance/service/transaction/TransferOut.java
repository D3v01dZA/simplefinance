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
public class TransferOut implements Transaction {

    @NonNull
    private LocalDate date;

    @NonNull
    private BigDecimal value;

    @Override
    public DTransaction.Type type() {
        return DTransaction.Type.TRANSFER;
    }

    @Override
    public LocalDate date() {
        return date;
    }

    @Override
    public BigDecimal balance(BigDecimal value) {
        return value;
    }

    @Override
    public BigDecimal transfer(BigDecimal value) {
        return value.subtract(this.value);
    }

    @Override
    public Validation canAddTo(List<Transaction> transactions) {
        return new Validation();
    }
}
